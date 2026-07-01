// src/hooks/useSocketToast.js
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux"; 
import { io } from "socket.io-client";
import { useToast } from "../context/ToastContext";
import useUnreadCount from "./useUnreadCount";
import { selectAuthToken } from "../store/selectors";
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
    if (!token) return; //  no token = no socket (onboarding, login pages)

    if (window.__leapSocket?.connected) return; //  globally shared

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
      console.warn("⚠️ Socket error:", err.message);
    });
    socket.on("reconnect", () => {
      window.__leapSocket = socket;
    });

    socket.on("new_connect_request", ({ title, message, type }) => {
      showToastRef.current({ type: type || "info", title, message });
      incrementBadgeRef.current();
    });

    socket.on("request_accepted", ({ title, message, type }) => {
      showToastRef.current({ type: type || "success", title, message });
      incrementBadgeRef.current();
    });

    socket.on("request_declined", ({ title, message, type }) => {
      showToastRef.current({ type: type || "warning", title, message });
      incrementBadgeRef.current();
    });

    socket.on("request_referred", ({ title, message, type }) => {
      showToastRef.current({ type: type || "info", title, message });
      incrementBadgeRef.current();
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