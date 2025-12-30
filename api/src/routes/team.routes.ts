import express from 'express';
import { createTeam, joinTeam, getTeam, getMyTeam} from '../controllers/teamController.js';
import { protect } from '../middleware/auth.middleware.js';
const router = express.Router();
router.post('/create', createTeam);
router.post('/join/:teamId', protect, joinTeam);
router.get('/:teamId', protect, getTeam);
router.get('/my-team', protect, getMyTeam);
export default router;