import { type Request, type Response } from 'express';
import { Types } from 'mongoose';
import Team from '../models/team.model.js';
import Commit from '../models/commit.model.js';
import { createWebhook } from '../utils/github.util.js';
import { type AuthRequest } from '../middleware/auth.middleware.js'; 

export const createTeam = async (req: AuthRequest, res: Response) => {
  try {
    const { teamName, githubRepo } = req.body; 
    
    // 1. Use '!' because AuthMiddleware guarantees user exists
    const userId = req.user!.id; 
    console.log('Creating team for user:', req.user!.fullName);
    const newTeam = await Team.create({
      teamName,
      teamLeader: new Types.ObjectId(userId),
      teamMembers: [new Types.ObjectId(userId)], 
      githubRepo
    });

    if (githubRepo) {
       await createWebhook(githubRepo, newTeam._id.toString());
    }

    // 3. FIX: Populate the user details immediately so frontend gets the username
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
    const userId = req.user!.id;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    const isMember = team.teamMembers.some(memberId => memberId.toString() === userId);
    if (isMember) {
      return res.status(400).json({ error: 'User already in team' });
    }
    
    team.teamMembers.push(new Types.ObjectId(userId));
    await team.save();

    // 4. FIX: Populate here too so the response includes the new member's name
    await team.populate('teamMembers', 'fullName email githubUsername');

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
      .populate('teamMembers', 'fullName email githubUsername'); // This was already correct!
    
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
    const userId = req.user!.id; 
    
    // 5. FIX: Convert string ID to ObjectId AND populate the result
    const team = await Team.findOne({ 
      teamMembers: new Types.ObjectId(userId) 
    })
    .populate('teamMembers', 'fullName email githubUsername');
    
    if (!team) {
      return res.status(200).json(null);
    }

    res.status(200).json(team);
  } catch (error) {
    console.error('Get My Team Error:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
};
export const getAllTeams = async (req: Request, res: Response) => {
  try {
    const teams = await Team.find()
      .populate('teamMembers', 'fullName email githubUsername') // Show who is in the team
      .populate('commits'); // Show commit count if needed
      console.log('Fetched teams:', teams.length);
    res.status(200).json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
};