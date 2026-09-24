// src/hooks/useChat.js
import { useState, useEffect, useRef, useCallback } from "react";
import type { Socket } from "socket.io-client";
import { getMessageHistory } from "@/features/shared-dashboard/model/chat.api";
import type { ChatMessage } from "@/features/shared-dashboard/model/types";

const TYPING_DEBOUNCE_MS = 2000;
const PAGE_LIMIT = 30;

const appendUniqueMessage = (prev: ChatMessage[], message: ChatMessage) => {
  if (prev.some((m) => m._id === message._id)) return prev;
  return [...prev, message];
};
const markAllRead = (prev: ChatMessage[], readAt: string) =>
  prev.map((m) => (m.readAt ? m : { ...m, readAt }));

const useChat = (connectRequestId?: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherOnline, setOtherOnline] = useState(false);
  const [page, setPage] = useState(1);

  const socketRef = useRef<Socket | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const connectRequestIdRef = useRef(connectRequestId);
  useEffect(() => {
    connectRequestIdRef.current = connectRequestId;
  }, [connectRequestId]);

  // ── Fetch message history (REST) ──────────────────────────
  const fetchHistory = useCallback(async (roomId: string, pageNum = 1) => {
    const res = await getMessageHistory(roomId, pageNum, PAGE_LIMIT);
    return res.data;
  }, []); //  stable — no dependencies

  // ── Initial history load ──────────────────────────────────
  useEffect(() => {
    if (!connectRequestId) return;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchHistory(connectRequestId, 1);
        if (cancelled) return;
        setMessages(data.messages);
        setHasMore(data.hasMore);
        setPage(1);
      } catch (err) {
        if (!cancelled) {
          const message =
            (err as { response?: { data?: { message?: string } } })?.response
              ?.data?.message || "Failed to load messages";
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [connectRequestId, fetchHistory]);

  // ── Socket setup ──────────────────────────────────────────
  // In useChat.js — REPLACE the socket setup useEffect with this:
  useEffect(() => {
    if (!connectRequestId) return;

    const joinRoom = () => {
      globalThis.__leapSocket?.emit("join_room", { connectRequestId });
    };

    const handleNewMessage = (message: ChatMessage) => {
      setMessages((prev) => appendUniqueMessage(prev, message));
    };
    const handleTypingStart = () => setIsTyping(true);
    const handleTypingStop = () => setIsTyping(false);
    const handleUserOnline = () => setOtherOnline(true);
    const handleUserOffline = () => setOtherOnline(false);
    const handleMessagesRead = ({ readAt }: { readAt: string }) => {
      setMessages((prev) => markAllRead(prev, readAt));
    };
    const handleError = ({ message }: { message: string }) => setError(message);

    const waitForSocket = setInterval(() => {
      if (globalThis.__leapSocket?.connected) {
        clearInterval(waitForSocket);
        socketRef.current = globalThis.__leapSocket;
        joinRoom();

        globalThis.__leapSocket.on("new_message", handleNewMessage);
        globalThis.__leapSocket.on("typing_start", handleTypingStart);
        globalThis.__leapSocket.on("typing_stop", handleTypingStop);
        globalThis.__leapSocket.on("user_online", handleUserOnline);
        globalThis.__leapSocket.on("user_offline", handleUserOffline);
        globalThis.__leapSocket.on("messages_read", handleMessagesRead);
        globalThis.__leapSocket.on("error", handleError);
      }
    }, 200);

    return () => {
      clearInterval(waitForSocket);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      globalThis.__leapSocket?.off("new_message", handleNewMessage);
      globalThis.__leapSocket?.off("typing_start", handleTypingStart);
      globalThis.__leapSocket?.off("typing_stop", handleTypingStop);
      globalThis.__leapSocket?.off("user_online", handleUserOnline);
      globalThis.__leapSocket?.off("user_offline", handleUserOffline);
      globalThis.__leapSocket?.off("messages_read", handleMessagesRead);
      globalThis.__leapSocket?.off("error", handleError);
      socketRef.current = null;
    };
  }, [connectRequestId]);

  // ── Load more (older messages) ────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    const roomId = connectRequestIdRef.current;
    if (!roomId) return;
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const data = await fetchHistory(roomId, nextPage);
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMore(data.hasMore);
      setPage(nextPage);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to load older messages";
      setError(message);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, fetchHistory]);

  // ── Send message ──────────────────────────────────────────
  const sendMessage = useCallback((content: string) => {
    if (!content?.trim() || !socketRef.current) return;
    socketRef.current.emit("send_message", {
      connectRequestId: connectRequestIdRef.current,
      content: content.trim(),
    });
    if (isTypingRef.current) {
      socketRef.current.emit("typing_stop", {
        connectRequestId: connectRequestIdRef.current,
      });
      isTypingRef.current = false;
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    }
  }, []);

  // ── Typing indicator ──────────────────────────────────────
  const handleTyping = useCallback(() => {
    if (!socketRef.current) return;
    const roomId = connectRequestIdRef.current;

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socketRef.current.emit("typing_start", { connectRequestId: roomId });
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        isTypingRef.current = false;
        socketRef.current?.emit("typing_stop", { connectRequestId: roomId });
      }
    }, TYPING_DEBOUNCE_MS);
  }, []);

  // ── Mark messages as read ─────────────────────────────────
  const markRead = useCallback(() => {
    if (!socketRef.current) return;
    socketRef.current.emit("mark_read", {
      connectRequestId: connectRequestIdRef.current,
    });
  }, []);

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    error,
    isTyping,
    otherOnline,
    sendMessage,
    loadMore,
    handleTyping,
    markRead,
  };
};

export default useChat;