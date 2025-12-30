import express from 'express';
import { sendInvite, getMyInvites, respondToInvite } from '../controllers/inviteController.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/send', protect, sendInvite);
router.get('/my-invites', protect, getMyInvites);
router.post('/respond', protect, respondToInvite);

export default router;
