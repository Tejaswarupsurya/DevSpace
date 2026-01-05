"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import MarkdownPreview from "@uiw/react-markdown-preview";
import { format, isToday } from "date-fns";

interface JournalEntry {
  id: string;
  date: Date;
  mood: string | null;
  content: string;
  wins: string[];
  prompt: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface JournalEditorProps {
  date: Date;
  entry: JournalEntry | null;
  todayStats: {
    tasks: number;
    pomodoros: number;
  };
  onSave: (entry: JournalEntry) => void;
}

const MOODS = [
  { value: "TERRIBLE", emoji: "😔", label: "Terrible", color: "text-red-500" },
  { value: "BAD", emoji: "😐", label: "Bad", color: "text-orange-500" },
  { value: "OKAY", emoji: "🙂", label: "Okay", color: "text-yellow-500" },
  { value: "GOOD", emoji: "😊", label: "Good", color: "text-green-500" },
  { value: "AMAZING", emoji: "🤩", label: "Amazing", color: "text-blue-500" },
];

// 🔑 TIME-BASED PROMPTS
const getPrompt = () => {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "What are your top 3 goals for today?";
  } else if (hour < 18) {
    return "How is your day going? Any wins so far?";
  } else {
    return "What did you accomplish today? What did you learn?";
  }
};

export function JournalEditor({
  date,
  entry,
  todayStats,
  onSave,
}: JournalEditorProps) {
  const [mood, setMood] = useState(entry?.mood || null);
  const [content, setContent] = useState(entry?.content || "");
  const [wins, setWins] = useState<string[]>(entry?.wins || ["", "", ""]);
  const [showPreview, setShowPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">(
    "idle"
  );
  const [prompt] = useState(entry?.prompt || getPrompt());

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isEditingToday = isToday(date);
  const syncingRef = useRef(false);
  const lastSavedRef = useRef<{
    mood: string | null;
    content: string;
    wins: string[];
  } | null>(null);

  const normalizeWins = (arr: string[]) => [
    arr[0]?.trim() || "",
    arr[1]?.trim() || "",
    arr[2]?.trim() || "",
  ];
  const snapshot = () => ({
    mood,
    content: content.trim(),
    wins: normalizeWins(wins),
  });
  const equals = (
    a: { mood: string | null; content: string; wins: string[] } | null,
    b: { mood: string | null; content: string; wins: string[] }
  ) => {
    if (!a) return false;
    return (
      a.mood === b.mood &&
      a.content === b.content &&
      a.wins.join("|") === b.wins.join("|")
    );
  };

  // Sync editor state when switching dates/entries
  useEffect(() => {
    setMood(entry?.mood || null);
    setContent(entry?.content || "");
    const incomingWins = entry?.wins || [];
    setWins([
      incomingWins[0] || "",
      incomingWins[1] || "",
      incomingWins[2] || "",
    ]);
  }, [entry, date]);

  // Sync editor state when switching dates/entries and set last saved snapshot
  useEffect(() => {
    syncingRef.current = true;
    setMood(entry?.mood || null);
    setContent(entry?.content || "");
    const incomingWins = entry?.wins || [];
    setWins([
      incomingWins[0] || "",
      incomingWins[1] || "",
      incomingWins[2] || "",
    ]);
    lastSavedRef.current = {
      mood: entry?.mood || null,
      content: (entry?.content || "").trim(),
      wins: normalizeWins(incomingWins),
    };
    // Release syncing flag after state updates flush
    const t = setTimeout(() => {
      syncingRef.current = false;
    }, 0);
    return () => clearTimeout(t);
  }, [entry, date]);

  // Auto-save with debounce only when there are actual changes compared to last saved snapshot
  useEffect(() => {
    if (!isEditingToday) return; // Only auto-save today's entry
    if (syncingRef.current) return; // Skip autosave when syncing from props

    const current = snapshot();
    const hasContent =
      Boolean(current.content) ||
      Boolean(current.mood) ||
      current.wins.some((w) => w);
    const hasChanges = !equals(lastSavedRef.current, current);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (hasContent && hasChanges) {
      setSaveStatus("saving");
      saveTimeoutRef.current = setTimeout(async () => {
        await handleSave();
      }, 2000);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, mood, wins, isEditingToday]);

  const handleSave = async () => {
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: date.toISOString(),
          mood,
          content,
          wins: wins.filter((w) => w.trim()),
          prompt,
        }),
      });

      if (res.ok) {
        const savedEntry = await res.json();
        onSave(savedEntry);
        setSaveStatus("saved");
        // Update last saved snapshot to current
        lastSavedRef.current = snapshot();
      }
    } catch (error) {
      console.error("Failed to save entry:", error);
      setSaveStatus("idle");
    }
  };

  const handleWinChange = (index: number, value: string) => {
    const newWins = [...wins];
    newWins[index] = value;
    setWins(newWins);
  };

  return (
    <div className="space-y-6">
      {/* Read-only banner for past entries */}
      {!isEditingToday && (
        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-400">
              <span className="text-2xl">📖</span>
              <span className="font-medium">
                Viewing past entry from {format(date, "MMMM d, yyyy")} -
                Read-only mode
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mood Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How are you feeling?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 justify-center">
            {MOODS.map((m) => (
              <button
                key={m.value}
                onClick={() => isEditingToday && setMood(m.value)}
                disabled={!isEditingToday}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-lg transition-all",
                  isEditingToday && "hover:scale-110",
                  mood === m.value
                    ? "bg-primary/10 ring-2 ring-primary"
                    : isEditingToday
                    ? "hover:bg-muted"
                    : "opacity-70 cursor-not-allowed"
                )}
              >
                <span className="text-4xl">{m.emoji}</span>
                <span className={cn("text-xs font-medium", m.color)}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Today's Progress (only show for today) */}
      {isEditingToday && (todayStats.tasks > 0 || todayStats.pomodoros > 0) && (
        <Card className="bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6 justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {todayStats.tasks}
                </div>
                <div className="text-sm text-muted-foreground">
                  Tasks Completed
                </div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {todayStats.pomodoros}
                </div>
                <div className="text-sm text-muted-foreground">
                  Focus Sessions
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Wins */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">✨ Today's Wins</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-muted-foreground">•</span>
              <Input
                value={wins[index] || ""}
                onChange={(e) => handleWinChange(index, e.target.value)}
                placeholder={`Win #${index + 1}`}
                className="flex-1"
                disabled={!isEditingToday}
                readOnly={!isEditingToday}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Journal Entry */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>📝 {prompt}</CardTitle>
              {saveStatus === "saving" && (
                <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </p>
              )}
              {saveStatus === "saved" && (
                <p className="text-sm text-green-600 flex items-center gap-2 mt-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Saved
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Edit
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showPreview || !isEditingToday ? (
            <div className="markdown-preview min-h-75 p-4 border rounded-lg">
              <MarkdownPreview
                source={content || "*Nothing written yet...*"}
                style={{
                  padding: 0,
                  backgroundColor: "transparent",
                  color: "inherit",
                }}
                data-color-mode="light"
              />
            </div>
          ) : (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts... (Markdown supported)"
              className="min-h-75 resize-none font-mono"
            />
          )}
        </CardContent>
      </Card>

      {/* Character Count */}
      <div className="text-sm text-muted-foreground text-left">
        {content.length} characters •{" "}
        {content.trim() ? content.trim().split(/\s+/).length : 0} words
      </div>
    </div>
  );
}
