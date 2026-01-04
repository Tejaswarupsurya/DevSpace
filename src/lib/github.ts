import { Octokit } from "@octokit/rest";

export async function getGitHubStats(username: string, accessToken?: string) {
  const octokit = new Octokit({
    auth: accessToken,
  });

  try {
    // Get user info
    const { data: user } = await octokit.users.getByUsername({ username });

    // Get repos
    const { data: repos } = await octokit.repos.listForUser({
      username,
      per_page: 100,
      sort: "updated",
    });

    // Calculate total stars
    const totalStars = repos.reduce((acc, repo) => {
      return acc + (repo.stargazers_count ?? 0);
    }, 0);

    // Get commits from last 7 days across all repos
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    let totalCommits = 0;

    // Fetch commits from each repo (limit to first 10 repos to avoid rate limits)
    const reposToCheck = repos.slice(0, 10);

    for (const repo of reposToCheck) {
      try {
        const { data: commits } = await octokit.repos.listCommits({
          owner: username,
          repo: repo.name,
          author: username,
          since: oneWeekAgo.toISOString(),
          per_page: 100,
        });

        totalCommits += commits.length;
      } catch (error) {
        // Skip repos we can't access (private, empty, etc.)
        console.log(`Skipping repo ${repo.name}`);
      }
    }

    return {
      user: {
        name: user.name,
        bio: user.bio,
        followers: user.followers,
        following: user.following,
        publicRepos: user.public_repos,
      },
      stats: {
        totalRepos: repos.length,
        totalStars,
        commitsThisWeek: totalCommits,
      },
    };
  } catch (error) {
    console.error("Error fetching GitHub stats:", error);
    return null;
  }
}
