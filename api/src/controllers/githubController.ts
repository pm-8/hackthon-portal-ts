import { type Request, type Response } from 'express';
import { Types } from 'mongoose';
import Team from '../models/team.model.js';
import Commit from '../models/commit.model.js';
export const webhookHandler = async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const eventType = req.headers['x-github-event'];
    const payload = req.body;
    console.log(`Received GitHub event: ${eventType} for team: ${teamId}`);
    if (eventType === 'push') {
      const commits = payload.commits;
      if (!commits || commits.length === 0) {
        return res.status(200).send('No commits to process');
      }
      const latestCommit = commits[0];
      console.log('Processing commit:', latestCommit.message);
      const newCommit = await Commit.create({
        teamId: new Types.ObjectId(teamId),
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
    }
    res.status(200).send('Webhook received successfully');
  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
};