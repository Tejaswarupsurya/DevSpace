"use client";

import { cn } from "@/lib/utils";

interface TimerDisplayProps {
  timeLeft: number;
  progress: number;
  mode: "work" | "break" | "longBreak";
  status: "idle" | "running" | "paused";
}

export function TimerDisplay({
  timeLeft,
  progress,
  mode,
  status,
}: TimerDisplayProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const radius = 120;
  const circumference = 2 * Math.PI * radius; // ~754
  const strokeOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      {/* SVG Circle Timer */}
      <div className="relative">
        <svg className="w-80 h-80 transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="160"
            cy="160"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted-foreground/20"
          />

          {/* Progress circle */}
          <circle
            cx="160"
            cy="160"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            className={cn(
              "transition-all duration-1000 ease-linear",
              mode === "work" && "text-blue-600",
              mode === "break" && "text-green-600",
              mode === "longBreak" && "text-orange-600"
            )}
            strokeLinecap="round"
          />
        </svg>

        {/* Time Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-6xl font-bold tabular-nums">
            {String(minutes).padStart(2, "0")}:
            {String(seconds).padStart(2, "0")}
          </div>
          <div className="text-sm text-muted-foreground mt-2 uppercase tracking-wide">
            {mode === "work" && "Focus Time"}
            {mode === "break" && "Short Break"}
            {mode === "longBreak" && "Long Break"}
          </div>
          {status === "paused" && (
            <div className="text-xs text-orange-600 mt-2 font-medium">
              Paused
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
