import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET all bookmarks (with optional filters)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get("collectionId");
    const isRead = searchParams.get("isRead");
    const search = searchParams.get("search");

    const where: any = {
      userId: session.user.id,
    };

    if (collectionId) {
      where.collectionId = collectionId;
    }

    if (isRead !== null) {
      where.isRead = isRead === "true";
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { url: { contains: search, mode: "insensitive" } },
      ];
    }

    const bookmarks = await prisma.bookmark.findMany({
      where,
      include: {
        collection: {
          select: {
            id: true,
            name: true,
            emoji: true,
            color: true,
          },
        },
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(bookmarks);
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookmarks" },
      { status: 500 }
    );
  }
}

// POST create new bookmark
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      url,
      title,
      description,
      favicon,
      imageUrl,
      tags,
      collectionId,
      isPinned,
    } = body;

    if (!url || !title || !collectionId) {
      return NextResponse.json(
        { error: "URL, title, and collection are required" },
        { status: 400 }
      );
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        url,
        title,
        description,
        favicon,
        imageUrl,
        tags: tags || [],
        isPinned: isPinned || false,
        collectionId,
        userId: session.user.id,
      },
      include: {
        collection: true,
      },
    });

    return NextResponse.json(bookmark, { status: 201 });
  } catch (error) {
    console.error("Error creating bookmark:", error);
    return NextResponse.json(
      { error: "Failed to create bookmark" },
      { status: 500 }
    );
  }
}
