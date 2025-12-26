import axios from 'axios';

export const createWebhook = async (repoUrl: string, teamId: string): Promise<any> => {
  try {
    // 1. Parse Owner and Repo name from URL
    // Expected format: https://github.com/owner/repo
    const parts = repoUrl.split('github.com/');
    if (parts.length !== 2) throw new Error('Invalid GitHub URL');
    
    let [owner, repo] = parts[1].split('/');
    repo = repo.replace('.git', '').replace(/\/$/, ''); // Clean up extension or trailing slash

    // 2. Configure the Webhook URL (The URL GitHub will hit)
    // NOTE: In local dev, you need a tool like ngrok to make localhost visible to GitHub
    const webhookUrl = `${process.env.API_URL}/api/github/webhook/${teamId}`;
    
    console.log(`Setting up webhook for ${owner}/${repo} -> ${webhookUrl}`);

    // 3. Send Request to GitHub API
    const response = await axios.post(
      `https://api.github.com/repos/${owner}/${repo}/hooks`,
      {
        name: 'web',
        active: true,
        events: ['push', 'pull_request'], // Listen for these events
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
    // We don't throw here so that Team creation doesn't fail just because webhook failed
    return null; 
  }
};