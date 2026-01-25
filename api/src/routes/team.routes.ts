import express from 'express';
import { 
  createTeam, 
  getMyTeam, 
  getTeam, 
  joinTeam, 
  getAllTeams 
} from '../controllers/teamController.js'; 
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();
router.use((req, res, next) => {
  console.log('Team Route Hit:', req.path);
  next();
});

// 1. SPECIFIC ROUTES (Must be at the TOP)
router.get('/all', protect, (req, res, next) => {
  console.log('Matched /all route!'); 
  getAllTeams(req, res).catch(next);
});

router.get('/my-team', protect, (req, res, next) => {
  console.log('Matched /my-team route!');
  getMyTeam(req, res).catch(next);
});

router.post('/create', protect, createTeam);

// 2. DYNAMIC ROUTES (Must be at the BOTTOM)
// If '/all' is matching here, you will see "Matched /:teamId route" in the console
router.get('/:teamId', protect, (req, res, next) => {
  console.log('Matched /:teamId route with ID:', req.params.teamId);
  getTeam(req, res).catch(next);
});

router.post('/:teamId/join', protect, joinTeam);

export default router;