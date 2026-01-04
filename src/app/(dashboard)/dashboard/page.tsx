import { auth } from "@/lib/auth";
import { GitHubStats } from "@/components/dashboard/github-stats";
import { Suspense } from "react";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-bold">
            Welcome back, {session?.user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-muted-foreground mt-2">
            Here's what's happening with your productivity today.
          </p>
        </div>

        {/* GitHub Stats */}
        <Suspense fallback={<div>Loading GitHub stats...</div>}>
          <GitHubStats />
        </Suspense>

        {/* Stats Grid (placeholder for now) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-lg bg-white dark:bg-zinc-900">
            <h3 className="text-sm font-medium text-muted-foreground">
              Tasks Completed
            </h3>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>
          <div className="p-6 border rounded-lg bg-white dark:bg-zinc-900">
            <h3 className="text-sm font-medium text-muted-foreground">
              Pomodoro Sessions
            </h3>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>
          <div className="p-6 border rounded-lg bg-white dark:bg-zinc-900">
            <h3 className="text-sm font-medium text-muted-foreground">
              GitHub Commits
            </h3>
            <p className="text-3xl font-bold mt-2">0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
