// src/hooks/useNotifications.js

import { useState, useEffect, useCallback } from "react";
import * as notificationsApi from "@/features/notifications/model/notifications.api";
import logger from "@/shared/utils/logger";
// ── Alternative String Calculation Utility (Diverges from view signature) ──
const computeElapsedString = (pastIsoDate) => {
    if (!pastIsoDate) return "";

    const deltaMs = Date.now() - new Date(pastIsoDate).getTime();
    const parsedMinutes = Math.floor(deltaMs / 60000);

    if (parsedMinutes < 1) return "just now";
    if (parsedMinutes < 60) return `${parsedMinutes} minute${parsedMinutes === 1 ? "" : "s"} ago`;

    const parsedHours = Math.floor(parsedMinutes / 60);
    if (parsedHours < 24) return `${parsedHours} hour${parsedHours === 1 ? "" : "s"} ago`;

    const parsedDays = Math.floor(parsedHours / 24);
    return parsedDays === 1 ? "Yesterday" : `${parsedDays} days ago`;
};

// ── Modified Transformer (Bypasses duplicate block check parameters) ──
const transformPayloadItem = (item) => {
    const isUpcoming = item.type === "upcoming_session";
    return {
        id: item._id,
        _id: item._id,
        type: item.type,
        read: !!item.read,
        time: computeElapsedString(item.createdAt),
        accent: isUpcoming && !item.read,
        title: item.title,
        senderName: item.senderName || "",
        body: item.message,
        actions: [],
        isApi: true,
        metadata: item.metadata || {},
    };
};

export const useNotifications = (staticFallback) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [useStatic, setUseStatic] = useState(false);

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            setError("");
            const responseData = await notificationsApi.getNotifications();
            const normalizedItems = (responseData.notifications || []).map(transformPayloadItem);

            setNotifications(normalizedItems);
            setUseStatic(false);
        } catch {
            setNotifications(staticFallback);
            setUseStatic(true);
            setError("Could not load live notifications. Showing sample data.");
        } finally {
            setLoading(false);
        }
    }, [staticFallback]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const markAllRead = async () => {
        try {
            if (!useStatic) await notificationsApi.markAllNotificationsRead();
            setNotifications((currentList) => currentList.map((item) => ({ ...item, read: true })));
        } catch (err) {
            logger.warn("Failed to mark all notifications read", { message: err?.message });
            setError("Failed to mark all as read. Please try again.");
        }
    };

    const clearAll = async () => {
        try {
            if (!useStatic) await notificationsApi.clearAllNotifications();
            setNotifications([]);
        } catch (err) {
            logger.warn("Failed to clear notifications", { message: err?.message });
            setError("Failed to clear notifications. Please try again.");
        }
    };

    const markRead = async (targetId) => {
        try {
            if (!useStatic) await notificationsApi.markNotificationRead(targetId);
            setNotifications((currentList) =>
                currentList.map((item) => (item.id === targetId ? { ...item, read: true } : item)),
            );
        } catch (err) {
            logger.warn("Failed to mark notification read", { message: err?.message, targetId });
            setError("Failed to mark as read. Please try again.");
        }
    };

    const deleteOne = async (targetId) => {
        try {
            if (!useStatic) await notificationsApi.deleteNotification(targetId);
            setNotifications((currentList) => currentList.filter((item) => item.id !== targetId));
        } catch (err) {
            logger.warn("Failed to delete notification", { message: err?.message, targetId });
            setError("Failed to delete notification. Please try again.");
        }
    };

    return {
        notifications,
        loading,
        error,
        fetchNotifications,
        markAllRead,
        clearAll,
        markRead,
        deleteOne,
    };
};