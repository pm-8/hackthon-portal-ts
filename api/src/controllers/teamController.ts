import { type Request, type Response } from 'express';
import { Types } from 'mongoose';
import Team from '../models/team.model.js';
import Commit from '../models/commit.model.js';
import { createWebhook } from '../utils/github.util.js';
import { type AuthRequest } from '../middleware/auth.middleware.js'; 
export const createTeam = async (req: AuthRequest, res: Response) => {
  try {
    const { teamName, githubRepo } = req.body; 
    console.log(req.user);// Removed teamMembers from body (security)
    // const userId = req.user!.id;
    const userId = req.user?.id;
    const newTeam = await Team.create({
      teamName,
      teamLeader: new Types.ObjectId(userId),
      teamMembers: [new Types.ObjectId(userId)], // Store just the ID
      githubRepo
    });

    if (githubRepo) {
       await createWebhook(githubRepo, newTeam._id.toString());
    }

    // FIX: Fetch the full user details (username, email) before sending response
    await newTeam.populate('teamMembers', 'fullName email githubUsername');

    res.status(201).json(newTeam);
  } catch (error) {
    console.error('Create Team Error:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
};
export const joinTeam = async (req: AuthRequest, res: Response) => {
  try {
    const { teamId } = req.params;
    const userId = req.user?.id;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    const isMember = team.teamMembers.some(memberId => memberId.toString() === userId);
    if (isMember) {
      return res.status(400).json({ error: 'User already in team' });
    }
    team.teamMembers.push(new Types.ObjectId(userId));
    await team.save();
    res.status(200).json(team);
  } catch (error) {
    console.error('Join Team Error:', error);
    res.status(500).json({ error: 'Failed to join team' });
  }
};
export const getTeam = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId)
      .populate('teamMembers', 'fullName email githubUsername');
    if (!team) return res.status(404).json({ error: 'Team not found' });
    const commits = await Commit.find({ teamId: new Types.ObjectId(teamId) });
    res.status(200).json({ team, commits });
  } catch (error) {
    console.error('Get Team Error:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
};
export const getMyTeam = async (req: AuthRequest, res: Response) => {
  try {
    // 2. Use '!' to tell TypeScript we are sure the user is logged in
    const userId = req.user!.id; 
    
    // 3. Convert the string userId to a real ObjectId for the query
    const team = await Team.findOne({ 
      teamMembers: new Types.ObjectId(userId) 
    });
    
    if (!team) {
      return res.status(200).json(null);
    }

    res.status(200).json(team);
  } catch (error) {
    console.error('Get My Team Error:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
};