import { auth } from "@/lib/auth";
import { GitHubStats } from "@/components/dashboard/github-stats";
import { TodayOverview } from "@/components/dashboard/today-overview";
import { Suspense } from "react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getEmoji() {
  const hour = new Date().getHours();
  if (hour < 12) return "☀️";
  if (hour < 18) return "🌤️";
  return "🌙";
}

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0];

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Welcome Header with Time-based Greeting */}
        <div>
          <h1 className="text-3xl font-bold">
            {getGreeting()}, {firstName}! {getEmoji()}
          </h1>
          <p className="text-muted-foreground mt-2">
            Here's what's happening with your productivity today.
          </p>
        </div>

        {/* Today Overview */}
        <TodayOverview />

        {/* GitHub Stats */}
        <Suspense fallback={<div>Loading GitHub stats...</div>}>
          <GitHubStats />
        </Suspense>
        {/* You can add more sections below as needed */}
      </div>
    </div>
  );
}
