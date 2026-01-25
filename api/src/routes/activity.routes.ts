import express from 'express';
import { getTeamActivities } from '../controllers/activityController.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.get('/:teamId', protect, getTeamActivities);

export default router;