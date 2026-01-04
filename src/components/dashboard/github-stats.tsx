import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGitHubStats } from "@/lib/github";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch, Star, GitCommit, Users } from "lucide-react";

export async function GitHubStats() {
  const session = await auth();

  if (!session?.user?.id) return null;

  // Get user with GitHub username
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

  // Fetch GitHub stats
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
    {
      label: "Followers",
      value: githubData.user.followers,
      icon: Users,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>GitHub Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <Icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
