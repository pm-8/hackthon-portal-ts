import { type Request, type Response } from 'express';
import { Types } from 'mongoose';
import Team from '../models/team.model.js';
import User from '../models/user.model.js'; 
import Commit from '../models/commit.model.js';
import { parseGitHubRepoUrl,addRepositoryCollaborator } from '../utils/github.util.js';
import { type AuthRequest } from '../middleware/auth.middleware.js';
import {
  getOrCreateHackathon,
} from '../utils/hackathon.util.js';
export const createTeam = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { teamName, githubRepo } = req.body;

    const userId = req.user!.id;

    if (!teamName || !githubRepo) {
      res.status(400).json({
        error: 'Team name and GitHub repository are required',
      });
      return;
    }

    // Validate repo URL before creating anything.
    parseGitHubRepoUrl(githubRepo);

    const existingUser = await User.findById(userId);

    if (existingUser?.teamId) {
      res.status(400).json({
        error: 'You are already in a team!',
      });
      return;
    }

    const newTeam = await Team.create({
      teamName,
      teamLeader: new Types.ObjectId(userId),
      teamMembers: [new Types.ObjectId(userId)],
      githubRepo,
      githubConnected: false,
    });

    await User.findByIdAndUpdate(
      userId,
      { teamId: newTeam._id }
    );

    await newTeam.populate(
      'teamMembers',
      'fullName email githubUsername avatarUrl'
    );

    res.status(201).json({
      team: newTeam,
      githubConnected: false,
    });

  } catch (error: any) {
    console.error('Create Team Error:', error);

    res.status(500).json({
      error:
        error.message || 'Failed to create team',
    });
  }
};
export const joinTeam = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { teamId } = req.params;
    const userId = req.user!.id;

    const hackathon =
      await getOrCreateHackathon();

    const existingUser =
      await User.findById(userId);

    if (!existingUser) {
      res.status(404).json({
        error: 'User not found',
      });
      return;
    }

    if (existingUser.teamId) {
      res.status(400).json({
        error:
          'You are already in a team! Leave it first to join another.',
      });
      return;
    }

    if (
      !teamId ||
      !Types.ObjectId.isValid(teamId)
    ) {
      res.status(400).json({
        error: 'Invalid team ID',
      });
      return;
    }

    const team =
      await Team.findById(teamId);

    if (!team) {
      res.status(404).json({
        error: 'Team not found',
      });
      return;
    }

    if (
      team.teamMembers.length >=
      hackathon.maxTeamSize
    ) {
      res.status(409).json({
        error: `This team is full. Maximum team size is ${hackathon.maxTeamSize}.`,
      });
      return;
    }

    const isAlreadyMember =
      team.teamMembers.some(
        (memberId) =>
          memberId.toString() === userId
      );

    if (isAlreadyMember) {
      res.status(400).json({
        error: 'User already in team',
      });
      return;
    }

    /*
     * --------------------------------------------------
     * STEP 1
     * Verify that the team is actually connected
     * to GitHub before attempting collaborator access.
     * --------------------------------------------------
     */

    if (
      !team.githubConnected ||
      !team.githubInstallationId ||
      !team.githubOwner ||
      !team.githubRepoName
    ) {
      res.status(409).json({
        error:
          'This team has not connected its GitHub repository yet.',
      });

      return;
    }

    /*
     * --------------------------------------------------
     * STEP 2
     * Add the user on GitHub FIRST.
     *
     * This prevents our DB from saying:
     *
     * "User is in team"
     *
     * while GitHub says:
     *
     * "User has no repository access."
     * --------------------------------------------------
     */

    let githubAccess:
      | 'added'
      | 'invited';

    try {
      const result =
        await addRepositoryCollaborator(
          team.githubInstallationId,
          team.githubOwner,
          team.githubRepoName,
          existingUser.githubUsername
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

      res.status(502).json({
        error:
          'Could not grant GitHub repository access. You have not been added to the team.',
        github:
          githubError.response?.data ||
          githubError.message,
      });

      return;
    }

    /*
     * --------------------------------------------------
     * STEP 3
     * GitHub succeeded.
     * Now update MongoDB.
     * --------------------------------------------------
     */

    team.teamMembers.push(
      new Types.ObjectId(userId)
    );

    await team.save();

    await User.findByIdAndUpdate(
      userId,
      {
        teamId: team._id,
      }
    );

    /*
     * --------------------------------------------------
     * STEP 4
     * Populate response.
     * --------------------------------------------------
     */

    await team.populate(
      'teamMembers',
      'fullName email githubUsername avatarUrl'
    );

    res.status(200).json({
      team,
      githubAccess,
      message:
        githubAccess === 'invited'
          ? 'You joined the team. GitHub sent you a repository invitation; accept it to get repository access.'
          : 'You joined the team and already have GitHub repository access.',
    });

  } catch (error) {
    console.error(
      'Join Team Error:',
      error
    );

    res.status(500).json({
      error: 'Failed to join team',
    });
  }
};
export const getTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId)
      .populate('teamMembers', 'fullName email githubUsername avatarUrl'); 
    
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }
    
    const commits = await Commit.find({ teamId: new Types.ObjectId(teamId) }).sort({ createdAt: -1 }); // Sort newest first
    res.status(200).json({ team, commits });
  } catch (error) {
    console.error('Get Team Error:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
};

export const getMyTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id; 
    
    const team = await Team.findOne({ 
      teamMembers: new Types.ObjectId(userId) 
    })
    .populate('teamMembers', 'fullName email githubUsername avatarUrl');
    
    if (!team) {
      res.status(200).json(null);
      return;
    }

    res.status(200).json(team);
  } catch (error) {
    console.error('Get My Team Error:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
};

export const getAllTeams = async (req: Request, res: Response): Promise<void> => {
  try {
    const teams = await Team.find()
      .populate('teamMembers', 'fullName email githubUsername avatarUrl');
      
    console.log(`Fetched ${teams.length} teams`);
    res.status(200).json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
};