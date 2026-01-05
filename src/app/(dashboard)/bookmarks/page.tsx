import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookmarksView } from "@/components/bookmarks/bookmarks-view";

export default async function BookmarksPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  // Fetch collections and bookmarks
  const collections = await prisma.collection.findMany({
    where: { userId: session.user.id },
    include: {
      _count: {
        select: { bookmarks: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: session.user.id },
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

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Bookmarks</h1>
          <p className="text-muted-foreground mt-2">
            Save and organize your favorite dev resources
          </p>
        </div>

        <BookmarksView
          initialCollections={collections}
          initialBookmarks={bookmarks}
        />
      </div>
    </div>
  );
}
