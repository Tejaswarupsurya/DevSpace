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
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/pomodoro">
          <Button size="sm">
            <Play className="w-4 h-4 mr-2" /> Start Pomodoro
          </Button>
        </Link>
        <Link href="/tasks">
          <Button variant="secondary" size="sm">
            <PlusCircle className="w-4 h-4 mr-2" /> Add Task
          </Button>
        </Link>
        <Link href="/journal">
          <Button variant="outline" size="sm">
            <NotebookPen className="w-4 h-4 mr-2" /> Write Journal
          </Button>
        </Link>
        <Link href="/notes">
          <Button variant="ghost" size="sm">
            <StickyNote className="w-4 h-4 mr-2" /> Quick Note
          </Button>
        </Link>
        <Link href="/snippets">
          <Button variant="ghost" size="sm">
            <Code2 className="w-4 h-4 mr-2" /> Snippets
          </Button>
        </Link>
      </div>

      {/* Today Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Tasks Completed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{tasksDoneToday}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Focus Sessions Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pomodorosToday}</p>
          </CardContent>
        </Card>

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
              <Link href="/journal" className="text-primary underline">
                Write now
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
