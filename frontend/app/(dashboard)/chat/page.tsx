"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, Plus, Send, Loader2, Bot, User } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={cn("flex gap-3 max-w-[85%]", isUser ? "ml-auto flex-row-reverse" : "")}>
      <div
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
          isUser ? "bg-primary-600" : "bg-gray-200"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-gray-600" />
        )}
      </div>
      <div
        className={cn(
          "rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary-600 text-white rounded-tr-sm"
            : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm"
        )}
      >
        {/* Render markdown-style bold and newlines */}
        {msg.content.split("\n").map((line, i) => {
          const parts = line.split(/(\*\*[^*]+\*\*)/g);
          return (
            <p key={i} className={i > 0 ? "mt-1.5" : ""}>
              {parts.map((part, j) =>
                part.startsWith("**") && part.endsWith("**") ? (
                  <strong key={j}>{part.slice(2, -2)}</strong>
                ) : (
                  <span key={j}>{part}</span>
                )
              )}
            </p>
          );
        })}
      </div>
    </div>
  );
}

// ── Chat input ────────────────────────────────────────────────────────────────

function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [text, setText] = useState("");

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-2 p-4 border-t border-gray-100 bg-white">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Ask about diabetes, heart disease, liver or kidney health…"
        rows={2}
        disabled={disabled}
        className="flex-1 resize-none rounded-xl border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className="btn-primary px-3 self-end rounded-xl disabled:opacity-40"
        title="Send (Enter)"
      >
        {disabled ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

// ── Session list item ─────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const {
    sessions,
    activeSession,
    messages,
    sending,
    loadingMessages,
    loadSessions,
    selectSession,
    createSession,
    sendMessage,
  } = useChat();

  const [initialising, setInitialising] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load sessions on mount; auto-select most recent
  useEffect(() => {
    loadSessions()
      .then((data) => {
        if (data.length > 0) selectSession(data[0]);
      })
      .finally(() => setInitialising(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const handleNewChat = async () => {
    await createSession();
  };

  if (initialising) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Session sidebar */}
      <div className="w-64 border-r border-gray-100 bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-100">
          <button
            onClick={handleNewChat}
            className="btn-primary w-full flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {sessions.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8 px-4">
              No conversations yet. Start one above.
            </p>
          ) : (
            sessions.map((session) => {
              const active = activeSession?.id === session.id;
              return (
                <button
                  key={session.id}
                  onClick={() => selectSession(session)}
                  className={cn(
                    "w-full text-left px-4 py-3 text-sm transition-colors border-l-2",
                    active
                      ? "bg-primary-50 border-primary-500 text-primary-700 font-medium"
                      : "border-transparent text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Session #{session.id}</span>
                  </div>
                  <p className="text-xs text-gray-400 pl-5">{formatDate(session.created_at)}</p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary-600" />
            <h1 className="font-semibold text-gray-900">AI Health Assistant</h1>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Specialised in diabetes, heart, liver and kidney disease · For informational use only
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          {!activeSession ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Bot className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">Start a new conversation</p>
              <p className="text-sm text-gray-400 mt-1">
                Ask me about symptoms, risk factors, medications, or lifestyle advice for chronic diseases.
              </p>
              <button onClick={handleNewChat} className="btn-primary mt-6 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Chat
              </button>
            </div>
          ) : loadingMessages ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-gray-500">Send your first message to get started</p>
              <div className="mt-4 flex flex-wrap gap-2 justify-center max-w-md">
                {[
                  "What are symptoms of Type 2 diabetes?",
                  "How can I lower my cholesterol?",
                  "What foods are safe for kidney disease?",
                  "What does high ALT mean for the liver?",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="text-xs bg-gray-100 hover:bg-primary-50 hover:text-primary-700 text-gray-600 px-3 py-1.5 rounded-full transition-colors border border-gray-200"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} msg={msg} />
              ))}
              {sending && (
                <div className="flex gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200 shrink-0">
                    <Bot className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1 items-center h-5">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        {activeSession && (
          <ChatInput onSend={sendMessage} disabled={sending} />
        )}
      </div>
    </div>
  );
}
