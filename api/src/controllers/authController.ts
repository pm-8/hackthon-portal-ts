import { type Request, type Response } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../models/user.model.js';

// 1. Redirect user to GitHub's OAuth page
const githubLogin = (req: Request, res: Response) => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=read:user user:email`;
  res.redirect(githubAuthUrl);
};

// 2. Handle the callback from GitHub
const githubCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.query;

    if (!code) {
      res.status(400).json({ error: 'No code provided by GitHub' });
      return;
    }

    // Step 1: Exchange the code for an Access Token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      res.status(400).json({ error: 'Failed to fetch access token from GitHub' });
      return;
    }

    // Step 2: Fetch the user's GitHub profile
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const githubProfile = userResponse.data;

    // Step 3: Fetch the user's email (sometimes it's hidden in the main profile)
    let email = githubProfile.email;
    if (!email) {
      const emailResponse = await axios.get('https://api.github.com/user/emails', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      // Find the primary, verified email
      const primaryEmailObj = emailResponse.data.find(
        (e: any) => e.primary === true && e.verified === true
      );
      email = primaryEmailObj ? primaryEmailObj.email : null;
    }

    if (!email) {
      res.status(400).json({ error: 'GitHub email is required to register.' });
      return;
    }

    // Step 4: Find or Create the User in our Database
    let user = await User.findOne({ githubId: githubProfile.id.toString() });

    if (!user) {
      // Create new user if they don't exist
      user = await User.create({
        githubId: githubProfile.id.toString(),
        githubUsername: githubProfile.login,
        email: email,
        fullName: githubProfile.name || githubProfile.login, // Fallback to username if name is null
        avatarUrl: githubProfile.avatar_url,
        role: UserRole.HACKER, // Default role
      });
    }

    // Step 5: Issue our own JWT Token for the frontend
    const token = jwt.sign(
      { id: user._id, role: user.role, fullName: user.fullName },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' } // 7 days is good for a hackathon
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // 'lax' is better for OAuth redirects than 'strict'
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days
    });

    // Step 6: Redirect back to your Frontend (React App)
    const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${FRONTEND_URL}/dashboard`);

  } catch (error) {
    console.error('GitHub OAuth Error:', error);
    res.status(500).json({ error: 'Internal Server Error during Authentication' });
  }
};

// 3. Logout remains mostly the same
const logout = (req: Request, res: Response) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
  
  res.status(200).json({ message: 'Logged out successfully' });
};

export { githubLogin, githubCallback, logout };