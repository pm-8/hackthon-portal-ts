import { type Response } from 'express';
import Activity from '../models/activity.model.js';
import { type AuthRequest } from '../middleware/auth.middleware.js';
import { Types } from 'mongoose';

export const getTeamActivities = async (req: AuthRequest, res: Response) => {
  try {
    const { teamId } = req.params;
    
    // Fetch last 20 activities, populate user to show their name
    const activities = await Activity.find({ teamId: new Types.ObjectId(teamId) })
      .sort({ createdAt: -1 }) // Newest first
      .limit(20)
      .populate('user', 'fullName'); // Get the name of the person who did it

    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
};