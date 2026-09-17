import { type Response } from 'express';
import { Types } from 'mongoose';

import Invite from '../models/invite.model.js';
import User from '../models/user.model.js';
import Team from '../models/team.model.js';

import {
  addRepositoryCollaborator,
} from '../utils/github.util.js';

import {
  type AuthRequest,
} from '../middleware/auth.middleware.js';

// --------------------------------------------------
// SEND INVITE
// --------------------------------------------------

export const sendInvite = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const {
      teamId,
      email,
    } = req.body;

    const senderId =
      req.user!.id;

    if (!teamId || !email) {
      return res.status(400).json({
        error:
          'Team ID and email are required.',
      });
    }

    if (!Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({
        error: 'Invalid team ID.',
      });
    }

    const team =
      await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({
        error: 'Team not found.',
      });
    }

    // Sender must actually belong to the team.
    const senderIsMember =
      team.teamMembers.some(
        (memberId) =>
          memberId.toString() ===
          senderId
      );

    if (!senderIsMember) {
      return res.status(403).json({
        error:
          'Only team members can send team invites.',
      });
    }

    // We need GitHub connected because
    // accepting the invite will provision
    // repository access.
    if (
      !team.githubConnected ||
      !team.githubInstallationId ||
      !team.githubOwner ||
      !team.githubRepoName
    ) {
      return res.status(409).json({
        error:
          'Connect the GitHub repository before inviting members.',
      });
    }

    const receiver =
      await User.findOne({
        email:
          email.trim().toLowerCase(),
      });

    if (!receiver) {
      return res.status(404).json({
        error:
          'User with this email does not exist.',
      });
    }

    if (
      receiver._id.toString() ===
      senderId
    ) {
      return res.status(400).json({
        error:
          'You cannot invite yourself.',
      });
    }

    if (receiver.teamId) {
      return res.status(400).json({
        error:
          'This user is already in a team.',
      });
    }

    // Keep this consistent with your
    // current maximum team size.
    if (team.teamMembers.length >= 4) {
      return res.status(409).json({
        error:
          'This team is full.',
      });
    }

    const alreadyMember =
      team.teamMembers.some(
        (memberId) =>
          memberId.toString() ===
          receiver._id.toString()
      );

    if (alreadyMember) {
      return res.status(400).json({
        error:
          'User is already in the team.',
      });
    }

    const invite =
      await Invite.create({
        teamId: team._id,
        senderId,
        receiverEmail:
          receiver.email,
      });

    return res.status(201).json({
      message: 'Invite sent!',
      invite,
    });

  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({
        error:
          'Invite already sent to this user.',
      });
    }

    console.error(
      'Send Invite Error:',
      error
    );

    return res.status(500).json({
      error:
        'Failed to send invite',
    });
  }
};

// --------------------------------------------------
// GET MY INVITES
// --------------------------------------------------

export const getMyInvites = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user =
      await User.findById(
        req.user!.id
      );

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    const invites =
      await Invite.find({
        receiverEmail: user.email,
        status: 'pending',
      })
        .populate(
          'teamId',
          'teamName githubRepo githubConnected'
        )
        .populate(
          'senderId',
          'fullName githubUsername'
        );

    return res.status(200).json(
      invites
    );

  } catch (error) {
    console.error(
      'Get Invites Error:',
      error
    );

    return res.status(500).json({
      error:
        'Failed to fetch invites',
    });
  }
};

// --------------------------------------------------
// ACCEPT / REJECT INVITE
// --------------------------------------------------

export const respondToInvite = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const {
      inviteId,
      status,
    } = req.body;

    const userId =
      req.user!.id;

    if (
      !inviteId ||
      !['accepted', 'rejected']
        .includes(status)
    ) {
      return res.status(400).json({
        error:
          'Invalid invite request.',
      });
    }

    const invite =
      await Invite.findById(
        inviteId
      );

    if (!invite) {
      return res.status(404).json({
        error:
          'Invite not found',
      });
    }

    if (invite.status !== 'pending') {
      return res.status(400).json({
        error:
          'This invite has already been handled.',
      });
    }

    const user =
      await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        error:
          'User not found',
      });
    }

    // VERY IMPORTANT:
    // Prevent a random logged-in user
    // from accepting someone else's invite.
    if (
      invite.receiverEmail !==
      user.email
    ) {
      return res.status(403).json({
        error:
          'This invite does not belong to you.',
      });
    }

    // ----------------------------
    // REJECT
    // ----------------------------

    if (status === 'rejected') {
      invite.status = 'rejected';

      await invite.save();

      return res.status(200).json({
        message:
          'Invite rejected.',
      });
    }

    // ----------------------------
    // ACCEPT
    // ----------------------------

    if (user.teamId) {
      return res.status(400).json({
        error:
          'You are already in a team. Leave your current team first.',
      });
    }

    const team =
      await Team.findById(
        invite.teamId
      );

    if (!team) {
      return res.status(404).json({
        error:
          'Team no longer exists.',
      });
    }

    if (team.teamMembers.length >= 4) {
      return res.status(409).json({
        error:
          'This team is already full.',
      });
    }

    const alreadyMember =
      team.teamMembers.some(
        (memberId) =>
          memberId.toString() ===
          user._id.toString()
      );

    if (alreadyMember) {
      invite.status =
        'accepted';

      await invite.save();

      return res.status(200).json({
        message:
          'You are already a member of this team.',
        githubAccess:
          'already-member',
      });
    }

    // Team must have the GitHub App
    // installed and connected.
    if (
      !team.githubConnected ||
      !team.githubInstallationId ||
      !team.githubOwner ||
      !team.githubRepoName
    ) {
      return res.status(409).json({
        error:
          'The team has not connected its GitHub repository yet.',
      });
    }

    // ----------------------------
    // GITHUB ACCESS FIRST
    // ----------------------------

    let githubAccess:
      | 'added'
      | 'invited';

    try {
      const result =
        await addRepositoryCollaborator(
          team.githubInstallationId,
          team.githubOwner,
          team.githubRepoName,
          user.githubUsername
        );

      githubAccess =
        result.invited
          ? 'invited'
          : 'added';

    } catch (githubError: any) {
      console.error(
        'GitHub collaborator error:',
        githubError.response?.data ||
          githubError.message
      );

      return res.status(502).json({
        error:
          'Could not grant GitHub repository access. The invite was not accepted.',
        github:
          githubError.response?.data ||
          githubError.message,
      });
    }

    // ----------------------------
    // MONGO MEMBERSHIP
    // ----------------------------

    team.teamMembers.push(
      new Types.ObjectId(userId)
    );

    await team.save();

    user.teamId =
      team._id;

    await user.save();

    invite.status =
      'accepted';

    await invite.save();

    // ----------------------------
    // RESPONSE
    // ----------------------------

    return res.status(200).json({
      message:
        githubAccess === 'invited'
          ? 'Joined the team. A GitHub repository invitation was sent; accept it on GitHub to get push access.'
          : 'Joined the team and GitHub repository access is active.',

      githubAccess,
    });

  } catch (error) {
    console.error(
      'Respond To Invite Error:',
      error
    );

    return res.status(500).json({
      error:
        'Failed to respond to invite',
    });
  }
};