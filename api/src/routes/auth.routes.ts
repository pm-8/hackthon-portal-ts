import {
  githubLogin,
  githubCallback,
  logout,
  getCurrentUser,
} from '../controllers/authController.js';

import { protect } from '../middleware/auth.middleware.js';
import express from "express";

const router = express.Router();
router.get(
  '/me',
  protect,
  getCurrentUser
);
// 1. Route to initiate GitHub OAuth
// The frontend will link to this URL (e.g., <a href="http://localhost:5000/api/auth/github">Login</a>)
router.get('/github', githubLogin);

// 2. Route that GitHub redirects to after the user authorizes
// This MUST match the "Authorization callback URL" in your GitHub OAuth App settings
router.get('/github/callback', githubCallback);

// 3. Route to logout and clear the JWT cookie
router.post('/logout', logout);

export default router;