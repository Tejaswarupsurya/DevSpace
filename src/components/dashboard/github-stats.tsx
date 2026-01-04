import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGitHubStats } from "@/lib/github";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch, Star, GitCommit, Flame } from "lucide-react";
import { RecentActivity } from "./recent-activity";
import { ContributionGraph } from "./contribution-graph";

export async function GitHubStats() {
  const session = await auth();

  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { githubUsername: true },
  });

  if (!user?.githubUsername) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>GitHub Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No GitHub username found. Please log out and log in again.
          </p>
        </CardContent>
      </Card>
    );
  }

  const githubData = await getGitHubStats(user.githubUsername);

  if (!githubData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>GitHub Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Failed to load GitHub stats
          </p>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      label: "Current Streak",
      value: githubData.stats.currentStreak,
      icon: Flame,
      color: "text-orange-600",
      suffix: "days",
    },
    {
      label: "Commits This Week",
      value: githubData.stats.commitsThisWeek,
      icon: GitCommit,
      color: "text-green-600",
    },
    {
      label: "Public Repos",
      value: githubData.stats.totalRepos,
      icon: GitBranch,
      color: "text-blue-600",
    },
    {
      label: "Total Stars",
      value: githubData.stats.totalStars,
      icon: Star,
      color: "text-yellow-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Stats Card - Takes 2 columns on large screens */}
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>GitHub Activity</CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-2xl font-bold">
                    {stat.value}
                    {stat.suffix && (
                      <span className="text-xs ml-1 text-muted-foreground">
                        {stat.suffix}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              );
            })}
          </div>

          {/* Add Contribution Graph */}
          <ContributionGraph data={githubData.contributionDays} />
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <RecentActivity activities={githubData.recentActivity} />
    </div>
  );
}
