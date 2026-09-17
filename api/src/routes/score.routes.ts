import express from 'express';

import {
  addScore,
  getLeaderboard,
  getMyScores,
} from '../controllers/scoreController.js';

import {
  protect,
  authorize,
} from '../middleware/auth.middleware.js';

import { UserRole } from '../models/user.model.js';

const router = express.Router();

// Public leaderboard
router.get(
  '/leaderboard',
  getLeaderboard
);

// Mentor/Admin scoring
router.post(
  '/add',
  protect,
  authorize(
    UserRole.MENTOR,
    UserRole.ADMIN
  ),
  addScore
);

// Scores given by the currently logged-in mentor
router.get(
  '/mine',
  protect,
  authorize(
    UserRole.MENTOR,
    UserRole.ADMIN
  ),
  getMyScores
);

export default router;