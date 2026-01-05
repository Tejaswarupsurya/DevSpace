"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Target, TrendingUp, Flame } from "lucide-react";

interface Session {
  id: string;
  duration: number;
  type: string;
  completed: boolean;
  createdAt: Date;
}

export function SessionStats() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/pomodoro");
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const today = new Date().toDateString();
  const todaySessions = sessions.filter(
    (s) => new Date(s.createdAt).toDateString() === today
  );

  const completedToday = todaySessions.filter(
    (s) => s.completed && s.type === "WORK"
  ).length;
  const totalMinutesToday = Math.floor(
    todaySessions
      .filter((s) => s.type === "WORK")
      .reduce((acc, s) => acc + s.duration, 0) / 60
  );

  // Calculate streak (consecutive days with at least 1 completed session)
  const calculateStreak = () => {
    const dateMap = new Map<string, boolean>();
    sessions
      .filter((s) => s.completed && s.type === "WORK")
      .forEach((s) => {
        const date = new Date(s.createdAt).toDateString();
        dateMap.set(date, true);
      });

    let streak = 0;
    let currentDate = new Date();

    while (dateMap.has(currentDate.toDateString())) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  };

  const streak = calculateStreak();
  const focusScore =
    sessions.length > 0
      ? Math.round(
          (sessions.filter((s) => s.completed).length / sessions.length) * 100
        )
      : 0;

  const stats = [
    {
      label: "Today's Sessions",
      value: completedToday,
      icon: Target,
      color: "text-blue-600",
    },
    {
      label: "Focus Minutes",
      value: totalMinutesToday,
      icon: Clock,
      color: "text-green-600",
    },
    {
      label: "Current Streak",
      value: streak,
      icon: Flame,
      color: "text-orange-600",
      suffix: "days",
    },
    {
      label: "Focus Score",
      value: focusScore,
      icon: TrendingUp,
      color: "text-purple-600",
      suffix: "%",
    },
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading stats...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="text-center">
                <Icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
                <div className="text-2xl font-bold">
                  {stat.value}
                  {stat.suffix && (
                    <span className="text-sm ml-1 text-muted-foreground">
                      {stat.suffix}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
