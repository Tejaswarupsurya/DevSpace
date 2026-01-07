import { auth } from "@/lib/auth";
import { GitHubStats } from "@/components/dashboard/github-stats";
import { TodayOverview } from "@/components/dashboard/today-overview";
import { NotificationSettings } from "@/components/dashboard/notification-settings";
import { GreetingHeader } from "@/components/dashboard/greeting-header";
import { Suspense } from "react";

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        {/* Welcome Header with Time-based Greeting */}
        <GreetingHeader firstName={firstName} />

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
