// src/hooks/useChat.js
import { useState, useEffect, useRef, useCallback } from "react";
import axiosInstance from "../utils/axiosInstance";

//const SOCKET_URL = import.meta.env.VITE_SOCKET_URL   || "http://localhost:5000";
const TYPING_DEBOUNCE_MS = 2000;
const PAGE_LIMIT = 30;

const useChat = (connectRequestId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherOnline, setOtherOnline] = useState(false);
  const [page, setPage] = useState(1);

  const socketRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  const connectRequestIdRef = useRef(connectRequestId);
  useEffect(() => {
    connectRequestIdRef.current = connectRequestId;
  }, [connectRequestId]);

  // ── Fetch message history (REST) ──────────────────────────
  const fetchHistory = useCallback(async (roomId, pageNum = 1) => {
    const res = await axiosInstance.get(`/messages/${roomId}`, {
      params: { page: pageNum, limit: PAGE_LIMIT },
    });
    return res.data;
  }, []); // ✅ stable — no dependencies

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
        if (!cancelled)
          setError(err?.response?.data?.message || "Failed to load messages");
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
      window.__leapSocket?.emit("join_room", { connectRequestId });
    };

    const handleNewMessage = (message) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        return [...prev, message];
      });
    };

    const handleTypingStart = () => setIsTyping(true);
    const handleTypingStop = () => setIsTyping(false);
    const handleUserOnline = () => setOtherOnline(true);
    const handleUserOffline = () => setOtherOnline(false);
    const handleMessagesRead = ({ readAt }) => {
      setMessages((prev) => prev.map((m) => (m.readAt ? m : { ...m, readAt })));
    };
    const handleError = ({ message }) => setError(message);

    const waitForSocket = setInterval(() => {
      if (window.__leapSocket?.connected) {
        clearInterval(waitForSocket);
        socketRef.current = window.__leapSocket;
        joinRoom();

        window.__leapSocket.on("new_message", handleNewMessage);
        window.__leapSocket.on("typing_start", handleTypingStart);
        window.__leapSocket.on("typing_stop", handleTypingStop);
        window.__leapSocket.on("user_online", handleUserOnline);
        window.__leapSocket.on("user_offline", handleUserOffline);
        window.__leapSocket.on("messages_read", handleMessagesRead);
        window.__leapSocket.on("error", handleError);
      }
    }, 200);

    return () => {
      clearInterval(waitForSocket);
      clearTimeout(typingTimerRef.current);
      window.__leapSocket?.off("new_message", handleNewMessage);
      window.__leapSocket?.off("typing_start", handleTypingStart);
      window.__leapSocket?.off("typing_stop", handleTypingStop);
      window.__leapSocket?.off("user_online", handleUserOnline);
      window.__leapSocket?.off("user_offline", handleUserOffline);
      window.__leapSocket?.off("messages_read", handleMessagesRead);
      window.__leapSocket?.off("error", handleError);
      socketRef.current = null;
    };
  }, [connectRequestId]);

  // ✅ Remove these:
  // import { io } from "socket.io-client"  ← remove
  // import SOCKET_URL  ← remove
  // The socket.on("connect") joinRoom call is now handled above

  // ── Load more (older messages) ────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    const roomId = connectRequestIdRef.current;
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const data = await fetchHistory(roomId, nextPage);
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMore(data.hasMore);
      setPage(nextPage);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load older messages");
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, page, fetchHistory]);

  // ── Send message ──────────────────────────────────────────
  const sendMessage = useCallback((content) => {
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
      clearTimeout(typingTimerRef.current);
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

    clearTimeout(typingTimerRef.current);
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