import { type Request, type Response } from 'express';
import { Types } from 'mongoose';
import Team from '../models/team.model.js';
import Commit from '../models/commit.model.js';
import User from '../models/user.model.js'; 
import { logActivity } from '../utils/activity.utils.js'; 

export const webhookHandler = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const eventType = req.headers['x-github-event'];
    const payload = req.body;
    if (!teamId) {
      return res.status(400).send('Team ID is required in the URL');
    }

    console.log(`Received GitHub event: ${eventType} for team: ${teamId}`);

    if (eventType === 'push') {
      const commits = payload.commits;
      if (!commits || commits.length === 0) {
        return res.status(200).send('No commits to process');
      }

      // Note: This grabs the first commit in the batch. 
      // In a production app, you might want to loop through all 'commits'
      const latestCommit = commits[0];
      console.log('Processing commit:', latestCommit.message);

      // --- SAVE TO DATABASE ---
      const newCommit = await Commit.create({
        teamId: new Types.ObjectId(teamId), // Safe now because we checked teamId above
        commitId: latestCommit.id,
        repoUrl: payload.repository.html_url,
        commitMessage: latestCommit.message,
        committerName: latestCommit.committer.name,
        committerEmail: latestCommit.committer.email,
        commitUrl: latestCommit.url,
        committedAt: new Date(latestCommit.timestamp)
      });

      console.log('Commit saved:', newCommit._id);

      await Team.findByIdAndUpdate(
        teamId,
        { $push: { commits: newCommit._id } }
      );
      
      console.log('Team updated with new commit');

      // --- LOG TO ACTIVITY FEED ---
      
      // 1. Identify the user who pushed
      const githubUsername = payload.pusher.name; 
      
      // 2. Find that user in our Database
      const user = await User.findOne({ githubUsername });

      if (user) {
        // 3. Log the activity
        // We pass teamId (string) and user._id (ObjectId).
        // Our updated activity.utils.ts handles these types automatically now.
        await logActivity(
          teamId,
          user._id, 
          'pushed code', 
          latestCommit.message 
        );
        console.log('Activity logged to dashboard');
      } else {
        console.warn(`User with GitHub username '${githubUsername}' not found in DB. Activity skipped.`);
      }
    }

    res.status(200).send('Webhook received successfully');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
};