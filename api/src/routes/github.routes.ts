import express from 'express';

import {
  webhookHandler,
} from '../controllers/githubController.js';

import {
  startGitHubInstallation,
  githubInstallationCallback,
} from '../controllers/githubAppController.js';

import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// User clicks "Connect GitHub"
router.get(
  '/install/:teamId',
  protect,
  startGitHubInstallation
);

// GitHub redirects browser here after installation
router.get(
  '/install/callback',
  githubInstallationCallback
);

// GitHub App webhook endpoint
router.post(
  '/webhook',
  webhookHandler
);

export default router;