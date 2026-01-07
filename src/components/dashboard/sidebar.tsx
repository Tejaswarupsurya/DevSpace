"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
  Menu,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";

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
  const [open, setOpen] = useState(false);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="p-6 border-b flex items-center">
        <Link href="/dashboard" onClick={() => setOpen(false)}>
          <Image
            src="/devspace-logo.png"
            alt="DevSpace"
            width={300}
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
          onClick={() => setOpen(false)}
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
                    onClick={() => setOpen(false)}
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
        <div className="flex items-center gap-3 mb-4">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name || "User"}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-zinc-200 dark:bg-zinc-700 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold">
                {user.name?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {user.email}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-zinc-900 border-b px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard">
          <Image
            src="/devspace-logo.png"
            alt="DevSpace"
            width={120}
            height={30}
            priority
          />
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <div className="flex flex-col h-full bg-white dark:bg-zinc-900">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col w-64 border-r bg-white dark:bg-zinc-900">
        <SidebarContent />
      </div>
    </>
  );
}
