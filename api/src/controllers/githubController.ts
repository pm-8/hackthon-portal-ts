import crypto from 'crypto';
import { Types } from 'mongoose';
import { type Request, type Response } from 'express';

import Team from '../models/team.model.js';
import Commit from '../models/commit.model.js';
import User from '../models/user.model.js';
import { logActivity } from '../utils/activity.utils.js';

const verifyGitHubSignature = (
  req: Request
): boolean => {
  const secret =
    process.env.GITHUB_APP_WEBHOOK_SECRET;

  const signature =
    req.headers['x-hub-signature-256'];

  const rawBody =
    (req as Request & { rawBody?: Buffer }).rawBody;

  if (!secret || !signature || !rawBody) {
    return false;
  }

  const expected =
    `sha256=${crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex')}`;

  const provided =
    Array.isArray(signature)
      ? signature[0]
      : signature;
  if (!provided) {
    return false;
  }
  const expectedBuffer =
    Buffer.from(expected);

  const providedBuffer =
    Buffer.from(provided);

  if (
    expectedBuffer.length !==
    providedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    expectedBuffer,
    providedBuffer
  );
};

export const webhookHandler = async (
  req: Request,
  res: Response
) => {
  try {
    if (!verifyGitHubSignature(req)) {
      console.warn(
        'Rejected GitHub webhook: invalid signature'
      );

      return res
        .status(401)
        .send('Invalid webhook signature');
    }

    const eventType =
      req.headers['x-github-event'];

    const payload = req.body;

    console.log(
      `Received GitHub event: ${eventType}`
    );

    if (eventType !== 'push') {
      return res
        .status(200)
        .send('Event ignored');
    }

    const repositoryId =
      payload.repository?.id;

    const installationId =
      payload.installation?.id;

    if (!repositoryId || !installationId) {
      return res
        .status(400)
        .send('Missing repository or installation');
    }

    const team = await Team.findOne({
      githubRepoId: repositoryId,
      githubInstallationId: installationId,
      githubConnected: true,
    });

    if (!team) {
      console.warn(
        `No team mapped to GitHub repository ${repositoryId}`
      );

      // Return 200 so GitHub does not keep retrying.
      return res
        .status(200)
        .send('Repository not connected to a team');
    }

    const commits = payload.commits ?? [];

    for (const githubCommit of commits) {
      const newCommit = await Commit.create({
        teamId: team._id,
        commitId: githubCommit.id,
        repoUrl: payload.repository.html_url,
        commitMessage: githubCommit.message,
        committerName:
          githubCommit.committer?.name ||
          payload.sender?.login ||
          'Unknown',
        committerEmail:
          githubCommit.committer?.email,
        commitUrl: githubCommit.url,
        committedAt:
          new Date(githubCommit.timestamp),
      });

      await Team.findByIdAndUpdate(
        team._id,
        {
          $push: {
            commits: newCommit._id,
          },
        }
      );

      console.log(
        `Saved commit ${githubCommit.id}`
      );

      const githubUsername =
        payload.sender?.login;

      if (githubUsername) {
        const user = await User.findOne({
          githubUsername,
        });

        if (user) {
          await logActivity(
            team._id,
            user._id,
            'pushed code',
            githubCommit.message
          );
        }
      }
    }

    return res
      .status(200)
      .send('Webhook processed successfully');

  } catch (error) {
    console.error(
      'Webhook Error:',
      error
    );

    return res
      .status(500)
      .json({
        error: 'Failed to process webhook',
      });
  }
};