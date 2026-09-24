// src/api/notifications.api.ts
import axiosInstance from "@/shared/utils/axiosInstance";

export const getNotifications = async () => {
    const res = await axiosInstance.get("/notifications");
    return res.data;
};

export const markAllNotificationsRead = async (): Promise<void> => {
    await axiosInstance.patch("/notifications/mark-all-read", {});
};

export const clearAllNotifications = async (): Promise<void> => {
    await axiosInstance.delete("/notifications/clear-all");
};

export const markNotificationRead = async (id: string): Promise<void> => {
    await axiosInstance.patch(`/notifications/${id}/read`, {});
};

export const deleteNotification = async (id: string): Promise<void> => {
    await axiosInstance.delete(`/notifications/${id}`);
};

export const subscribeToPush = async (subscription: PushSubscription): Promise<void> => {
    await axiosInstance.post("/push/subscribe", { subscription });
};