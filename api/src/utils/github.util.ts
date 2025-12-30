import axios from 'axios';

export const createWebhook = async (repoUrl: string, teamId: string): Promise<any> => {
  try {
    const urlParts = repoUrl.split('github.com/');
    if (urlParts.length < 2 || !urlParts[1]) {
      throw new Error('Invalid GitHub URL');
    }
    const rawPath = urlParts[1]
      .replace('.git', '')
      .replace(/\/$/, '');
    const [owner, repo] = rawPath.split('/');
    if (!owner || !repo) {
      throw new Error('Could not extract owner and repo from URL');
    }
    const webhookUrl = `${process.env.API_URL}/api/github/webhook/${teamId}`;
    console.log(`Setting up webhook for ${owner}/${repo} -> ${webhookUrl}`);
    const response = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/hooks`,
      {
        name: 'web',
        active: true,
        events: ['push', 'pull_request'], 
        config: {
          url: webhookUrl,
          content_type: 'json',
        },
      },
      {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('GitHub Webhook Error:', error.response?.data || error.message);
    return null; 
  }
};