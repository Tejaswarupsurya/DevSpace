"use client";

import { useState, useEffect, useRef } from "react";
import { JournalEditor } from "./journal-editor";
import { JournalCalendar } from "./journal-calendar";
import { Button } from "@/components/ui/button";
import { Calendar, List } from "lucide-react";
import { format, isToday as isTodayFn } from "date-fns";

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

interface JournalViewProps {
  entries: JournalEntry[];
  todayEntry: JournalEntry | null;
  todayStats: {
    tasks: number;
    pomodoros: number;
  };
  userCreatedAt: Date;
}

export function JournalView({
  entries,
  todayEntry,
  todayStats,
  userCreatedAt,
}: JournalViewProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentEntry, setCurrentEntry] = useState(todayEntry);
  const [viewMode, setViewMode] = useState<"editor" | "calendar">("editor");
  const [allEntries, setAllEntries] = useState(entries);
  const [showEveningNudge, setShowEveningNudge] = useState(false);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [notifPermission, setNotifPermission] =
    useState<NotificationPermission | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const notificationScheduledRef = useRef<{
    date: string;
    timeoutId: number | null;
  } | null>(null);

  // Initialize notification permission/enabled state
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("Notification" in window) {
      setNotifPermission(Notification.permission);
      const enabled = localStorage.getItem("notificationsEnabled") === "true";
      setNotifEnabled(enabled);
    }
  }, []);

  // Evening nudge: after 6 PM if no entry for today
  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    const hasToday = allEntries.some(
      (e) => isTodayFn(new Date(e.date)) && e.content?.trim()
    );
    setShowEveningNudge(hour >= 18 && !hasToday);

    if (typeof window === "undefined" || !("Notification" in window)) return;

    // Schedule single daily notification at 10 PM local time
    const target = new Date();
    target.setHours(22, 0, 0, 0);
    const todayKey = `${target.getFullYear()}-${String(
      target.getMonth() + 1
    ).padStart(2, "0")}-${String(target.getDate()).padStart(2, "0")}`;
    const notifiedKey = `journal-notified-${todayKey}`;
    const alreadyNotified = localStorage.getItem(notifiedKey) === "true";

    // Only schedule once per day and only before 10 PM
    if (
      notifPermission === "granted" &&
      notifEnabled &&
      now < target &&
      !alreadyNotified
    ) {
      if (
        !notificationScheduledRef.current ||
        notificationScheduledRef.current.date !== todayKey
      ) {
        const delay = target.getTime() - now.getTime();
        const timeoutId = window.setTimeout(() => {
          const stillNoEntry = !allEntries.some(
            (e) => isTodayFn(new Date(e.date)) && e.content?.trim()
          );
          if (stillNoEntry) {
            new Notification("Evening Check-in", {
              body: "Time to reflect on your day. Write your journal?",
            });
            localStorage.setItem(notifiedKey, "true");
          }
          notificationScheduledRef.current = null;
        }, delay);
        notificationScheduledRef.current = { date: todayKey, timeoutId };
      }
    }

    return () => {
      if (notificationScheduledRef.current?.timeoutId) {
        clearTimeout(notificationScheduledRef.current.timeoutId);
        notificationScheduledRef.current = null;
      }
    };
  }, [allEntries, notifPermission, notifEnabled]);

  const requestEnableNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try {
      const result = await Notification.requestPermission();
      setNotifPermission(result);
      if (result === "granted") {
        localStorage.setItem("notificationsEnabled", "true");
        setNotifEnabled(true);
      }
    } catch (e) {
      console.error("Notification permission request failed", e);
    }
  };

  const handleDateSelect = async (date: Date) => {
    setSelectedDate(date);
    setViewMode("editor");

    // Fetch entry for selected date
    try {
      const res = await fetch(`/api/journal?date=${date.toISOString()}`);
      if (res.ok) {
        const entry = await res.json();
        setCurrentEntry(entry);
      }
    } catch (error) {
      console.error("Failed to fetch entry:", error);
    }
  };

  const handleEntrySave = (entry: JournalEntry) => {
    setCurrentEntry(entry);

    // Update entries list for calendar
    setAllEntries((prev) => {
      const existingIndex = prev.findIndex((e) => e.id === entry.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = entry;
        return updated;
      }
      return [entry, ...prev];
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Daily Journal</h1>
          <p className="text-muted-foreground">
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={viewMode === "editor" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("editor")}
          >
            <List className="w-4 h-4 mr-2" />
            Write
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("calendar")}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Calendar
          </Button>
        </div>
      </div>

      {/* Notifications Prompt */}
      {typeof window !== "undefined" && "Notification" in window && (
        <>
          {notifPermission === "default" && (
            <div className="rounded-md border bg-muted/30 px-4 py-3 text-sm flex items-center justify-between">
              <div>
                <span className="mr-2">🔔</span>
                Enable 10 PM reminders to keep your journaling streak.
              </div>
              <button
                className="text-primary underline underline-offset-2"
                onClick={requestEnableNotifications}
              >
                Enable notifications
              </button>
            </div>
          )}
          {notifPermission === "granted" && !notifEnabled && (
            <div className="rounded-md border bg-muted/30 px-4 py-3 text-sm flex items-center justify-between">
              <div>
                <span className="mr-2">🔔</span>
                Turn on daily 10 PM journal reminders.
              </div>
              <button
                className="text-primary underline underline-offset-2"
                onClick={() => {
                  localStorage.setItem("notificationsEnabled", "true");
                  setNotifEnabled(true);
                }}
              >
                Turn on
              </button>
            </div>
          )}
          {notifPermission === "denied" && (
            <div className="rounded-md border bg-muted/30 px-4 py-3 text-xs">
              🔕 Notifications are blocked in your browser for this site. You
              can enable them in your browser's site settings.
            </div>
          )}
        </>
      )}

      {/* Evening Nudge */}
      {showEveningNudge && (
        <div className="rounded-md border bg-muted/30 px-4 py-3 text-sm flex items-center justify-between">
          <div>
            <span className="mr-2">🌙</span>
            Evening check-in: No entry yet today. Want to reflect?
          </div>
          <button
            className="text-primary underline underline-offset-2"
            onClick={async () => {
              const today = new Date();
              setSelectedDate(today);
              setViewMode("editor");
              // Smoothly scroll the editor into view for immediate writing
              setTimeout(() => {
                editorRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }, 0);
            }}
          >
            Write now
          </button>
        </div>
      )}

      {/* Content */}
      {viewMode === "editor" ? (
        <div ref={editorRef}>
          <JournalEditor
            date={selectedDate}
            entry={currentEntry}
            todayStats={todayStats}
            onSave={handleEntrySave}
          />
        </div>
      ) : (
        <JournalCalendar
          entries={allEntries}
          onDateSelect={handleDateSelect}
          minDate={userCreatedAt}
        />
      )}
    </div>
  );
}
