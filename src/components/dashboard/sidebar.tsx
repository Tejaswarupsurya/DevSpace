"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Bookmark,
  CheckSquare,
  StickyNote,
  BookOpen,
  Code2,
  Timer,
  Sparkles,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const navigationSections = [
  {
    section: "Work",
    items: [
      { name: "Tasks", href: "/tasks", icon: CheckSquare },
      { name: "Pomodoro", href: "/pomodoro", icon: Timer },
    ],
  },
  {
    section: "Knowledge",
    items: [
      { name: "Notes", href: "/notes", icon: StickyNote },
      { name: "Snippets", href: "/snippets", icon: Code2 },
      { name: "Bookmarks", href: "/bookmarks", icon: Bookmark },
    ],
  },
  {
    section: "Reflection",
    items: [{ name: "Journal", href: "/journal", icon: BookOpen }],
  },
  {
    section: "Tools",
    items: [{ name: "AI Assistant", href: "/ai", icon: Sparkles }],
  },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 border-r bg-white dark:bg-zinc-900">
      {/* Logo */}
      <div className="p-6 border-b flex items-center">
        <Link href="/dashboard">
          <Image
            src="/devspace-logo.png"
            alt="DevSpace"
            width={150}
            height={38}
            priority
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Dashboard - standalone */}
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            pathname === "/dashboard"
              ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
              : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          )}
        >
          <LayoutDashboard className="w-5 h-5" />
          Dashboard
        </Link>

        {/* Sectioned navigation */}
        {navigationSections.map((section) => (
          <div key={section.section}>
            <h3 className="px-3 mb-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              {section.section}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-3 mb-3">
          <img
            src={user?.image || ""}
            alt={user?.name || "User"}
            className="w-10 h-10 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => signOut({ callbackUrl: "/login" })}
          suppressHydrationWarning
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
