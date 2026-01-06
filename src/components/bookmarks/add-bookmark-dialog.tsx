"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, X } from "lucide-react";

interface Collection {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

interface AddBookmarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collections: Collection[];
  onSuccess: (bookmark: any) => void;
}

export function AddBookmarkDialog({
  open,
  onOpenChange,
  collections,
  onSuccess,
}: AddBookmarkDialogProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [collectionId, setCollectionId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchMetadata = async () => {
    if (!url) return;

    setFetchingMetadata(true);
    try {
      const res = await fetch("/api/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (res.ok) {
        const data = await res.json();

        // Check if we got Cloudflare or blocked content
        if (data.title === "Just a moment...") {
          throw new Error("Blocked by Cloudflare");
        }

        setMetadata(data);
        setTitle(data.title);
        setDescription(data.description);
        toast.success("Metadata fetched successfully!");
      } else {
        throw new Error("Failed to fetch");
      }
    } catch (error) {
      console.error("Error fetching metadata:", error);

      // Fallback: Use URL as title
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace("www.", "");
      const fallbackTitle = domain.charAt(0).toUpperCase() + domain.slice(1);

      setTitle(fallbackTitle);
      setMetadata({
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
        title: fallbackTitle,
        description: "",
        imageUrl: null,
      });

      toast.warning(
        `Couldn't fetch metadata. Using "${fallbackTitle}" as title.`
      );
    } finally {
      setFetchingMetadata(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          title,
          description,
          collectionId,
          tags,
          favicon: metadata?.favicon,
          imageUrl: metadata?.imageUrl,
        }),
      });

      if (res.ok) {
        const bookmark = await res.json();
        onSuccess(bookmark);
        toast.success("Bookmark added successfully!");
        onOpenChange(false);
        // Reset form
        setUrl("");
        setTitle("");
        setDescription("");
        setCollectionId("");
        setTags([]);
        setMetadata(null);
      } else {
        toast.error("Failed to add bookmark");
      }
    } catch (error) {
      console.error("Error creating bookmark:", error);
      toast.error("Failed to add bookmark. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Bookmark</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL with Auto-fetch */}
          <div>
            <Label htmlFor="url">URL</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={fetchMetadata}
                disabled={!url || fetchingMetadata}
              >
                {fetchingMetadata ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Fetch"
                )}
              </Button>
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bookmark title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this about?"
              rows={3}
            />
          </div>

          {/* Collection */}
          <div>
            <Label>Collection</Label>
            <Select
              value={collectionId}
              onValueChange={setCollectionId}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a collection" />
              </SelectTrigger>
              <SelectContent>
                {collections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    <span className="mr-2">{collection.emoji}</span>
                    {collection.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags */}
          <div>
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add tag and press Enter"
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title || !collectionId}>
              {loading ? "Adding..." : "Add Bookmark"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
