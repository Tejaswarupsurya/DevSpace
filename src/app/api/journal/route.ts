import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays } from "date-fns";

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date");
    const daysParam = searchParams.get("days");

    // Get specific date entry
    if (dateParam) {
      const targetDate = new Date(dateParam);
      const entry = await prisma.journalEntry.findFirst({
        where: {
          userId: user.id,
          date: {
            gte: startOfDay(targetDate),
            lte: endOfDay(targetDate),
          },
        },
      });

      return NextResponse.json(entry || null);
    }

    // Get last N days
    const days = daysParam ? parseInt(daysParam) : 30;
    const startDate = subDays(new Date(), days);

    const entries = await prisma.journalEntry.findMany({
      where: {
        userId: user.id,
        date: { gte: startDate },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    const { date, mood, content, wins, prompt } = await req.json();
    const targetDate = new Date(date);

    // Upsert: update if exists, create if not
    const entry = await prisma.journalEntry.upsert({
      where: {
        userId_date: {
          userId: user.id,
          date: startOfDay(targetDate),
        },
      },
      update: {
        mood,
        content,
        wins,
        prompt,
      },
      create: {
        date: startOfDay(targetDate),
        mood,
        content,
        wins: wins || [],
        prompt,
        userId: user.id,
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Error saving journal entry:", error);
    return NextResponse.json(
      { error: "Failed to save entry" },
      { status: 500 }
    );
  }
}
