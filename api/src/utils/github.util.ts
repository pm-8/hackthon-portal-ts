import axios from 'axios';
import jwt from 'jsonwebtoken';

export interface ParsedGitHubRepo {
  owner: string;
  repo: string;
}

export const parseGitHubRepoUrl = (
  repoUrl: string
): ParsedGitHubRepo => {
  let url: URL;

  try {
    url = new URL(repoUrl);
  } catch {
    throw new Error('Invalid GitHub repository URL');
  }

  if (
    url.hostname !== 'github.com' &&
    url.hostname !== 'www.github.com'
  ) {
    throw new Error('Repository must be hosted on github.com');
  }

  const parts = url.pathname
    .replace(/^\/+|\/+$/g, '')
    .split('/');

  if (parts.length !== 2) {
    throw new Error(
      'Repository URL must look like https://github.com/owner/repository'
    );
  }

  const [owner, rawRepo] = parts;

  const repo = rawRepo.replace(/\.git$/, '');

  if (!owner || !repo) {
    throw new Error('Invalid GitHub repository URL');
  }

  return { owner, repo };
};

const getGitHubAppPrivateKey = (): string => {
  const encoded = process.env.GITHUB_APP_PRIVATE_KEY_BASE64;

  if (!encoded) {
    throw new Error(
      'GITHUB_APP_PRIVATE_KEY_BASE64 is not configured'
    );
  }

  return Buffer.from(encoded, 'base64').toString('utf8');
};

export const createGitHubAppJwt = (): string => {
  const appId = process.env.GITHUB_APP_ID;

  if (!appId) {
    throw new Error('GITHUB_APP_ID is not configured');
  }

  const now = Math.floor(Date.now() / 1000);

  return jwt.sign(
    {
      iat: now - 60,
      exp: now + 9 * 60,
      iss: appId,
    },
    getGitHubAppPrivateKey(),
    {
      algorithm: 'RS256',
    }
  );
};

export const createInstallationAccessToken = async (
  installationId: number
): Promise<string> => {
  const appJwt = createGitHubAppJwt();

  const response = await axios.post(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {},
    {
      headers: {
        Authorization: `Bearer ${appJwt}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2026-03-10',
      },
    }
  );

  return response.data.token;
};

export const getInstalledRepository = async (
  installationId: number,
  owner: string,
  repo: string
) => {
  const installationToken =
    await createInstallationAccessToken(installationId);

  const response = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
      headers: {
        Authorization: `Bearer ${installationToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2026-03-10',
      },
    }
  );

  return response.data;
};