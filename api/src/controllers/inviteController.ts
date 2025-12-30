import { type Response } from 'express';
import Invite from '../models/invite.model.js';
import User from '../models/user.model.js';
import Team from '../models/team.model.js';
import { type AuthRequest } from '../middleware/auth.middleware.js';

// --- Send an Invite ---
export const sendInvite = async (req: AuthRequest, res: Response) => {
  try {
    const { teamId, email } = req.body;
    const senderId = req.user!.id;

    // 1. Check if user exists
    const receiver = await User.findOne({ email });
    if (!receiver) {
      return res.status(404).json({ error: 'User with this email does not exist.' });
    }

    // 2. Check if user is already in a team (Optional: depending on your rules)
    // For now, let's assume they can't be invited if they are already in THIS team
    const team = await Team.findById(teamId);
    if (team?.teamMembers.includes(receiver._id)) {
      return res.status(400).json({ error: 'User is already in the team.' });
    }

    // 3. Create Invite
    const invite = await Invite.create({
      teamId,
      senderId,
      receiverEmail: email
    });

    res.status(201).json({ message: 'Invite sent!', invite });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Invite already sent to this user.' });
    }
    res.status(500).json({ error: 'Failed to send invite' });
  }
};

// --- Get My Invites (For the User) ---
export const getMyInvites = async (req: AuthRequest, res: Response) => {
  try {
    const userEmail = req.user!.email; // Assuming your Auth middleware attaches email
    // Or fetch user to get email if not in token
    const user = await User.findById(req.user!.id);
    
    const invites = await Invite.find({ 
      receiverEmail: user?.email, 
      status: 'pending' 
    }).populate('teamId', 'teamName'); // Show team name

    res.status(200).json(invites);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invites' });
  }
};

// --- Accept Invite ---
export const respondToInvite = async (req: AuthRequest, res: Response) => {
  try {
    const { inviteId, status } = req.body; // status: 'accepted' or 'rejected'
    const userId = req.user!.id;

    const invite = await Invite.findById(inviteId);
    if (!invite) return res.status(404).json({ error: 'Invite not found' });

    if (status === 'accepted') {
      // Add user to the team
      await Team.findByIdAndUpdate(invite.teamId, {
        $push: { teamMembers: userId }
      });
      invite.status = 'accepted';
    } else {
      invite.status = 'rejected';
    }

    await invite.save();
    res.status(200).json({ message: `Invite ${status}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to respond to invite' });
  }
};