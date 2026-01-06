import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { startOfDay, endOfDay } from "date-fns";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch user's workspace data for AI context
    const [tasks, snippets, bookmarks, notes, todayJournal, recentPomodoros] =
      await Promise.all([
        // Active tasks only
        prisma.task.findMany({
          where: {
            userId: user.id,
            status: { in: ["TODO", "IN_PROGRESS"] },
          },
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            priority: true,
            tags: true,
            dueDate: true,
          },
          orderBy: { updatedAt: "desc" },
          take: 20,
        }),

        // Recent snippets with full code
        prisma.snippet.findMany({
          where: { userId: user.id },
          select: {
            id: true,
            title: true,
            language: true,
            tags: true,
            description: true,
            code: true,
          },
          orderBy: { updatedAt: "desc" },
          take: 10,
        }),

        // Pinned or recent bookmarks
        prisma.bookmark.findMany({
          where: { userId: user.id },
          select: {
            id: true,
            title: true,
            url: true,
            description: true,
            tags: true,
          },
          orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
          take: 15,
        }),

        // Recent notes
        prisma.note.findMany({
          where: { userId: user.id },
          select: {
            id: true,
            title: true,
            content: true,
            tags: true,
          },
          orderBy: { updatedAt: "desc" },
          take: 5,
        }),

        // Today's journal
        prisma.journalEntry.findFirst({
          where: {
            userId: user.id,
            date: {
              gte: startOfDay(new Date()),
              lte: endOfDay(new Date()),
            },
          },
          select: {
            content: true,
            mood: true,
            wins: true,
          },
        }),

        // Recent pomodoro sessions (for productivity context)
        prisma.pomodoroSession.findMany({
          where: {
            userId: user.id,
            completed: true,
            createdAt: {
              gte: startOfDay(new Date()),
            },
          },
          select: {
            duration: true,
            type: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);

    return NextResponse.json({
      user: {
        name: session.user.name,
        githubUsername: user.githubUsername,
      },
      workspace: {
        tasks: {
          count: tasks.length,
          items: tasks,
        },
        snippets: {
          count: snippets.length,
          items: snippets,
        },
        bookmarks: {
          count: bookmarks.length,
          items: bookmarks,
        },
        notes: {
          count: notes.length,
          items: notes.map((n) => ({
            id: n.id,
            title: n.title,
            preview: n.content.substring(0, 150),
            tags: n.tags,
          })),
        },
        journal: todayJournal
          ? {
              mood: todayJournal.mood,
              wins: todayJournal.wins,
              preview: todayJournal.content.substring(0, 200),
            }
          : null,
        productivity: {
          pomodorosToday: recentPomodoros.length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching AI context:", error);
    return NextResponse.json(
      { error: "Failed to fetch context" },
      { status: 500 }
    );
  }
}
