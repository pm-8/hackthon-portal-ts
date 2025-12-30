import express from 'express';
import { webhookHandler } from '../controllers/githubController.js';
const router = express.Router();
router.post('/webhook/:teamId', webhookHandler);

export default router;