import { auth } from "@/lib/auth";
import { GitHubStats } from "@/components/dashboard/github-stats";
import { TodayOverview } from "@/components/dashboard/today-overview";
import { NotificationSettings } from "@/components/dashboard/notification-settings";
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
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* Welcome Header with Time-based Greeting */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {getGreeting()}, {firstName}! {getEmoji()}
          </h1>
          <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
            Here's what's happening with your productivity today.
          </p>
        </div>

        {/* Today Overview */}
        <TodayOverview />

        {/* GitHub Stats */}
        <Suspense fallback={<div>Loading GitHub stats...</div>}>
          <GitHubStats />
        </Suspense>

        {/* Notification Settings */}
        <NotificationSettings />
        {/* You can add more sections below as needed */}
      </div>
    </div>
  );
}
