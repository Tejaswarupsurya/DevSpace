"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, BookmarkPlus } from "lucide-react";
import { BookmarkGrid } from "./bookmark-grid";
import { AddCollectionDialog } from "./add-collection-dialog";
import { AddBookmarkDialog } from "./add-bookmark-dialog";

interface Collection {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string | null;
  _count: { bookmarks: number };
}

interface Bookmark {
  id: string;
  url: string;
  title: string;
  description: string | null;
  favicon: string | null;
  imageUrl: string | null;
  tags: string[];
  isPinned: boolean;
  isRead: boolean;
  collection: {
    id: string;
    name: string;
    emoji: string;
    color: string;
  };
}

interface BookmarksViewProps {
  initialCollections: Collection[];
  initialBookmarks: Bookmark[];
}

export function BookmarksView({
  initialCollections,
  initialBookmarks,
}: BookmarksViewProps) {
  const [collections, setCollections] = useState(initialCollections);
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [showBookmarkDialog, setShowBookmarkDialog] = useState(false);

  // Filter bookmarks based on selected collection and search
  const filteredBookmarks = bookmarks.filter((bookmark) => {
    const matchesCollection = selectedCollection
      ? bookmark.collection.id === selectedCollection
      : true;

    const matchesSearch = searchQuery
      ? bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        bookmark.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : true;

    return matchesCollection && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Actions */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setShowCollectionDialog(true)} variant="outline">
          <Plus className="w-4 h-4 mr-2" />
          New Collection
        </Button>
        <Button onClick={() => setShowBookmarkDialog(true)}>
          <BookmarkPlus className="w-4 h-4 mr-2" />
          Add Bookmark
        </Button>
      </div>

      {/* Collections Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setSelectedCollection(null)}>
            All ({bookmarks.length})
          </TabsTrigger>
          {collections.map((collection) => (
            <TabsTrigger
              key={collection.id}
              value={collection.id}
              onClick={() => setSelectedCollection(collection.id)}
            >
              <span className="mr-1">{collection.emoji}</span>
              {collection.name} ({collection._count.bookmarks})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedCollection || "all"}>
          {filteredBookmarks.length === 0 ? (
            <div className="text-center py-12">
              <BookmarkPlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No bookmarks yet</h3>
              <p className="text-muted-foreground mb-4">
                Start saving your favorite dev resources
              </p>
              <Button onClick={() => setShowBookmarkDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Bookmark
              </Button>
            </div>
          ) : (
            <BookmarkGrid
              bookmarks={filteredBookmarks}
              onUpdate={(updated) => {
                setBookmarks((prev) =>
                  prev.map((b) => (b.id === updated.id ? updated : b))
                );
              }}
              onDelete={(id) => {
                setBookmarks((prev) => prev.filter((b) => b.id !== id));
              }}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddCollectionDialog
        open={showCollectionDialog}
        onOpenChange={setShowCollectionDialog}
        onSuccess={(newCollection) => {
          setCollections((prev) => [newCollection, ...prev]);
        }}
      />

      <AddBookmarkDialog
        open={showBookmarkDialog}
        onOpenChange={setShowBookmarkDialog}
        collections={collections}
        onSuccess={(newBookmark) => {
          setBookmarks((prev) => [newBookmark, ...prev]);
        }}
      />
    </div>
  );
}
