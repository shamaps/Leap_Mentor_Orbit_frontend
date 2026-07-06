// src/hooks/useUnreadCount.js
import { useState, useEffect, useCallback } from "react";
import * as notificationsApi from "../api/notifications.api";
const useUnreadCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await notificationsApi.getNotifications();
      const count = (data.notifications || []).filter(
        (n) => !n.read,
      ).length;
      setUnreadCount(count);
    } catch {
      // silently fail
    }
  }, []);

  //fetch once on mount only
  useEffect(() => {
    const load = async () => {
      await fetchUnreadCount();
    };
    load();
  }, [fetchUnreadCount]);

  //increment badge when socket/push notification arrives
  const incrementBadge = useCallback(() => {
    setUnreadCount((prev) => prev + 1);
  }, []);

  const clearBadge = useCallback(() => setUnreadCount(0), []);

  return { unreadCount, clearBadge, refetch: fetchUnreadCount, incrementBadge };
};

export default useUnreadCount;
