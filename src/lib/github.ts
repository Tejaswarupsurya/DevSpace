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

    // Get commits from last 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    let totalCommits = 0;
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
        console.log(`Skipping repo ${repo.name}`);
      }
    }

    // Calculate streak (last 30 days of activity)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: events } = await octokit.activity.listPublicEventsForUser({
      username,
      per_page: 100,
    });

    // Get unique days with activity
    const activeDays = new Set<string>();
    events.forEach((event) => {
      const eventDate = new Date(event.created_at!);
      if (eventDate > thirtyDaysAgo) {
        const dateStr = eventDate.toISOString().split("T")[0];
        activeDays.add(dateStr);
      }
    });

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];

      if (activeDays.has(dateStr)) {
        currentStreak++;
      } else if (i > 0) {
        // Break streak only after first day (allow today to be empty)
        break;
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
        currentStreak,
      },
    };
  } catch (error) {
    console.error("Error fetching GitHub stats:", error);
    return null;
  }
}
