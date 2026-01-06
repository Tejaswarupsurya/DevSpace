"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Sparkles,
  Code2,
  Bug,
  FileSearch,
  Bookmark,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  conversationId?: string;
  onNewMessage?: () => void;
}

const QUICK_ACTIONS = [
  { icon: Code2, label: "Explain code", prompt: "Can you explain this code?" },
  {
    icon: Bug,
    label: "Debug error",
    prompt: "Help me debug this error:\n```\n[paste your error here]\n```",
  },
  {
    icon: FileSearch,
    label: "Review code",
    prompt: "Can you review this code for improvements?",
  },
  {
    icon: Bookmark,
    label: "Find resource",
    prompt: "What are the best resources for learning ",
  },
];

export function AIChat({
  conversationId: initialConversationId,
  onNewMessage,
}: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(
    initialConversationId || null
  );
  const [includeContext, setIncludeContext] = useState(true);
  const [rateLimit, setRateLimit] = useState({ remaining: 25, resetTime: "" });
  const [error, setError] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation messages when conversationId changes
  useEffect(() => {
    if (initialConversationId) {
      loadConversation(initialConversationId);
    } else {
      setMessages([]);
      setConversationId(null);
    }
  }, [initialConversationId]);

  const loadConversation = async (convId: string) => {
    try {
      const res = await fetch("/api/ai/conversations");
      if (res.ok) {
        const data = await res.json();
        const conv = data.conversations.find((c: any) => c.id === convId);

        if (conv && conv.messages && conv.messages.length > 0) {
          const loadedMessages = conv.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
            timestamp: new Date(msg.createdAt),
          }));
          setMessages(loadedMessages);
          setConversationId(convId);
        } else {
          setMessages([]);
        }
      }
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          conversationId,
          includeContext,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          setError(errorData.error);
          toast.error("⏳ Rate limit reached. Please try again later.");
        } else if (errorData.offTopic) {
          setError(errorData.error);
          toast.warning("🤔 Please ask programming-related questions.");
        } else {
          setError("Failed to get response. Please try again.");
          toast.error("Failed to get response. Please try again.");
        }
        setIsLoading(false);
        return;
      }

      // Extract rate limit headers
      const remaining = response.headers.get("X-RateLimit-Remaining");
      const resetTime = response.headers.get("X-RateLimit-Reset");
      const newConvId = response.headers.get("X-Conversation-Id");

      if (remaining)
        setRateLimit({
          remaining: parseInt(remaining),
          resetTime: resetTime || "",
        });
      if (newConvId && !conversationId) setConversationId(newConvId);

      // Stream the response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      if (reader) {
        const assistantMsgId = (Date.now() + 1).toString();
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMsgId,
            role: "assistant",
            content: "",
            timestamp: new Date(),
          },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          assistantMessage += chunk;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, content: assistantMessage } : m
            )
          );
        }
      }

      setIsLoading(false);
      onNewMessage?.(); // Notify parent to refresh conversation list
    } catch (err: any) {
      console.error("Chat error:", err);
      setError("Network error. Please check your connection.");
      toast.error("🚫 Network error. Please check your connection.");
      setIsLoading(false);
    }
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedCode(text);
    toast.success("✅ Code copied to clipboard!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleRegenerate = async () => {
    if (messages.length < 2) return;

    // Remove last assistant message and resend last user message
    const lastUserMsg = messages.filter((m) => m.role === "user").pop();
    if (!lastUserMsg) return;

    const newMessages = messages.filter(
      (m) => m.id !== messages[messages.length - 1].id
    );
    setMessages(newMessages);

    // Resend
    setInput(lastUserMsg.content);
    setTimeout(() => handleSend(), 100);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with context toggle */}
      <div className="border-b">
        <div className="max-w-4xl mx-auto w-full flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">AI Dev Assistant</h2>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={includeContext ? "default" : "outline"}>
              <button
                onClick={() => setIncludeContext(!includeContext)}
                className="text-xs"
              >
                {includeContext ? "Context: ON" : "Context: OFF"}
              </button>
            </Badge>
            <div className="text-xs text-muted-foreground">
              {rateLimit.remaining} requests left
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto w-full p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <Sparkles className="w-16 h-16 text-blue-600/20" />
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  How can I help with your code today?
                </h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  I'm specialized for development work - ask about code,
                  debugging, architecture, or your workspace.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
                {QUICK_ACTIONS.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="flex items-center gap-2 h-auto py-3"
                    onClick={() => handleQuickAction(action.prompt)}
                  >
                    <action.icon className="w-4 h-4" />
                    <span className="text-sm">{action.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={
                  message.role === "user"
                    ? "max-w-[85%] rounded-xl bg-primary text-primary-foreground p-4 shadow"
                    : "max-w-[85%] rounded-xl bg-muted p-4 border shadow-sm prose prose-sm dark:prose-invert"
                }
              >
                {message.role === "assistant" ? (
                  <>
                    <ReactMarkdown
                      components={{
                        code(props) {
                          const { children, className } = props;
                          const match = /language-(\w+)/.exec(className || "");
                          const codeString = String(children).replace(
                            /\n$/,
                            ""
                          );
                          return match ? (
                            <div className="relative group">
                              <button
                                onClick={() => copyToClipboard(codeString)}
                                className="absolute right-2 top-2 p-1.5 rounded bg-gray-700 hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Copy code"
                              >
                                {copiedCode === codeString ? (
                                  <Check className="w-3.5 h-3.5 text-green-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-gray-300" />
                                )}
                              </button>
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={match[1]}
                                PreTag="div"
                              >
                                {codeString}
                              </SyntaxHighlighter>
                            </div>
                          ) : (
                            <code className={className}>{children}</code>
                          );
                        },
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>

                    {/* Regenerate button for last assistant message */}
                    {index === messages.length - 1 && !isLoading && (
                      <div className="mt-3 pt-3 border-t flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleRegenerate}
                          className="text-xs"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Regenerate
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(message.content)}
                          className="text-xs"
                        >
                          {copiedCode === message.content ? (
                            <Check className="w-3 h-3 mr-1" />
                          ) : (
                            <Copy className="w-3 h-3 mr-1" />
                          )}
                          Copy
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-xl bg-muted p-3 border flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Thinking...
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex justify-center">
              <div className="max-w-2xl w-full rounded-lg border border-red-300 bg-red-50 dark:bg-red-950 p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about code, debugging, or your workspace... (Shift+Enter for new line)"
            className="min-h-15 max-h-50"
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-15 w-15"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {includeContext && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Workspace context enabled - I can see your tasks, notes, snippets,
              and bookmarks
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
