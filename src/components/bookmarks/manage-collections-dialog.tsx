"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Collection {
  id: string;
  name: string;
  emoji: string;
  color: string;
  description: string | null;
  _count: { bookmarks: number };
}

interface ManageCollectionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collections: Collection[];
  onDelete: (id: string) => void;
}

export function ManageCollectionsDialog({
  open,
  onOpenChange,
  collections,
  onDelete,
}: ManageCollectionsDialogProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/collections/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onDelete(id);
        toast.success("Collection deleted successfully!");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete collection");
      }
    } catch (error) {
      console.error("Error deleting collection:", error);
      toast.error("Failed to delete collection");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Collections</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {collections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No collections yet</p>
            </div>
          ) : (
            collections.map((collection) => (
              <div
                key={collection.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                style={{
                  borderLeftColor: collection.color,
                  borderLeftWidth: "4px",
                }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-3xl">{collection.emoji}</span>
                  <div className="flex-1">
                    <p className="font-semibold">{collection.name}</p>
                    {collection.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {collection.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {collection._count.bookmarks}{" "}
                      {collection._count.bookmarks === 1
                        ? "bookmark"
                        : "bookmarks"}
                    </p>
                  </div>
                </div>

                {collection._count.bookmarks === 0 ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(collection.id)}
                    disabled={deletingId === collection.id}
                  >
                    {deletingId === collection.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </>
                    )}
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Delete bookmarks first
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
