import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// DELETE collection
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
    const collection = await prisma.collection.findUnique({
      where: { id },
      include: {
        _count: {
          select: { bookmarks: true },
        },
      },
    });

    if (!collection || collection.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check if collection has bookmarks
    if (collection._count.bookmarks > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete collection with bookmarks. Delete bookmarks first.",
        },
        { status: 400 }
      );
    }

    await prisma.collection.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return NextResponse.json(
      { error: "Failed to delete collection" },
      { status: 500 }
    );
  }
}
