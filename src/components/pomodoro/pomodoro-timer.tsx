"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, RotateCcw, Settings, BarChart3 } from "lucide-react";
import { TimerDisplay } from "./timer-display";
import { SessionStats } from "./session-stats";
import { SettingsDialog } from "./settings-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type TimerMode = "work" | "break" | "longBreak";
type TimerStatus = "idle" | "running" | "paused";

const DEFAULT_DURATIONS = {
  work: 25 * 60, // 25 minutes
  break: 5 * 60, // 5 minutes
  longBreak: 15 * 60, // 15 minutes
};

export function PomodoroTimer() {
  const [mode, setMode] = useState<TimerMode>("work");
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATIONS.work);
  const [sessionCount, setSessionCount] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [durations, setDurations] = useState(DEFAULT_DURATIONS);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("pomodoro-state");
    if (saved) {
      const state = JSON.parse(saved);
      setMode(state.mode);
      setSessionCount(state.sessionCount);
      setDurations(state.durations || DEFAULT_DURATIONS);

      // Calculate actual time remaining if was running
      if (state.status === "running" && state.startTime) {
        const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        const remaining = Math.max(0, state.timeLeft - elapsed);
        setTimeLeft(remaining);
        if (remaining > 0) {
          setStatus("paused"); // Don't auto-start, let user resume
        } else {
          setTimeLeft(durations[mode]);
          setStatus("idle");
        }
      } else {
        setTimeLeft(state.timeLeft || durations[mode]);
        setStatus(state.status === "running" ? "paused" : state.status);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "pomodoro-state",
      JSON.stringify({
        mode,
        status,
        timeLeft,
        sessionCount,
        durations,
        startTime: status === "running" ? startTimeRef.current : null,
      })
    );
  }, [mode, status, timeLeft, sessionCount, durations]);

  // Update timeLeft when durations change and timer is idle
  useEffect(() => {
    if (status === "idle") {
      setTimeLeft(durations[mode]);
    }
  }, [durations, mode, status]);

  useEffect(() => {
    if (status === "running") {
      startTimeRef.current = Date.now() - (durations[mode] - timeLeft) * 1000;

      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status]);

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const notify = (title: string, body: string) => {
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/icon.png",
        tag: "pomodoro",
      });
    }
  };

  const handleTimerComplete = async () => {
    setStatus("idle");

    // Play sound (you can add audio here)
    const audio = new Audio("/notification.mp3");
    audio.play().catch(() => {
      /* Ignore if sound blocked */
    });

    // Save session to database
    await saveSession(true);

    if (mode === "work") {
      const newCount = sessionCount + 1;
      setSessionCount(newCount);

      // Long break after 4 work sessions
      if (newCount % 4 === 0) {
        setMode("longBreak");
        setTimeLeft(durations.longBreak);
        notify(
          "Time for a long break!",
          "You've completed 4 sessions. Take 15 minutes."
        );
        toast.success("🎉 Time for a long break! You've completed 4 sessions.");
      } else {
        setMode("break");
        setTimeLeft(durations.break);
        notify("Time for a break!", "Take 5 minutes to refresh.");
        toast.success("✅ Work session complete! Time for a break.");
      }
    } else {
      setMode("work");
      setTimeLeft(durations.work);
      notify("Break over!", "Ready to focus again?");
      toast.info("⏰ Break over! Ready to focus again?");
    }
  };

  const saveSession = async (completed: boolean) => {
    const duration = completed ? durations[mode] : durations[mode] - timeLeft;

    try {
      await fetch("/api/pomodoro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration,
          type: mode.toUpperCase(),
          completed,
          note: null,
        }),
      });
    } catch (error) {
      console.error("Failed to save session:", error);
    }
  };

  const handleStart = async () => {
    await requestNotificationPermission();
    setStatus("running");
  };

  const handlePause = async () => {
    setStatus("paused");
    await saveSession(false); // Save partial session
  };

  const handleReset = () => {
    setStatus("idle");
    setTimeLeft(durations[mode]);
  };

  const handleModeChange = (newMode: TimerMode) => {
    if (status === "idle") {
      setMode(newMode);
      // timeLeft will be updated by useEffect
    }
  };

  const progress = ((durations[mode] - timeLeft) / durations[mode]) * 100;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-screen p-8 transition-all duration-1000",
        mode === "work" &&
          "bg-linear-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950",
        mode === "break" &&
          "bg-linear-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950 dark:via-emerald-950 dark:to-teal-950",
        mode === "longBreak" &&
          "bg-linear-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950 dark:via-amber-950 dark:to-yellow-950"
      )}
    >
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Pomodoro Timer</h1>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "transition-colors",
                showStats && "bg-accent text-accent-foreground"
              )}
              onClick={() => {
                const newShowStats = !showStats;
                setShowStats(newShowStats);

                // Auto-scroll to stats when showing them
                if (newShowStats) {
                  setTimeout(() => {
                    statsRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }, 100);
                }
              }}
            >
              <BarChart3 className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSettings(true)}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mode Tabs */}
        <Tabs
          value={mode}
          onValueChange={(v) => handleModeChange(v as TimerMode)}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="work" disabled={status !== "idle"}>
              Work
            </TabsTrigger>
            <TabsTrigger value="break" disabled={status !== "idle"}>
              Short Break
            </TabsTrigger>
            <TabsTrigger value="longBreak" disabled={status !== "idle"}>
              Long Break
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Timer Display */}
        <Card className="p-12">
          <TimerDisplay
            timeLeft={timeLeft}
            progress={progress}
            mode={mode}
            status={status}
          />

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-8">
            {status === "idle" && (
              <Button size="lg" onClick={handleStart} className="w-32">
                <Play className="w-5 h-5 mr-2" />
                Start
              </Button>
            )}

            {status === "running" && (
              <Button
                size="lg"
                onClick={handlePause}
                variant="secondary"
                className="w-32"
              >
                <Pause className="w-5 h-5 mr-2" />
                Pause
              </Button>
            )}

            {status === "paused" && (
              <Button size="lg" onClick={handleStart} className="w-32">
                <Play className="w-5 h-5 mr-2" />
                Resume
              </Button>
            )}

            {status !== "idle" && (
              <Button size="lg" onClick={handleReset} variant="outline">
                <RotateCcw className="w-5 h-5 mr-2" />
                Reset
              </Button>
            )}
          </div>

          {/* Session Count */}
          <div className="text-center mt-6 text-sm text-muted-foreground">
            Sessions completed today:{" "}
            <span className="font-semibold">{sessionCount}</span>
          </div>
        </Card>

        {/* Stats */}
        {showStats && (
          <div ref={statsRef}>
            <SessionStats />
          </div>
        )}
      </div>

      {/* Settings Dialog */}
      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        durations={durations}
        onSave={setDurations}
      />
    </div>
  );
}
