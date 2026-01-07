/**
 * Centralized notification management system
 * Handles browser notifications with enhanced features
 */

export interface NotificationOptions {
  title: string;
  body: string;
  requireInteraction?: boolean;
  tag?: string;
  silent?: boolean;
  autoClose?: number; // Auto-close after X milliseconds
  onClick?: () => void;
}

export class NotificationManager {
  private static instance: NotificationManager;
  private permission: NotificationPermission = "default";

  private constructor() {
    if (typeof window !== "undefined" && "Notification" in window) {
      this.permission = Notification.permission;
    }
  }

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  hasPermission(): boolean {
    if (typeof window === "undefined") return false;
    return this.permission === "granted";
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return "denied";
    }

    if (this.permission === "default") {
      this.permission = await Notification.requestPermission();
    }

    return this.permission;
  }

  async notify(options: NotificationOptions): Promise<void> {
    if (typeof window === "undefined") return;

    // Request permission if not already granted
    if (this.permission !== "granted") {
      const permission = await this.requestPermission();
      if (permission !== "granted") {
        console.warn("Notification permission denied");
        return;
      }
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: "/devspace-logo.png",
        badge: "/devspace-logo.png",
        tag: options.tag || "devspace",
        requireInteraction: options.requireInteraction ?? false,
        silent: options.silent ?? false,
        // @ts-ignore - vibrate and timestamp are supported but not in all type definitions
        timestamp: Date.now(),
        vibrate: [200, 100, 200],
      });

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
        options.onClick?.();
      };

      // Auto-close if specified
      if (options.autoClose) {
        setTimeout(() => notification.close(), options.autoClose);
      }
    } catch (error) {
      console.error("Failed to show notification:", error);
    }
  }

  getPermission(): NotificationPermission {
    return this.permission;
  }
}

// Singleton instance
export const notificationManager = NotificationManager.getInstance();

/**
 * Schedule daily reminder at specific time (e.g., 10 PM for journal)
 */
export function scheduleDailyReminder(
  hour: number,
  minute: number,
  notification: NotificationOptions
): () => void {
  if (typeof window === "undefined") {
    return () => {}; // No-op cleanup for SSR
  }

  let timeoutId: NodeJS.Timeout | null = null;

  const scheduleNext = () => {
    const now = new Date();
    const scheduled = new Date();
    scheduled.setHours(hour, minute, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (now > scheduled) {
      scheduled.setDate(scheduled.getDate() + 1);
    }

    const msUntilScheduled = scheduled.getTime() - now.getTime();

    timeoutId = setTimeout(() => {
      notificationManager.notify(notification);
      scheduleNext(); // Schedule next day
    }, msUntilScheduled);
  };

  scheduleNext();

  // Return cleanup function
  return () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  };
}

/**
 * Quick notification helpers
 */
export const notifications = {
  success: (title: string, body: string) =>
    notificationManager.notify({
      title,
      body,
      tag: "success",
      autoClose: 5000,
    }),

  info: (title: string, body: string) =>
    notificationManager.notify({ title, body, tag: "info", autoClose: 8000 }),

  warning: (title: string, body: string) =>
    notificationManager.notify({
      title,
      body,
      tag: "warning",
      requireInteraction: true,
    }),

  error: (title: string, body: string) =>
    notificationManager.notify({
      title,
      body,
      tag: "error",
      requireInteraction: true,
    }),
};
