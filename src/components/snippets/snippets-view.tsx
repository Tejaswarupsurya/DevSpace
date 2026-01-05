"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DialogClose } from "@/components/ui/dialog";
import { Copy, Plus, Trash2, Pencil, Check } from "lucide-react";
import { toast } from "sonner";

interface Snippet {
  id: string;
  title: string;
  code: string;
  language: string;
  tags: string[];
  description?: string | null;
  updatedAt: string | Date;
}

const LANGUAGES = [
  "typescript",
  "javascript",
  "python",
  "java",
  "go",
  "rust",
  "bash",
  "sql",
];

export default function SnippetsView({
  initialSnippets,
}: {
  initialSnippets: Snippet[];
}) {
  const [snippets, setSnippets] = useState<Snippet[]>(initialSnippets || []);
  const [q, setQ] = useState("");
  const [language, setLanguage] = useState<string | undefined>(undefined);
  const [tagsQuery, setTagsQuery] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const tags = tagsQuery
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    return snippets.filter((s) => {
      const matchesQ = q
        ? [s.title, s.description || "", s.code].some((f) =>
            f.toLowerCase().includes(q.toLowerCase())
          )
        : true;
      const matchesLang = language ? s.language === language : true;
      const matchesTags = tags.length
        ? tags.every((t) => s.tags.includes(t))
        : true;
      return matchesQ && matchesLang && matchesTags;
    });
  }, [snippets, q, language, tagsQuery]);

  const copyToClipboard = async (id: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedId(null), 1200);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const createSnippet = async (payload: Partial<Snippet>) => {
    const res = await fetch("/api/snippets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const s = await res.json();
      setSnippets((prev) => [s, ...prev]);
    }
  };

  const updateSnippet = async (id: string, payload: Partial<Snippet>) => {
    const res = await fetch(`/api/snippets/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const s = await res.json();
      setSnippets((prev) => prev.map((x) => (x.id === id ? s : x)));
    }
  };

  const deleteSnippet = async (id: string) => {
    const res = await fetch(`/api/snippets/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSnippets((prev) => prev.filter((x) => x.id !== id));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Snippets</h1>
          <p className="text-muted-foreground">
            Store reusable code for quick access and copy.
          </p>
        </div>

        {/* Add Snippet */}
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" /> New Snippet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Snippet</DialogTitle>
            </DialogHeader>
            <SnippetForm onSubmit={createSnippet} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Search title, description, code"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <Select value={language} onValueChange={(v) => setLanguage(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGES.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          placeholder="Tags (comma-separated)"
          value={tagsQuery}
          onChange={(e) => setTagsQuery(e.target.value)}
        />
      </div>

      {/* Snippet List or Empty State */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-6xl mb-4">📎</div>
          <h2 className="text-xl font-semibold mb-2">No snippets yet</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Start storing your reusable code patterns for faster development.
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Add Your First Snippet
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Snippet</DialogTitle>
              </DialogHeader>
              <SnippetForm onSubmit={createSnippet} />
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((s) => (
            <Card key={s.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="truncate" title={s.title}>
                    {s.title}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(s.id, s.code)}
                    >
                      {copiedId === s.id ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Edit Snippet</DialogTitle>
                        </DialogHeader>
                        <SnippetForm
                          initial={{
                            title: s.title,
                            code: s.code,
                            language: s.language,
                            tags: s.tags,
                            description: s.description || "",
                          }}
                          onSubmit={(payload) => updateSnippet(s.id, payload)}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSnippet(s.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{s.language}</Badge>
                  {s.tags.map((t, i) => (
                    <Badge key={i}>{t}</Badge>
                  ))}
                </div>
                {s.description ? (
                  <p
                    className="text-xs text-muted-foreground line-clamp-2"
                    title={s.description}
                  >
                    {s.description}
                  </p>
                ) : null}
                <pre className="text-xs bg-zinc-950 text-zinc-100 p-3 rounded-md overflow-auto max-h-48">
                  <code>{s.code}</code>
                </pre>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SnippetForm({
  initial,
  onSubmit,
}: {
  initial?: {
    title: string;
    code: string;
    language: string;
    tags: string[];
    description?: string;
  };
  onSubmit: (payload: Partial<Snippet>) => Promise<void> | void;
}) {
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [title, setTitle] = useState(initial?.title || "");
  const [code, setCode] = useState(initial?.code || "");
  const [language, setLanguage] = useState(initial?.language || "typescript");
  const [tags, setTags] = useState<string>((initial?.tags || []).join(", "));
  const [description, setDescription] = useState(initial?.description || "");

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const payload = {
          title,
          code,
          language,
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          description,
        };
        await onSubmit(payload);
        // Close the dialog after successful submit
        closeRef.current?.click();
      }}
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        required
      />
      <Select value={language} onValueChange={(v) => setLanguage(v)}>
        <SelectTrigger>
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((l) => (
            <SelectItem key={l} value={l}>
              {l}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="Tags (comma-separated)"
      />
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        className="resize-none"
      />
      <Textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Code"
        className="min-h-48 max-h-80 overflow-auto resize-none font-mono"
      />
      <div className="flex justify-end">
        <Button type="submit">Save</Button>
        {/* Hidden close button to programmatically close the dialog */}
        <DialogClose asChild>
          <button ref={closeRef} className="hidden" aria-hidden="true" />
        </DialogClose>
      </div>
    </form>
  );
}
