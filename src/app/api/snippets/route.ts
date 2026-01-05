import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET: list snippets (optional filters via query: q, language, tags)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || undefined;
    const language = searchParams.get("language") || undefined;
    const tags = searchParams.getAll("tags") || [];

    const snippets = await prisma.snippet.findMany({
      where: {
        userId: user.id,
        ...(q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { code: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(language ? { language } : {}),
        ...(tags.length ? { tags: { hasSome: tags } } : {}),
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(snippets);
  } catch (error) {
    console.error("Error fetching snippets:", error);
    return NextResponse.json(
      { error: "Failed to fetch snippets" },
      { status: 500 }
    );
  }
}

// POST: create snippet
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { title, code, language, tags, description } = await req.json();

    const snippet = await prisma.snippet.create({
      data: {
        title,
        code,
        language,
        tags: tags || [],
        description,
        userId: user.id,
      },
    });

    return NextResponse.json(snippet, { status: 201 });
  } catch (error) {
    console.error("Error creating snippet:", error);
    return NextResponse.json(
      { error: "Failed to create snippet" },
      { status: 500 }
    );
  }
}
