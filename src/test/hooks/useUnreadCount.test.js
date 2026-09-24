// src/test/hooks/useUnreadCount.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import * as notificationsApi from "../../features/notifications/model/notifications.api";
import useUnreadCount from "../../features/shared-dashboard/presenter/useUnreadCount";

vi.mock("../../features/notifications/model/notifications.api");

describe("useUnreadCount", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("fetches on mount and sets unread count from unread notifications", async () => {
        notificationsApi.getNotifications.mockResolvedValue({
            notifications: [{ read: false }, { read: true }, { read: false }],
        });

        const { result } = renderHook(() => useUnreadCount());

        await waitFor(() => expect(result.current.unreadCount).toBe(2));
    });

    it("treats a missing notifications array as empty (defaults to 0)", async () => {
        notificationsApi.getNotifications.mockResolvedValue({});

        const { result } = renderHook(() => useUnreadCount());

        await waitFor(() => {
            expect(notificationsApi.getNotifications).toHaveBeenCalled();
        });
        expect(result.current.unreadCount).toBe(0);
    });

    it("silently swallows errors from the fetch", async () => {
        notificationsApi.getNotifications.mockRejectedValue(new Error("network fail"));

        const { result } = renderHook(() => useUnreadCount());

        await waitFor(() => {
            expect(notificationsApi.getNotifications).toHaveBeenCalled();
        });
        expect(result.current.unreadCount).toBe(0);
    });

    it("incrementBadge increases the count by 1", async () => {
        notificationsApi.getNotifications.mockResolvedValue({ notifications: [] });

        const { result } = renderHook(() => useUnreadCount());
        await waitFor(() => expect(result.current.unreadCount).toBe(0));

        act(() => {
            result.current.incrementBadge();
        });

        expect(result.current.unreadCount).toBe(1);
    });

    it("clearBadge resets the count to 0", async () => {
        notificationsApi.getNotifications.mockResolvedValue({
            notifications: [{ read: false }, { read: false }],
        });

        const { result } = renderHook(() => useUnreadCount());
        await waitFor(() => expect(result.current.unreadCount).toBe(2));

        act(() => {
            result.current.clearBadge();
        });

        expect(result.current.unreadCount).toBe(0);
    });

    it("refetch re-invokes getNotifications and updates the count", async () => {
        notificationsApi.getNotifications
            .mockResolvedValueOnce({ notifications: [] })
            .mockResolvedValueOnce({ notifications: [{ read: false }] });

        const { result } = renderHook(() => useUnreadCount());
        await waitFor(() => expect(result.current.unreadCount).toBe(0));

        await act(async () => {
            await result.current.refetch();
        });

        expect(result.current.unreadCount).toBe(1);
        expect(notificationsApi.getNotifications).toHaveBeenCalledTimes(2);
    });
});