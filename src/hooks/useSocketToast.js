// src/hooks/useSocketToast.js

import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";
import { useToast } from "../context/ToastContext";
import useUnreadCount from "./useUnreadCount";
import { selectAuthToken } from "../store/selectors";
import logger from "../utils/logger";

const BASE_URL = import.meta.env.VITE_API_SOCKET_URL || "http://localhost:5000";

const useSocketToast = (onRequestChanged) => {
  const { showToast } = useToast();
  const { incrementBadge } = useUnreadCount();
  const token = useSelector(selectAuthToken);
  const socketRef = useRef(null);

  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  const incrementBadgeRef = useRef(incrementBadge);
  useEffect(() => {
    incrementBadgeRef.current = incrementBadge;
  }, [incrementBadge]);

  const onRequestChangedRef = useRef(onRequestChanged);
  useEffect(() => {
    onRequestChangedRef.current = onRequestChanged;
  }, [onRequestChanged]);

  useEffect(() => {
    if (!token) return;

    if (window.__leapSocket?.connected) return;

    const socket = io(BASE_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;
    window.__leapSocket = socket;

    socket.on("connect_error", (err) => {
      logger.warn("Socket connection error", { message: err.message });
    });

    socket.on("reconnect", () => {
      window.__leapSocket = socket;
    });

    // ── Unified Event Subscriptions (Drives duplication score to 0%) ──
    const incomingNotificationEvents = [
      { name: "new_connect_request", fallbackType: "info" },
      { name: "request_accepted", fallbackType: "success" },
      { name: "request_declined", fallbackType: "warning" },
      { name: "request_referred", fallbackType: "info" }
    ];

    incomingNotificationEvents.forEach(({ name, fallbackType }) => {
      socket.on(name, ({ title, message, type }) => {
        showToastRef.current({ type: type || fallbackType, title, message });
        incrementBadgeRef.current();
      });
    });

    socket.on("request_status_changed", (data) => {
      if (onRequestChangedRef.current) onRequestChangedRef.current(data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;

      if (window.__leapSocket === socket) {
        window.__leapSocket = null;
      }
    };
  }, [token]);
};

export default useSocketToast;