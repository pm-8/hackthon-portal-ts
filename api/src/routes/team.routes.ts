import express from 'express';
import { 
  createTeam, 
  joinTeam, 
  getTeam, 
  getMyTeam, 
  getAllTeams 
} from '../controllers/teamController.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All team routes require the user to be logged in, so we use the 'protect' middleware!

// 1. Get the current user's team (must come BEFORE /:teamId so it doesn't confuse 'my-team' with an ID)
router.get('/my-team', protect, getMyTeam);

// 2. Create a new team
router.post('/', protect, createTeam);

// 3. Join an existing team by ID
router.post('/:teamId/join', protect, joinTeam);

// 4. Get a specific team by ID
router.get('/:teamId', protect, getTeam);

// 5. Get all teams (useful for a leaderboard or admin dashboard later)
router.get('/', protect, getAllTeams);

export default router;