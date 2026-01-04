import { Octokit } from "@octokit/rest";
import { unstable_cache } from "next/cache";

interface GitHubActivity {
  type: string;
  repo: string;
  action: string;
  createdAt: Date;
  url: string;
}

async function fetchGitHubStatsUncached(
  username: string,
  accessToken?: string
) {
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

    // Calculate streak
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
        break;
      }
    }

    // Prepare contribution graph data (last 365 days - full year)
    const contributionDays: { date: string; count: number; level: number }[] =
      [];
    const lastYear = new Date();
    lastYear.setDate(today.getDate() - 365);

    // Create map of dates with activity count
    const activityMap = new Map<string, number>();

    events.forEach((event) => {
      const eventDate = new Date(event.created_at!);
      if (eventDate > lastYear) {
        const dateStr = eventDate.toISOString().split("T")[0];
        activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);
      }
    });

    // Generate array for last 365 days
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const count = activityMap.get(dateStr) || 0;

      contributionDays.push({
        date: dateStr,
        count,
        level:
          count === 0
            ? 0
            : count <= 2
            ? 1
            : count <= 5
            ? 2
            : count <= 10
            ? 3
            : 4,
      });
    }

    // Parse recent activity (last 10 events)
    const recentActivity: GitHubActivity[] = events
      .slice(0, 10)
      .map((event) => {
        const repoName = event.repo?.name?.split("/")[1] || "Unknown";
        let action = "";

        switch (event.type) {
          case "PushEvent":
            const commits = (event.payload as any)?.commits?.length || 0;
            action = `Pushed ${commits} commit${
              commits > 1 ? "s" : ""
            } to ${repoName}`;
            break;
          case "CreateEvent":
            action = `Created ${
              (event.payload as any)?.ref_type
            } in ${repoName}`;
            break;
          case "PullRequestEvent":
            const prAction = (event.payload as any)?.action;
            action = `${
              prAction.charAt(0).toUpperCase() + prAction.slice(1)
            } PR in ${repoName}`;
            break;
          case "IssuesEvent":
            const issueAction = (event.payload as any)?.action;
            action = `${
              issueAction.charAt(0).toUpperCase() + issueAction.slice(1)
            } issue in ${repoName}`;
            break;
          case "WatchEvent":
            action = `Starred ${repoName}`;
            break;
          case "ForkEvent":
            action = `Forked ${repoName}`;
            break;
          default:
            action = `${
              event.type?.replace("Event", "") || "Activity"
            } in ${repoName}`;
        }

        return {
          type: event.type || "",
          repo: repoName,
          action,
          createdAt: new Date(event.created_at!),
          url: `https://github.com/${event.repo?.name}`,
        };
      });

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
      recentActivity,
      contributionDays,
    };
  } catch (error) {
    console.error("Error fetching GitHub stats:", error);
    return null;
  }
}

// Cached version of GitHub stats with 5-minute revalidation
export const getGitHubStats = unstable_cache(
  fetchGitHubStatsUncached,
  ["github-stats"],
  {
    revalidate: 300, // Cache for 5 minutes
    tags: ["github-stats"],
  }
);
