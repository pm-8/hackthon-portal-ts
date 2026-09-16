import { type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

import Team from '../models/team.model.js';
import {
  parseGitHubRepoUrl,
  getInstalledRepository,
} from '../utils/github.util.js';

import type { AuthRequest } from '../middleware/auth.middleware.js';

const createInstallState = (
  userId: string,
  teamId: string
) => {
  return jwt.sign(
    {
      userId,
      teamId,
    },
    process.env.GITHUB_APP_STATE_SECRET as string,
    {
      expiresIn: '10m',
    }
  );
};

export const startGitHubInstallation = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { teamId } = req.params;
    const userId = req.user!.id;

    const team = await Team.findById(teamId);

    if (!team) {
      res.status(404).json({
        error: 'Team not found',
      });
      return;
    }

    if (team.teamLeader.toString() !== userId) {
      res.status(403).json({
        error: 'Only the team leader can connect the repository',
      });
      return;
    }

    if (team.githubConnected) {
      res.redirect(
        `${process.env.FRONTEND_URL}/dashboard?github=already-connected`
      );
      return;
    }

    const state = createInstallState(
      userId,
      team._id.toString()
    );

    const appSlug = process.env.GITHUB_APP_SLUG;

    if (!appSlug) {
      throw new Error(
        'GITHUB_APP_SLUG is not configured'
      );
    }

    const installUrl =
      `https://github.com/apps/${appSlug}/installations/new` +
      `?state=${encodeURIComponent(state)}`;

    res.redirect(installUrl);

  } catch (error) {
    console.error(
      'Start GitHub Installation Error:',
      error
    );

    res.status(500).json({
      error: 'Failed to start GitHub installation',
    });
  }
};

export const githubInstallationCallback = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      installation_id,
      setup_action,
      state,
    } = req.query;

    if (!state || typeof state !== 'string') {
      res.status(400).send('Missing installation state');
      return;
    }

    const decoded = jwt.verify(
      state,
      process.env.GITHUB_APP_STATE_SECRET as string
    ) as {
      userId: string;
      teamId: string;
    };

    if (!installation_id) {
      if (setup_action === 'request') {
        res.redirect(
          `${process.env.FRONTEND_URL}/dashboard?github=requested`
        );
        return;
      }

      res.status(400).send(
        'GitHub App installation was not completed.'
      );
      return;
    }

    const installationId = Number(installation_id);

    if (!Number.isInteger(installationId)) {
      res.status(400).send(
        'Invalid GitHub installation ID'
      );
      return;
    }

    const team = await Team.findById(
      new Types.ObjectId(decoded.teamId)
    );

    if (!team) {
      res.status(404).send('Team not found');
      return;
    }

    if (
      team.teamLeader.toString() !==
      decoded.userId
    ) {
      res.status(403).send(
        'You are not allowed to connect this team'
      );
      return;
    }

    const { owner, repo } =
      parseGitHubRepoUrl(team.githubRepo);

    /*
     * This is the actual authorization check.
     *
     * We generate an installation token and try to
     * access THIS exact repository.
     *
     * If the GitHub App was installed on some other
     * repository, this request fails.
     */
    const githubRepo =
      await getInstalledRepository(
        installationId,
        owner,
        repo
      );

    await Team.findByIdAndUpdate(
      team._id,
      {
        githubConnected: true,
        githubInstallationId: installationId,
        githubRepoId: githubRepo.id,
        githubOwner: githubRepo.owner.login,
        githubRepoName: githubRepo.name,
        githubConnectedAt: new Date(),
      }
    );

    console.log(
      `GitHub connected: ${owner}/${repo} -> team ${team._id}`
    );

    res.redirect(
      `${process.env.FRONTEND_URL}/dashboard?github=connected`
    );

  } catch (error: any) {
    console.error(
      'GitHub Installation Callback Error:',
      error.response?.data || error
    );

    res.redirect(
      `${process.env.FRONTEND_URL}/dashboard?github=error`
    );
  }
};