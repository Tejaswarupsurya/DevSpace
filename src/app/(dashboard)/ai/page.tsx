"use client";

import { AIChat } from "@/components/ai/ai-chat";
import { Button } from "@/components/ui/button";
import {
  Plus,
  MessageSquare,
  PanelLeftClose,
  PanelLeft,
  Trash2,
} from "lucide-react";
import { useState, useEffect } from "react";

interface Conversation {
  id: string;
  title: string;
  messageCount: number;
  lastMessage?: string;
  updatedAt: string;
}

export default function AIAssistantPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/ai/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    }
  };

  const handleNewChat = () => {
    setSelectedConversation(null);
    fetchConversations(); // Refresh list
  };

  const handleDeleteConversation = async (
    conversationId: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // Prevent selecting the conversation

    try {
      const res = await fetch(`/api/ai/conversations?id=${conversationId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // If deleted conversation was selected, clear selection
        if (selectedConversation === conversationId) {
          setSelectedConversation(null);
        }
        // Refresh conversation list
        fetchConversations();
      }
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      <div className="p-3 sm:p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSidebar(!showSidebar)}
            className="lg:hidden"
          >
            {showSidebar ? (
              <PanelLeftClose className="w-5 h-5" />
            ) : (
              <PanelLeft className="w-5 h-5" />
            )}
          </Button>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold">AI Dev Assistant</h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
              Your specialized coding helper
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Sidebar - Hidden on mobile by default */}
        {showSidebar && (
          <div className="absolute lg:relative z-40 lg:z-0 w-64 h-full border-r bg-background lg:bg-muted/30 flex flex-col shadow-lg lg:shadow-none">
            <div className="p-3 border-b space-y-3">
              <div>
                <h2 className="text-sm font-semibold mb-1">Chat History</h2>
                <p className="text-xs text-muted-foreground">
                  Your recent conversations
                </p>
              </div>
              <Button
                onClick={handleNewChat}
                variant="outline"
                className="w-full"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              <div className="space-y-1">
                {conversations.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground p-4">
                    No conversations yet
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className={`group relative rounded-lg transition-colors ${
                        selectedConversation === conv.id ? "bg-muted" : ""
                      }`}
                    >
                      <button
                        onClick={() => setSelectedConversation(conv.id)}
                        className="w-full text-left p-2.5 hover:bg-muted rounded-lg transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0 pr-6">
                            <p className="text-xs font-medium truncate">
                              {conv.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {conv.lastMessage || "No messages"}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {conv.messageCount} msgs
                            </p>
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        className="absolute right-2 top-2 p-1 rounded hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 overflow-hidden">
          <AIChat
            conversationId={selectedConversation || undefined}
            key={selectedConversation || "new"}
            onNewMessage={fetchConversations}
          />
        </div>
      </div>
    </div>
  );
}
