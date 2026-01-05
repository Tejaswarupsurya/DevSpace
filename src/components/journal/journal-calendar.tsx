"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isFuture,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface JournalEntry {
  id: string;
  date: Date;
  mood: string | null;
  content: string;
  wins: string[];
}

interface JournalCalendarProps {
  entries: JournalEntry[];
  onDateSelect: (date: Date) => void;
  minDate?: Date; // restrict navigation back to this month
}

const MOOD_COLORS = {
  TERRIBLE: "bg-red-500",
  BAD: "bg-orange-500",
  OKAY: "bg-yellow-500",
  GOOD: "bg-green-500",
  AMAZING: "bg-blue-500",
};

const MOOD_LABELS = {
  TERRIBLE: { emoji: "😔", label: "Terrible" },
  BAD: { emoji: "😐", label: "Bad" },
  OKAY: { emoji: "🙂", label: "Okay" },
  GOOD: { emoji: "😊", label: "Good" },
  AMAZING: { emoji: "🤩", label: "Amazing" },
};

export function JournalCalendar({
  entries,
  onDateSelect,
  minDate,
}: JournalCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate streak
  const calculateStreak = () => {
    const sortedEntries = [...entries]
      .filter((e) => e.content.trim().length > 0)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.date);
      entryDate.setHours(0, 0, 0, 0);

      if (isSameDay(entryDate, currentDate)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (entryDate < currentDate) {
        break;
      }
    }

    return streak;
  };

  const streak = calculateStreak();

  const getEntryForDay = (day: Date) => {
    return entries.find((e) => isSameDay(new Date(e.date), day));
  };

  // Get entries for current month only
  const monthEntries = entries.filter((e) =>
    isSameMonth(new Date(e.date), currentMonth)
  );

  // Calculate mood distribution
  const moodDistribution = monthEntries.reduce((acc, entry) => {
    if (entry.mood && entry.content.trim()) {
      acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Calculate average word count
  const avgWordCount = monthEntries.length
    ? Math.round(
        monthEntries.reduce((sum, e) => {
          const words = e.content.trim()
            ? e.content.trim().split(/\s+/).length
            : 0;
          return sum + words;
        }, 0) / monthEntries.length
      )
    : 0;

  // Insights from mood distribution
  const totalMood = Object.values(moodDistribution).reduce((a, b) => a + b, 0);
  const positive =
    (moodDistribution["GOOD"] || 0) + (moodDistribution["AMAZING"] || 0);
  const neutral = moodDistribution["OKAY"] || 0;
  const negative =
    (moodDistribution["BAD"] || 0) + (moodDistribution["TERRIBLE"] || 0);

  const topMood = Object.entries(moodDistribution).sort(
    ([, a], [, b]) => b - a
  )[0]?.[0] as keyof typeof MOOD_LABELS | undefined;

  // Day-of-week with most entries this month
  const dowCounts = Array.from({ length: 7 }, () => 0);
  monthEntries.forEach((e) => {
    if (e.content.trim()) {
      const d = new Date(e.date).getDay();
      dowCounts[d]++;
    }
  });
  const dowLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const bestDOWIndex = dowCounts.indexOf(Math.max(...dowCounts));
  const bestDOW = bestDOWIndex >= 0 ? dowLabels[bestDOWIndex] : undefined;

  const minMonth = minDate ? startOfMonth(new Date(minDate)) : undefined;
  const prevDisabled = minMonth
    ? startOfMonth(subMonths(currentMonth, 1)) < minMonth ||
      isSameMonth(currentMonth, minMonth)
    : false;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
        {/* Left: Calendar */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  disabled={prevDisabled}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-3">
                  <CardTitle className="text-base">
                    {format(currentMonth, "MMMM yyyy")}
                  </CardTitle>
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                    <span>🔥</span>
                    <span>
                      {streak} {streak === 1 ? "day" : "days"}
                    </span>
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  disabled={isSameMonth(currentMonth, new Date())}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {dowLabels.map((day, i) => (
                  <div
                    key={i}
                    className="text-center text-[10px] font-medium text-muted-foreground"
                  >
                    {day[0]}
                  </div>
                ))}
              </div>
              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const entry = getEntryForDay(day);
                  const hasEntry = entry && entry.content.trim().length > 0;
                  const isCurrentDay = isToday(day);
                  const isFutureDay = isFuture(day) && !isCurrentDay;

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => !isFutureDay && onDateSelect(day)}
                      disabled={isFutureDay}
                      title={
                        hasEntry
                          ? `${
                              entry.mood || "Journaled"
                            }: ${entry.content.slice(0, 50)}...`
                          : undefined
                      }
                      className={cn(
                        "aspect-square p-1 rounded text-[12px] font-medium transition-all relative",
                        isFutureDay && "opacity-30 cursor-not-allowed",
                        !isFutureDay && "hover:scale-105 hover:shadow-sm",
                        isCurrentDay && "ring-1 ring-primary",
                        hasEntry
                          ? entry.mood
                            ? MOOD_COLORS[
                                entry.mood as keyof typeof MOOD_COLORS
                              ]
                            : "bg-green-500"
                          : "bg-muted hover:bg-muted/80",
                        hasEntry && "text-white font-semibold"
                      )}
                    >
                      {format(day, "d")}
                    </button>
                  );
                })}
              </div>
              {/* Mood Legend */}
              <div className="mt-3 pt-3 border-t space-y-1.5">
                <div className="text-[10px] font-medium text-muted-foreground mb-1">
                  Mood Colors:
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  {Object.entries(MOOD_LABELS).map(
                    ([mood, { emoji, label }]) => (
                      <div key={mood} className="flex items-center gap-1.5">
                        <div
                          className={cn(
                            "w-2.5 h-2.5 rounded",
                            MOOD_COLORS[mood as keyof typeof MOOD_COLORS]
                          )}
                        />
                        <span className="text-muted-foreground">
                          {emoji} {label}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Stats & Insights */}
        <div className="md:col-span-2 space-y-6">
          {/* Bigger Streak Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-6xl mb-2">🔥</div>
                <div className="text-4xl font-bold text-orange-600 dark:text-orange-400">
                  {streak} {streak === 1 ? "Day" : "Days"}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Current Streak
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {totalMood > 0 ? (
                <>
                  {topMood && (
                    <div>
                      <span className="font-medium">Most common mood:</span>{" "}
                      {MOOD_LABELS[topMood].emoji} {MOOD_LABELS[topMood].label}
                    </div>
                  )}
                  <div>
                    <span className="font-medium">Positive days:</span>{" "}
                    {Math.round((positive / Math.max(1, totalMood)) * 100)}%
                    <span className="text-muted-foreground">
                      {" "}
                      (Good + Amazing)
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Neutral days:</span>{" "}
                    {Math.round((neutral / Math.max(1, totalMood)) * 100)}%
                  </div>
                  <div>
                    <span className="font-medium">Negative days:</span>{" "}
                    {Math.round((negative / Math.max(1, totalMood)) * 100)}%
                  </div>
                  {bestDOW && (
                    <div>
                      <span className="font-medium">Best journaling day:</span>{" "}
                      {bestDOW}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">
                  No insights yet for this month.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Mood Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mood Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(moodDistribution).length > 0 ? (
                Object.entries(moodDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([mood, count]) => {
                    const total = Object.values(moodDistribution).reduce(
                      (a, b) => a + b,
                      0
                    );
                    const percentage = Math.round((count / total) * 100);
                    const moodData =
                      MOOD_LABELS[mood as keyof typeof MOOD_LABELS];
                    return (
                      <div key={mood} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <span>{moodData.emoji}</span>
                            <span>{moodData.label}</span>
                          </span>
                          <span className="font-medium">{count}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all",
                              MOOD_COLORS[mood as keyof typeof MOOD_COLORS]
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No mood data yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Writing Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Writing Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Entries this month
                  </span>
                  <span className="text-2xl font-bold">
                    {monthEntries.filter((e) => e.content.trim()).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Avg. words per entry
                  </span>
                  <span className="text-2xl font-bold">{avgWordCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Consistency rate
                  </span>
                  <span className="text-2xl font-bold">
                    {Math.round(
                      (monthEntries.filter((e) => e.content.trim()).length /
                        Math.min(new Date().getDate(), days.length)) *
                        100
                    )}
                    %
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
