"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  MoreVertical,
  ExternalLink,
  Pin,
  Trash2,
  Edit,
  Link as LinkIcon,
} from "lucide-react";
import Image from "next/image";

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

interface BookmarkGridProps {
  bookmarks: Bookmark[];
  onUpdate: (bookmark: Bookmark) => void;
  onDelete: (id: string) => void;
}

export function BookmarkGrid({
  bookmarks,
  onUpdate,
  onDelete,
}: BookmarkGridProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handlePin = async (bookmark: Bookmark) => {
    const action = bookmark.isPinned ? "unpinned" : "pinned";

    try {
      const res = await fetch(`/api/bookmarks/${bookmark.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: !bookmark.isPinned }),
      });

      if (res.ok) {
        const updated = await res.json();
        onUpdate(updated);
        toast.success(`Bookmark ${action}!`);
      } else {
        toast.error(`Failed to ${action.slice(0, -2)} bookmark`);
      }
    } catch (error) {
      console.error("Error updating bookmark:", error);
      toast.error("Failed to update bookmark");
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/bookmarks/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onDelete(id);
        toast.success("Bookmark deleted successfully!");
      } else {
        toast.error("Failed to delete bookmark");
      }
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      toast.error("Failed to delete bookmark. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {bookmarks.map((bookmark) => (
        <Card
          key={bookmark.id}
          className="group hover:shadow-lg transition-shadow overflow-hidden"
        >
          {/* Image Preview */}
          <div className="relative h-48 w-full bg-linear-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
            {bookmark.imageUrl ? (
              <Image
                src={bookmark.imageUrl}
                alt={bookmark.title}
                fill
                className="object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <LinkIcon className="w-16 h-16 text-muted-foreground/30" />
              </div>
            )}
          </div>

          <CardContent className="p-4">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              {/* Favicon */}
              {bookmark.favicon && (
                <img
                  src={bookmark.favicon}
                  alt=""
                  className="w-6 h-6 rounded mt-0.5 shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}

              {/* Title & Description */}
              <div className="flex-1 min-w-0">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold hover:text-blue-600 transition-colors line-clamp-2 block"
                >
                  {bookmark.title}
                </a>
                {bookmark.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {bookmark.description}
                  </p>
                )}
              </div>

              {/* Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => window.open(bookmark.url, "_blank")}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open Link
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handlePin(bookmark)}>
                    <Pin className="w-4 h-4 mr-2" />
                    {bookmark.isPinned ? "Unpin" : "Pin"}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(bookmark.id)}
                    className="text-red-600"
                    disabled={deletingId === bookmark.id}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deletingId === bookmark.id ? "Deleting..." : "Delete"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Tags & Collection */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Collection Badge */}
              <Badge
                variant="secondary"
                style={{ backgroundColor: `${bookmark.collection.color}20` }}
              >
                <span className="mr-1">{bookmark.collection.emoji}</span>
                {bookmark.collection.name}
              </Badge>

              {/* Tags */}
              {bookmark.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
              {bookmark.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{bookmark.tags.length - 2}
                </Badge>
              )}

              {/* Pin Indicator */}
              {bookmark.isPinned && (
                <Pin className="w-3 h-3 ml-auto text-muted-foreground" />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
