import { type Request, type Response } from 'express';
import { Types } from 'mongoose';
import Score from '../models/score.model.js';
import { type AuthRequest } from '../middleware/auth.middleware.js';

export const submitScore = async (req: AuthRequest, res: Response) => {
  try {
    const { teamId, innovation, technicality, presentation, feedback } = req.body;
    const judgeId = req.user?.id;
    const score = await Score.findOneAndUpdate(
      { 
        teamId: new Types.ObjectId(teamId), 
        judgeId: new Types.ObjectId(judgeId) 
      },
      { 
        innovation, 
        technicality, 
        presentation, 
        feedback,
        total: innovation + technicality + presentation 
      },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(200).json(score);
  } catch (error) {
    console.error('Submit Score Error:', error);
    res.status(500).json({ error: 'Failed to submit score' });
  }
};
export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const leaderboard = await Score.aggregate([
      {
        $group: {
          _id: '$teamId',
          averageScore: { $avg: '$total' },
          scoreCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'teams',
          localField: '_id',
          foreignField: '_id',
          as: 'teamDetails'
        }
      },
      { $unwind: '$teamDetails' },
      { $sort: { averageScore: -1 } },
      {
        $project: {
          _id: 0,
          teamId: '$_id',
          teamName: '$teamDetails.teamName',
          repo: '$teamDetails.githubRepo',
          averageScore: { $round: ['$averageScore', 1] },
          judgesCount: '$scoreCount'
        }
      }
    ]);
    res.status(200).json(leaderboard);
  } catch (error) {
    console.error('Leaderboard Error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
};