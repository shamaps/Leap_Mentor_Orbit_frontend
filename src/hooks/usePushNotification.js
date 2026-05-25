import { useEffect } from "react";
import { useSelector } from "react-redux"; // ✅ ADDED
import axiosInstance from "../utils/axiosInstance";
import { useToast } from "../context/ToastContext";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
};

const usePushNotification = () => {
  const { showToast } = useToast();
  const token = useSelector((state) => state.auth.token); // ✅ FIXED: top level, not inside useEffect

  // Register service worker + subscribe to push
  useEffect(() => {
    if (!token) return; // ✅ guard still works, now reads from Redux
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const setup = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        await axiosInstance.post("/push/subscribe", { subscription });

        console.log("✅ Push notifications enabled");
      } catch (err) {
        console.warn("⚠️ Push setup failed:", err.message);
      }
    };

    setup();
  }, [token]); // ✅ re-run when token appears after login

  // Listen for messages from service worker → show in-app toast
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleMessage = (event) => {
      console.log("📩 Message from SW received:", event.data);
      if (event.data?.type === "SHOW_TOAST") {
        const { title, message, type } = event.data.payload;
        console.log("🍞 Calling showToast:", { title, message, type });
        showToast({ type: type || "info", title, message });
      }
    };
    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, [showToast]);
};

export default usePushNotification;