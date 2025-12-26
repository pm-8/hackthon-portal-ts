import { Request, Response } from 'express';
import Team from '../models/team.model';
import User from '../models/user.model';
import Commit from '../models/commit.model';
import { createWebhook } from '../utils/github.util';
import { AuthRequest } from '../middlewares/auth.middleware'; // To access req.user

// --- Create Team ---
export const createTeam = async (req: AuthRequest, res: Response) => {
  try {
    const { teamName, githubRepo, teamMembers } = req.body;
    const userId = req.user?.id; // Get ID from the logged-in user

    // 1. Create the Team in DB
    const newTeam = await Team.create({
      teamName,
      teamLeader: userId, // The creator is the leader
      teamMembers: [userId], // Creator is the first member
      githubRepo
    });

    // 2. Call GitHub Utility directly (No axios call to self!)
    if (githubRepo) {
       await createWebhook(githubRepo, newTeam._id as string);
    }

    res.status(201).json(newTeam);
  } catch (error) {
    console.error('Create Team Error:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
};

// --- Join Team ---
export const joinTeam = async (req: AuthRequest, res: Response) => {
  try {
    const { teamId } = req.params;
    const userId = req.user?.id;

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Check if already a member
    if (team.teamMembers.includes(userId as any)) {
      return res.status(400).json({ error: 'User already in team' });
    }

    // Add user
    team.teamMembers.push(userId as any);
    await team.save();

    res.status(200).json(team);
  } catch (error) {
    console.error('Join Team Error:', error);
    res.status(500).json({ error: 'Failed to join team' });
  }
};

// --- Get Team Details ---
export const getTeam = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;

    // Fetch team and populate members' details (hide password)
    const team = await Team.findById(teamId)
      .populate('teamMembers', 'fullName email githubUsername');

    if (!team) return res.status(404).json({ error: 'Team not found' });

    // Fetch commits for this team
    const commits = await Commit.find({ teamId });

    res.status(200).json({ team, commits });
  } catch (error) {
    console.error('Get Team Error:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
};