// src/api/notifications.api.js
import axiosInstance from "../utils/axiosInstance";

export const getNotifications = async () => {
    const res = await axiosInstance.get("/notifications");
    return res.data;
};

export const markAllNotificationsRead = async () => {
    await axiosInstance.patch("/notifications/mark-all-read", {});
};

export const clearAllNotifications = async () => {
    await axiosInstance.delete("/notifications/clear-all");
};

export const markNotificationRead = async (id) => {
    await axiosInstance.patch(`/notifications/${id}/read`, {});
};

export const deleteNotification = async (id) => {
    await axiosInstance.delete(`/notifications/${id}`);
};

export const subscribeToPush = async (subscription) => {
    await axiosInstance.post("/push/subscribe", { subscription });
};