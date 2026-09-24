// src/test/hooks/useNotifications.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import * as notificationsApi from "../../features/notifications/model/notifications.api";
import logger from "../../shared/utils/logger";
import { useNotifications } from "../../features/notifications/presenter/useNotifications";

vi.mock("../../features/notifications/model/notifications.api");
vi.mock("../../shared/utils/logger", () => ({
    default: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

const staticFallback = [{ id: "static-1", title: "Static Notification" }];

describe("useNotifications", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("fetches and normalizes notifications on mount", async () => {
        notificationsApi.getNotifications.mockResolvedValue({
            notifications: [
                {
                    _id: "1",
                    type: "upcoming_session",
                    read: false,
                    createdAt: new Date().toISOString(),
                    title: "Session soon",
                    senderName: "Mentor A",
                    message: "Your session starts soon",
                    metadata: { sessionId: "s1" },
                },
            ],
        });

        const { result } = renderHook(() => useNotifications(staticFallback));

        expect(result.current.loading).toBe(true);

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.notifications).toHaveLength(1);
        expect(result.current.notifications[0]).toMatchObject({
            id: "1",
            _id: "1",
            type: "upcoming_session",
            read: false,
            accent: true,
            title: "Session soon",
            senderName: "Mentor A",
            body: "Your session starts soon",
            isApi: true,
            metadata: { sessionId: "s1" },
        });
        expect(result.current.error).toBe("");
    });

    it("defaults missing notifications array to empty list", async () => {
        notificationsApi.getNotifications.mockResolvedValue({});

        const { result } = renderHook(() => useNotifications(staticFallback));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.notifications).toEqual([]);
    });

    it("falls back to static data and sets error message on fetch failure", async () => {
        notificationsApi.getNotifications.mockRejectedValue(new Error("network fail"));

        const { result } = renderHook(() => useNotifications(staticFallback));

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.notifications).toEqual(staticFallback);
        expect(result.current.error).toBe("Could not load live notifications. Showing sample data.");
    });

    it("computes 'just now' for very recent timestamps", async () => {
        notificationsApi.getNotifications.mockResolvedValue({
            notifications: [
                {
                    _id: "2",
                    type: "message",
                    read: true,
                    createdAt: new Date().toISOString(),
                    title: "New message",
                    message: "Hi there",
                },
            ],
        });

        const { result } = renderHook(() => useNotifications(staticFallback));

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.notifications[0].time).toBe("just now");
        expect(result.current.notifications[0].accent).toBe(false);
    });

    it("computes minutes/hours/days ago strings correctly", async () => {
        const minutesAgo = new Date(Date.now() - 5 * 60000).toISOString();
        const hoursAgo = new Date(Date.now() - 3 * 3600000).toISOString();
        const daysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
        const oneDayAgo = new Date(Date.now() - 1 * 86400000).toISOString();

        notificationsApi.getNotifications.mockResolvedValue({
            notifications: [
                { _id: "a", type: "x", createdAt: minutesAgo, title: "t", message: "m" },
                { _id: "b", type: "x", createdAt: hoursAgo, title: "t", message: "m" },
                { _id: "c", type: "x", createdAt: daysAgo, title: "t", message: "m" },
                { _id: "d", type: "x", createdAt: oneDayAgo, title: "t", message: "m" },
            ],
        });

        const { result } = renderHook(() => useNotifications(staticFallback));
        await waitFor(() => expect(result.current.loading).toBe(false));

        const [a, b, c, d] = result.current.notifications;
        expect(a.time).toBe("5 minutes ago");
        expect(b.time).toBe("3 hours ago");
        expect(c.time).toBe("2 days ago");
        expect(d.time).toBe("Yesterday");
    });

    it("returns empty time string when createdAt is missing", async () => {
        notificationsApi.getNotifications.mockResolvedValue({
            notifications: [{ _id: "e", type: "x", title: "t", message: "m" }],
        });

        const { result } = renderHook(() => useNotifications(staticFallback));
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.notifications[0].time).toBe("");
    });

    it("markAllRead calls API and marks all notifications read when live data", async () => {
        notificationsApi.getNotifications.mockResolvedValue({
            notifications: [
                { _id: "1", type: "x", read: false, title: "t", message: "m" },
                { _id: "2", type: "x", read: false, title: "t", message: "m" },
            ],
        });
        notificationsApi.markAllNotificationsRead.mockResolvedValue();

        const { result } = renderHook(() => useNotifications(staticFallback));
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.markAllRead();
        });

        expect(notificationsApi.markAllNotificationsRead).toHaveBeenCalled();
        expect(result.current.notifications.every((n) => n.read)).toBe(true);
    });

    it("markAllRead skips API call when using static fallback data", async () => {
        notificationsApi.getNotifications.mockRejectedValue(new Error("fail"));

        const { result } = renderHook(() => useNotifications(staticFallback));
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.markAllRead();
        });

        expect(notificationsApi.markAllNotificationsRead).not.toHaveBeenCalled();
    });

    it("markAllRead sets error and logs warning on API failure", async () => {
        notificationsApi.getNotifications.mockResolvedValue({ notifications: [] });
        notificationsApi.markAllNotificationsRead.mockRejectedValue(new Error("boom"));

        const { result } = renderHook(() => useNotifications(staticFallback));
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.markAllRead();
        });

        expect(result.current.error).toBe("Failed to mark all as read. Please try again.");
        expect(logger.error).toHaveBeenCalledWith(
            "Failed to mark all notifications read",
            expect.objectContaining({ message: "boom" }),
        );
    });

    it("clearAll calls API and empties notifications list", async () => {
        notificationsApi.getNotifications.mockResolvedValue({
            notifications: [{ _id: "1", type: "x", title: "t", message: "m" }],
        });
        notificationsApi.clearAllNotifications.mockResolvedValue();

        const { result } = renderHook(() => useNotifications(staticFallback));
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.clearAll();
        });

        expect(notificationsApi.clearAllNotifications).toHaveBeenCalled();
        expect(result.current.notifications).toEqual([]);
    });

    it("clearAll sets error and logs warning on API failure", async () => {
        notificationsApi.getNotifications.mockResolvedValue({ notifications: [] });
        notificationsApi.clearAllNotifications.mockRejectedValue(new Error("clear-fail"));

        const { result } = renderHook(() => useNotifications(staticFallback));
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.clearAll();
        });

        expect(result.current.error).toBe("Failed to clear notifications. Please try again.");
        expect(logger.error).toHaveBeenCalledWith(
            "Failed to clear notifications",
            expect.objectContaining({ message: "clear-fail" }),
        );
    });

    it("markRead marks only the targeted notification as read", async () => {
        notificationsApi.getNotifications.mockResolvedValue({
            notifications: [
                { _id: "1", type: "x", read: false, title: "t", message: "m" },
                { _id: "2", type: "x", read: false, title: "t", message: "m" },
            ],
        });
        notificationsApi.markNotificationRead.mockResolvedValue();

        const { result } = renderHook(() => useNotifications(staticFallback));
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.markRead("1");
        });

        expect(notificationsApi.markNotificationRead).toHaveBeenCalledWith("1");
        const [first, second] = result.current.notifications;
        expect(first.read).toBe(true);
        expect(second.read).toBe(false);
    });

    it("markRead sets error and logs warning on API failure", async () => {
        notificationsApi.getNotifications.mockResolvedValue({
            notifications: [{ _id: "1", type: "x", read: false, title: "t", message: "m" }],
        });
        notificationsApi.markNotificationRead.mockRejectedValue(new Error("mark-fail"));

        const { result } = renderHook(() => useNotifications(staticFallback));
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.markRead("1");
        });

        expect(result.current.error).toBe("Failed to mark as read. Please try again.");
        expect(logger.error).toHaveBeenCalledWith(
            "Failed to mark notification read",
            expect.objectContaining({ message: "mark-fail", targetId: "1" }),
        );
    });

    it("deleteOne removes the targeted notification from state", async () => {
        notificationsApi.getNotifications.mockResolvedValue({
            notifications: [
                { _id: "1", type: "x", title: "t", message: "m" },
                { _id: "2", type: "x", title: "t", message: "m" },
            ],
        });
        notificationsApi.deleteNotification.mockResolvedValue();

        const { result } = renderHook(() => useNotifications(staticFallback));
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.deleteOne("1");
        });

        expect(notificationsApi.deleteNotification).toHaveBeenCalledWith("1");
        expect(result.current.notifications).toHaveLength(1);
        expect(result.current.notifications[0].id).toBe("2");
    });

    it("deleteOne sets error and logs warning on API failure", async () => {
        notificationsApi.getNotifications.mockResolvedValue({
            notifications: [{ _id: "1", type: "x", title: "t", message: "m" }],
        });
        notificationsApi.deleteNotification.mockRejectedValue(new Error("delete-fail"));

        const { result } = renderHook(() => useNotifications(staticFallback));
        await waitFor(() => expect(result.current.loading).toBe(false));

        await act(async () => {
            await result.current.deleteOne("1");
        });

        expect(result.current.error).toBe("Failed to delete notification. Please try again.");
        expect(logger.error).toHaveBeenCalledWith(
            "Failed to delete notification",
            expect.objectContaining({ message: "delete-fail", targetId: "1" }),
        );
    });

    it("fetchNotifications can be called manually to refetch", async () => {
        notificationsApi.getNotifications
            .mockResolvedValueOnce({ notifications: [] })
            .mockResolvedValueOnce({ notifications: [{ _id: "1", type: "x", title: "t", message: "m" }] });

        const { result } = renderHook(() => useNotifications(staticFallback));
        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.notifications).toEqual([]);

        await act(async () => {
            await result.current.fetchNotifications();
        });

        expect(result.current.notifications).toHaveLength(1);
        expect(notificationsApi.getNotifications).toHaveBeenCalledTimes(2);
    });
});