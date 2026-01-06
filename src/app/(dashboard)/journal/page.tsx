import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { JournalView } from "@/components/journal/journal-view";
import { startOfDay, subDays } from "date-fns";

export default async function JournalPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    redirect("/login");
  }

  // Get last 90 days of entries for calendar
  const startDate = subDays(new Date(), 90);
  const entries = await prisma.journalEntry.findMany({
    where: {
      userId: user.id,
      date: { gte: startDate },
    },
    orderBy: { date: "desc" },
  });

  // Get today's entry
  const today = startOfDay(new Date());
  const todayEntry = await prisma.journalEntry.findFirst({
    where: {
      userId: user.id,
      date: {
        gte: today,
        lte: new Date(),
      },
    },
  });

  // Get today's stats from other features
  const todayTasks = await prisma.task.count({
    where: {
      userId: user.id,
      status: "DONE",
      updatedAt: { gte: today },
    },
  });

  const todayPomodoros = await prisma.pomodoroSession.count({
    where: {
      userId: user.id,
      type: "WORK",
      completed: true,
      createdAt: { gte: today },
    },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <JournalView
        entries={entries}
        todayEntry={todayEntry}
        todayStats={{ tasks: todayTasks, pomodoros: todayPomodoros }}
        userCreatedAt={user.createdAt}
      />
    </div>
  );
}
