"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  Download,
  Check,
  Loader2,
  WifiOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import MarkdownPreview from "@uiw/react-markdown-preview";

interface NotesEditorProps {
  initialContent: string;
  initialUpdatedAt: Date;
}

type SaveStatus = "saved" | "saving" | "offline";

export function NotesEditor({
  initialContent,
  initialUpdatedAt,
}: NotesEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [lastSaved, setLastSaved] = useState(initialUpdatedAt);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    checkDarkMode();

    // Watch for dark mode changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Auto-save with 2s debounce
  useEffect(() => {
    if (!isOnline) {
      setSaveStatus("offline");
      return;
    }

    if (content === initialContent) return;

    setSaveStatus("saving");

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });

        if (res.ok) {
          const data = await res.json();
          setLastSaved(new Date(data.updatedAt));
          setSaveStatus("saved");
        }
      } catch (error) {
        console.error("Error saving note:", error);
        setSaveStatus("offline");
      }
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, isOnline, initialContent]);

  // Character and word count
  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  // Export as markdown
  const handleExport = () => {
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notes-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Save status indicator
  const StatusIndicator = () => {
    switch (saveStatus) {
      case "saving":
        return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Saving...</span>
          </div>
        );
      case "saved":
        return (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
            <Check className="w-3 h-3" />
            <span>
              Saved {formatDistanceToNow(lastSaved, { addSuffix: true })}
            </span>
          </div>
        );
      case "offline":
        return (
          <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-500">
            <WifiOff className="w-3 h-3" />
            <span>Offline</span>
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full",
        isFullScreen && "fixed inset-0 z-50 bg-background"
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Quick Notes</h1>
          <StatusIndicator />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Edit
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </>
            )}
          </Button>

          <Button variant="ghost" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullScreen(!isFullScreen)}
          >
            {isFullScreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Editor / Preview */}
      <div className="flex-1 overflow-hidden">
        {showPreview ? (
          <div className="h-full overflow-auto px-8 py-6">
            <div className="max-w-4xl mx-auto markdown-preview">
              <MarkdownPreview
                source={content || "*Nothing to preview*"}
                style={{
                  padding: 0,
                  backgroundColor: "transparent",
                  color: "inherit",
                }}
                data-color-mode={isDark ? "dark" : "light"}
                wrapperElement={{
                  "data-color-mode": isDark ? "dark" : "light",
                }}
              />
            </div>
          </div>
        ) : (
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start typing... (Markdown supported)"
            className="h-full resize-none border-0 focus-visible:ring-0 px-8 py-6 text-base font-mono"
          />
        )}
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-between px-6 py-3 border-t text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{charCount.toLocaleString()} characters</span>
          <span>•</span>
          <span>{wordCount.toLocaleString()} words</span>
        </div>
        <div className="text-xs">
          Tip: Use Markdown for formatting (# heading, **bold**, *italic*)
        </div>
      </div>

      <style jsx global>{`
        .markdown-preview ul,
        .markdown-preview ol {
          list-style: revert !important;
          padding-left: 2em !important;
        }

        .markdown-preview ul {
          list-style-type: disc !important;
        }

        .markdown-preview ol {
          list-style-type: decimal !important;
        }

        .markdown-preview li {
          display: list-item !important;
        }

        .markdown-preview input[type="checkbox"] {
          margin-right: 0.5em;
        }
      `}</style>
    </div>
  );
}
