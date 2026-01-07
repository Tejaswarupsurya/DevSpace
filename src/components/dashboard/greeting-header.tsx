"use client";

interface GreetingHeaderProps {
  firstName?: string;
}

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

export function GreetingHeader({ firstName }: GreetingHeaderProps) {
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold">
        {getGreeting()}, {firstName}! {getEmoji()}
      </h1>
      <p className="text-muted-foreground mt-1 sm:mt-2 text-sm sm:text-base">
        Here's what's happening with your productivity today.
      </p>
    </div>
  );
}
