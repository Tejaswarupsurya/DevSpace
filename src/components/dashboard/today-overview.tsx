"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, PlusCircle, NotebookPen, StickyNote, Code2 } from "lucide-react";
import { startOfDay, endOfDay, isWithinInterval } from "date-fns";

type Task = {
  id: string;
  status: string;
  updatedAt: string | Date;
};

type PomodoroSession = {
  id: string;
  createdAt: string | Date;
  completed: boolean;
};

export function TodayOverview() {
  const [tasksDoneToday, setTasksDoneToday] = useState(0);
  const [pomodorosToday, setPomodorosToday] = useState(0);
  const [journalDone, setJournalDone] = useState<boolean | null>(null);

  useEffect(() => {
    const s = startOfDay(new Date());
    const e = endOfDay(new Date());

    const load = async () => {
      try {
        // Tasks
        const tRes = await fetch("/api/tasks");
        if (tRes.ok) {
          const tasks: Task[] = await tRes.json();
          const count = tasks.filter((t) => {
            if (t.status !== "DONE") return false;
            const u = new Date(t.updatedAt);
            return isWithinInterval(u, { start: s, end: e });
          }).length;
          setTasksDoneToday(count);
        }

        // Pomodoro sessions (last 30 days returned by API)
        const pRes = await fetch("/api/pomodoro");
        if (pRes.ok) {
          const sessions: PomodoroSession[] = await pRes.json();
          const count = sessions.filter((p) => {
            const d = new Date(p.createdAt);
            return isWithinInterval(d, { start: s, end: e }) && p.completed;
          }).length;
          setPomodorosToday(count);
        }

        // Journal today
        const jRes = await fetch(
          `/api/journal?date=${new Date().toISOString()}`
        );
        if (jRes.ok) {
          const entry = await jRes.json();
          const has = Boolean(entry?.content && String(entry.content).trim());
          setJournalDone(has);
        } else {
          setJournalDone(false);
        }
      } catch (err) {
        console.error("Failed loading today overview", err);
      }
    };

    load();
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
        <Link href="/pomodoro" className="w-full sm:w-auto">
          <Button size="sm" className="w-full">
            <Play className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline ml-2">Start Pomodoro</span>
            <span className="sm:hidden ml-1">Pomodoro</span>
          </Button>
        </Link>
        <Link href="/tasks" className="w-full sm:w-auto">
          <Button variant="secondary" size="sm" className="w-full">
            <PlusCircle className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline ml-2">Add Task</span>
            <span className="sm:hidden ml-1">Task</span>
          </Button>
        </Link>
        <Link href="/journal" className="w-full sm:w-auto">
          <Button variant="outline" size="sm" className="w-full">
            <NotebookPen className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline ml-2">Write Journal</span>
            <span className="sm:hidden ml-1">Journal</span>
          </Button>
        </Link>
        <Link href="/notes" className="w-full sm:w-auto">
          <Button variant="ghost" size="sm" className="w-full">
            <StickyNote className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline ml-2">Quick Note</span>
            <span className="sm:hidden ml-1">Note</span>
          </Button>
        </Link>
        <Link href="/snippets" className="col-span-2 sm:col-span-1 sm:w-auto">
          <Button variant="ghost" size="sm" className="w-full">
            <Code2 className="w-4 h-4 mr-2" /> Snippets
          </Button>
        </Link>
      </div>

      {/* Today Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/tasks" className="block">
          <Card className="hover:bg-muted/40 transition-colors">
            <CardHeader>
              <CardTitle className="text-sm">Tasks Completed Today</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{tasksDoneToday}</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/pomodoro" className="block">
          <Card className="hover:bg-muted/40 transition-colors">
            <CardHeader>
              <CardTitle className="text-sm">Focus Sessions Today</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{pomodorosToday}</p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Journal Check-in</CardTitle>
          </CardHeader>
          <CardContent>
            {journalDone === null ? (
              <p className="text-sm text-muted-foreground">Checking…</p>
            ) : journalDone ? (
              <p className="text-green-600 font-medium">Done for today ✅</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Take a minute to reflect — a few words go a long way.
                </p>
                <Link href="/journal">
                  <Button size="sm" variant="outline">
                    Reflect on today
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
