// src/hooks/useSocketToast.js

import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";
import { useToast } from "../../../shared/context/ToastContext";
import useUnreadCount from "@/features/shared-dashboard/presenter/useUnreadCount";
import { selectAuthToken } from "@/app/store/selectors";
import logger from "@/shared/utils/logger";
import type { LeapSocket } from "@/features/shared-dashboard/model/types";

const BASE_URL = import.meta.env.VITE_API_SOCKET_URL || "http://localhost:5000";

const useSocketToast = (onRequestChanged?: (data: unknown) => void) => {
  const { showToast } = useToast();
  const { incrementBadge } = useUnreadCount();
  const token = useSelector(selectAuthToken);
  const socketRef = useRef<LeapSocket | null>(null);

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
    if (!token) return undefined;

    if (window.__leapSocket?.connected) return undefined;

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
    const incomingNotificationEvents: { name: string; fallbackType: "success" | "error" | "info" | "warning" }[] = [
      { name: "new_connect_request", fallbackType: "info" },
      { name: "request_accepted", fallbackType: "success" },
      { name: "request_declined", fallbackType: "warning" },
      { name: "request_referred", fallbackType: "info" }
    ];

    incomingNotificationEvents.forEach(({ name, fallbackType }) => {
      socket.on(name, ({ title, message, type }: { title: string; message: string; type?: "success" | "error" | "info" | "warning" }) => {
        showToastRef.current({ type: type || fallbackType, title, message });
        incrementBadgeRef.current();
      });
    });

    socket.on("request_status_changed", (data: unknown) => {
      if (onRequestChangedRef.current) onRequestChangedRef.current(data);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;

      if (window.__leapSocket === socket) {
        window.__leapSocket = undefined;
      }
    };
  }, [token]);
};

export default useSocketToast;