import { type Request, type Response } from 'express';
import { Types } from 'mongoose';

import Score from '../models/score.model.js';
import Team from '../models/team.model.js';

import { type AuthRequest } from '../middleware/auth.middleware.js';
export const getMyScores = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const scores = await Score.find({
      judgeId:
        new Types.ObjectId(req.user!.id),
    })
      .select(
        'teamId innovation technicality presentation total feedback updatedAt'
      )
      .sort({ updatedAt: -1 });

    res.status(200).json(scores);

  } catch (error) {
    console.error(
      'Get My Scores Error:',
      error
    );

    res.status(500).json({
      error: 'Failed to fetch mentor scores',
    });
  }
};
export const addScore = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      teamId,
      criteria,
      comment,
    } = req.body;

    const judgeId = req.user!.id;

    if (!teamId || !criteria) {
      res.status(400).json({
        error: 'Team and score criteria are required',
      });
      return;
    }

    const {
      innovation,
      technicality,
      presentation,
    } = criteria;

    const values = [
      innovation,
      technicality,
      presentation,
    ];

    const areValid =
      values.every(
        (value) =>
          Number.isFinite(value) &&
          value >= 0 &&
          value <= 10
      );

    if (!areValid) {
      res.status(400).json({
        error:
          'Each score must be between 0 and 10',
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

    // Don't allow a team member to score their own team.
    const isTeamMember =
      team.teamMembers.some(
        (memberId) =>
          memberId.toString() === judgeId
      );

    if (isTeamMember) {
      res.status(403).json({
        error:
          'You cannot score your own team',
      });
      return;
    }

    const total =
      innovation +
      technicality +
      presentation;

    const score =
      await Score.findOneAndUpdate(
        {
          teamId:
            new Types.ObjectId(teamId),

          judgeId:
            new Types.ObjectId(judgeId),
        },
        {
          $set: {
            innovation,
            technicality,
            presentation,
            total,
            feedback: comment || '',
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
        }
      );

    res.status(200).json(score);

  } catch (error) {
    console.error(
      'Add Score Error:',
      error
    );

    res.status(500).json({
      error: 'Failed to submit score',
    });
  }
};

export const submitScore = async (req: AuthRequest, res: Response): Promise<void> => {
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
export const getLeaderboard = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const leaderboard =
      await Score.aggregate([
        {
          $group: {
            _id: '$teamId',

            averageScore: {
              $avg: '$total',
            },

            averageInnovation: {
              $avg: '$innovation',
            },

            averageTechnicality: {
              $avg: '$technicality',
            },

            averagePresentation: {
              $avg: '$presentation',
            },

            judgesCount: {
              $sum: 1,
            },
          },
        },

        {
          $lookup: {
            from: 'teams',
            localField: '_id',
            foreignField: '_id',
            as: 'team',
          },
        },

        {
          $unwind: '$team',
        },

        {
          $sort: {
            averageScore: -1,
            judgesCount: -1,
          },
        },

        {
          $project: {
            _id: 0,

            teamId: '$_id',

            teamName: '$team.teamName',

            repo: '$team.githubRepo',

            averageScore: {
              $round: [
                '$averageScore',
                1,
              ],
            },

            innovation: {
              $round: [
                '$averageInnovation',
                1,
              ],
            },

            technicality: {
              $round: [
                '$averageTechnicality',
                1,
              ],
            },

            presentation: {
              $round: [
                '$averagePresentation',
                1,
              ],
            },

            judgesCount: 1,
          },
        },
      ]);

    res.status(200).json(
      leaderboard
    );

  } catch (error) {
    console.error(
      'Leaderboard Error:',
      error
    );

    res.status(500).json({
      error: 'Failed to fetch leaderboard',
    });
  }
};