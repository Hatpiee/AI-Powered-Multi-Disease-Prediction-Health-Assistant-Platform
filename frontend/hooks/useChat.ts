"use client";

import { useState, useCallback } from "react";
import { chatApi } from "@/lib/api";
import type { ChatSession, ChatMessage } from "@/types/chat";

export function useChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const loadSessions = useCallback(async () => {
    const data = await chatApi.getSessions();
    setSessions(data);
    return data;
  }, []);

  const selectSession = useCallback(async (session: ChatSession) => {
    setActiveSession(session);
    setLoadingMessages(true);
    try {
      const msgs = await chatApi.getMessages(session.id);
      setMessages(msgs);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  const createSession = useCallback(async () => {
    const session = await chatApi.createSession();
    setSessions((prev) => [session, ...prev]);
    setActiveSession(session);
    setMessages([]);
    return session;
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!activeSession || sending) return;

      const optimisticUser: ChatMessage = {
        id: Date.now(),
        role: "user",
        content,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticUser]);
      setSending(true);

      try {
        const assistantMsg = await chatApi.sendMessage(activeSession.id, content);
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
      } finally {
        setSending(false);
      }
    },
    [activeSession, sending]
  );

  return {
    sessions,
    activeSession,
    messages,
    sending,
    loadingMessages,
    loadSessions,
    selectSession,
    createSession,
    sendMessage,
  };
}
