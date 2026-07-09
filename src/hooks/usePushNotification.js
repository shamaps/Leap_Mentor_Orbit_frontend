import { useEffect } from "react";
import { useSelector } from "react-redux";
import * as notificationsApi from "../api/notifications.api"; import { useToast } from "../context/ToastContext";
import { selectAuthToken } from "../store/selectors";
import logger from "../utils/logger";
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

const urlBase64ToUint8Array = (base64String) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replaceAll("-", "+").replaceAll("-", "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.codePointAt(0)));
};

const usePushNotification = () => {
  const { showToast } = useToast();
  const token = useSelector(selectAuthToken);

  // Register service worker + subscribe to push
  useEffect(() => {
    if (!token) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in globalThis)) return;

    const setup = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        await notificationsApi.subscribeToPush(subscription);

        logger.info("Push notifications enabled");
      } catch (err) {
        logger.warn("Push setup failed", { message: err.message });
      }
    };

    setup();
  }, [token]);

  // Listen for messages from service worker → show in-app toast
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleMessage = (event) => {
      logger.debug("Message from service worker received", { data: event.data });
      if (event.data?.type === "SHOW_TOAST") {
        const { title, message, type } = event.data.payload;
        logger.debug("Calling showToast", { title, message, type });
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
