import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE bookmark
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const bookmark = await prisma.bookmark.findUnique({
      where: { id },
    });

    if (!bookmark || bookmark.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.bookmark.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting bookmark:", error);
    return NextResponse.json(
      { error: "Failed to delete bookmark" },
      { status: 500 }
    );
  }
}

// PATCH update bookmark
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const bookmark = await prisma.bookmark.findUnique({
      where: { id },
    });

    if (!bookmark || bookmark.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.bookmark.update({
      where: { id },
      data: body,
      include: {
        collection: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating bookmark:", error);
    return NextResponse.json(
      { error: "Failed to update bookmark" },
      { status: 500 }
    );
  }
}
