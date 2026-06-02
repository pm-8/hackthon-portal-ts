import { type Request, type Response } from 'express';
import { Types } from 'mongoose';
import Team from '../models/team.model.js';
import User from '../models/user.model.js'; // <-- NEW: We need to update the user!
import Commit from '../models/commit.model.js';
import { createWebhook } from '../utils/github.util.js';
import { type AuthRequest } from '../middleware/auth.middleware.js';

export const createTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamName, githubRepo } = req.body; 
    
    // AuthMiddleware guarantees user exists
    const userId = req.user!.id; 
    console.log('Creating team for user:', req.user!.fullName);

    // 1. Check if user is already in a team
    const existingUser = await User.findById(userId);
    if (existingUser?.teamId) {
      res.status(400).json({ error: 'You are already in a team!' });
      return;
    }

    // 2. Create the Team
    const newTeam = await Team.create({
      teamName,
      teamLeader: new Types.ObjectId(userId),
      teamMembers: [new Types.ObjectId(userId)], 
      githubRepo
    });

    // 3. LINK THE USER TO THE TEAM (CRITICAL FIX)
    await User.findByIdAndUpdate(userId, { teamId: newTeam._id });

    // 4. Try to create the webhook
    if (githubRepo) {
      try {
        await createWebhook(githubRepo, newTeam._id.toString());
      } catch (webhookError) {
        console.error("Webhook creation failed, but team was created:", webhookError);
        // We don't want to crash the whole request if just the webhook fails
      }
    }

    // 5. Populate and return
    await newTeam.populate('teamMembers', 'fullName email githubUsername avatarUrl');
    res.status(201).json(newTeam);

  } catch (error) {
    console.error('Create Team Error:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
};

export const joinTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId } = req.params;
    const userId = req.user!.id;

    // 1. Check if user is already in a team
    const existingUser = await User.findById(userId);
    if (existingUser?.teamId) {
      res.status(400).json({ error: 'You are already in a team! Leave it first to join another.' });
      return;
    }

    const team = await Team.findById(teamId);
    if (!team) {
       res.status(404).json({ error: 'Team not found' });
       return;
    }

    const isMember = team.teamMembers.some(memberId => memberId.toString() === userId);
    if (isMember) {
      res.status(400).json({ error: 'User already in team' });
      return;
    }
    
    // 2. Add user to team
    team.teamMembers.push(new Types.ObjectId(userId));
    await team.save();

    // 3. LINK THE USER TO THE TEAM (CRITICAL FIX)
    await User.findByIdAndUpdate(userId, { teamId: team._id });

    await team.populate('teamMembers', 'fullName email githubUsername avatarUrl');
    res.status(200).json(team);

  } catch (error) {
    console.error('Join Team Error:', error);
    res.status(500).json({ error: 'Failed to join team' });
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