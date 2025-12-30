import express from 'express';
import { submitScore, getLeaderboard } from '../controllers/scoreController.js';
import { protect, authorize } from '../middleware/auth.middleware.js';
import { UserRole } from '../models/user.model.js';
const router = express.Router();
router.post('/submit', protect, authorize(UserRole.ADMIN), submitScore);
router.get('/leaderboard', getLeaderboard);

export default router;