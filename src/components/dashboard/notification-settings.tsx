"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Bell, ChevronLeft, ChevronRight } from "lucide-react";
import {
  notificationManager,
  scheduleDailyReminder,
} from "@/lib/notifications";
import { toast } from "sonner";

export function NotificationSettings() {
  const [hasPermission, setHasPermission] = useState(false);
  const [journalReminderEnabled, setJournalReminderEnabled] = useState(false);
  const [journalReminderHour, setJournalReminderHour] = useState(22); // 10 PM default

  useEffect(() => {
    // Check permission on mount
    setHasPermission(notificationManager.hasPermission());

    // Load saved settings from localStorage
    const savedEnabled =
      localStorage.getItem("journal-reminder-enabled") === "true";
    const savedHour = localStorage.getItem("journal-reminder-hour");

    if (savedEnabled) {
      setJournalReminderEnabled(true);
    }
    if (savedHour) {
      setJournalReminderHour(parseInt(savedHour));
    }
  }, []);

  useEffect(() => {
    // Schedule reminder when enabled
    if (journalReminderEnabled && hasPermission) {
      const cleanup = scheduleDailyReminder(journalReminderHour, 0, {
        title: "📖 Time to Journal!",
        body: "Take a moment to reflect on your day and write in your journal.",
        tag: "journal-reminder",
        requireInteraction: true,
        onClick: () => {
          window.location.href = "/journal";
        },
      });

      // Save settings
      localStorage.setItem("journal-reminder-enabled", "true");
      localStorage.setItem(
        "journal-reminder-hour",
        journalReminderHour.toString()
      );

      return cleanup;
    } else {
      localStorage.setItem("journal-reminder-enabled", "false");
    }
  }, [journalReminderEnabled, journalReminderHour, hasPermission]);

  const requestPermission = async () => {
    const permission = await notificationManager.requestPermission();
    setHasPermission(permission === "granted");

    if (permission === "granted") {
      toast.success("✅ Notifications enabled!");
    } else {
      toast.error("❌ Notification permission denied");
    }
  };

  const testNotification = () => {
    notificationManager.notify({
      title: "🎉 Test Notification",
      body: "Notifications are working perfectly!",
      tag: "test",
      autoClose: 5000,
    });
    toast.success("Test notification sent!");
  };

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Manage your notification preferences and reminders
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Permission Status */}
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-medium">
              Browser Notifications
            </Label>
            <p className="text-sm text-muted-foreground">
              {hasPermission ? "Enabled" : "Enable to receive reminders"}
            </p>
          </div>
          {!hasPermission ? (
            <Button onClick={requestPermission} size="sm">
              <Bell className="w-4 h-4 mr-2" />
              Enable
            </Button>
          ) : (
            <Button onClick={testNotification} variant="outline" size="sm">
              Test
            </Button>
          )}
        </div>

        {hasPermission && (
          <>
            {/* Journal Reminder */}
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label
                    htmlFor="journal-reminder"
                    className="text-base font-medium"
                  >
                    Daily Journal Reminder
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded to write in your journal every day
                  </p>
                </div>
                <Switch
                  id="journal-reminder"
                  checked={journalReminderEnabled}
                  onCheckedChange={setJournalReminderEnabled}
                />
              </div>

              {journalReminderEnabled && (
                <div className="ml-4 space-y-3">
                  <Label className="text-sm">Reminder Time</Label>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setJournalReminderHour((prev) =>
                          prev === 0 ? 23 : prev - 1
                        )
                      }
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 text-center">
                      <div className="text-2xl font-bold">
                        {formatHour(journalReminderHour)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Daily reminder
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setJournalReminderHour((prev) =>
                          prev === 23 ? 0 : prev + 1
                        )
                      }
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                💡 <strong>Tip:</strong> Keep DevSpace open in a tab to ensure
                you receive notifications. The app uses PWA technology, so you
                can install it to your home screen for better reliability!
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
