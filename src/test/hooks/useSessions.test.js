// src/test/hooks/useSessions.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useSessions from "../../features/shared-dashboard/presenter/useSessions";
import * as sessionsApi from "../../features/shared-dashboard/model/sessions.api";

vi.mock("../../features/shared-dashboard/model/sessions.api", () => ({
    getSlots: vi.fn(),
    setSlotMeetingLink: vi.fn(),
    markSlotComplete: vi.fn(),
    addSlot: vi.fn(),
    cancelSlot: vi.fn(),
    rescheduleSlot: vi.fn(),
}));

const CR_ID = "cr1";

const flush = async () => {
    await act(async () => {
        await Promise.resolve();
    });
};

describe("useSessions", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        Object.values(sessionsApi).forEach((fn) => fn.mockReset?.());
        sessionsApi.getSlots.mockResolvedValue({
            slots: [{ meetingLink: "" }],
            completedSlots: 0,
            totalSlots: 1,
            progress: 0,
        });
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it("does nothing and stays loading=true when connectRequestId is falsy", async () => {
        const { result } = renderHook(() => useSessions(null));
        await flush();

        expect(sessionsApi.getSlots).not.toHaveBeenCalled();
        expect(result.current.loading).toBe(true);
        expect(result.current.slots).toEqual([]);
    });

    it("fetches slots on mount and applies the update", async () => {
        sessionsApi.getSlots.mockResolvedValueOnce({
            slots: [{ meetingLink: "x" }],
            completedSlots: 1,
            totalSlots: 2,
            progress: 50,
            allComplete: false,
        });
        const { result } = renderHook(() => useSessions(CR_ID));
        await flush();

        expect(sessionsApi.getSlots).toHaveBeenCalledWith(CR_ID);
        expect(result.current.loading).toBe(false);
        expect(result.current.slots).toEqual([{ meetingLink: "x" }]);
        expect(result.current.completedSlots).toBe(1);
        expect(result.current.totalSlots).toBe(2);
        expect(result.current.progress).toBe(50);
        expect(result.current.allComplete).toBe(false);
    });

    it("sets an error message when the initial fetch fails", async () => {
        sessionsApi.getSlots.mockRejectedValueOnce({
            response: { data: { message: "Not found" } },
        });
        const { result } = renderHook(() => useSessions(CR_ID));
        await flush();

        expect(result.current.error).toBe("Not found");
        expect(result.current.loading).toBe(false);
    });

    it("falls back to the generic load-error message when the server gives none", async () => {
        sessionsApi.getSlots.mockRejectedValueOnce({});
        const { result } = renderHook(() => useSessions(CR_ID));
        await flush();

        expect(result.current.error).toBe("Failed to load sessions.");
    });

    it("polls getSlots silently every 10s without toggling loading", async () => {
        const { result } = renderHook(() => useSessions(CR_ID));
        await flush();
        expect(sessionsApi.getSlots).toHaveBeenCalledTimes(1);

        sessionsApi.getSlots.mockResolvedValueOnce({
            slots: [{ meetingLink: "polled" }],
        });
        await act(async () => {
            vi.advanceTimersByTime(10000);
            await Promise.resolve();
        });

        expect(sessionsApi.getSlots).toHaveBeenCalledTimes(2);
        expect(result.current.loading).toBe(false);
        expect(result.current.slots).toEqual([{ meetingLink: "polled" }]);
    });

    it("does not start the polling interval when connectRequestId is falsy", async () => {
        renderHook(() => useSessions(null));
        await flush();

        await act(async () => {
            vi.advanceTimersByTime(30000);
        });
        expect(sessionsApi.getSlots).not.toHaveBeenCalled();
    });

    it("clears the polling interval on unmount", async () => {
        const { unmount } = renderHook(() => useSessions(CR_ID));
        await flush();
        unmount();

        sessionsApi.getSlots.mockClear();
        await act(async () => {
            vi.advanceTimersByTime(20000);
        });
        expect(sessionsApi.getSlots).not.toHaveBeenCalled();
    });

    it("refetch() (exposed as fetchSlots) reloads with loading toggled", async () => {
        const { result } = renderHook(() => useSessions(CR_ID));
        await flush();

        sessionsApi.getSlots.mockResolvedValueOnce({ slots: [{ meetingLink: "refetched" }] });
        await act(async () => {
            await result.current.refetch();
        });

        expect(result.current.slots).toEqual([{ meetingLink: "refetched" }]);
    });

    it("setMeetingLink: returns { success: false } and makes no API call for a blank link", async () => {
        const { result } = renderHook(() => useSessions(CR_ID));
        await flush();

        let outcome;
        await act(async () => {
            outcome = await result.current.setMeetingLink(0, "   ");
        });

        expect(outcome).toEqual({ success: false });
        expect(sessionsApi.setSlotMeetingLink).not.toHaveBeenCalled();
    });

    it("setMeetingLink: saves the link, updates only the targeted slot, and toggles savingSlots", async () => {
        sessionsApi.getSlots.mockResolvedValueOnce({
            slots: [{ meetingLink: "" }, { meetingLink: "" }],
        });
        sessionsApi.setSlotMeetingLink.mockResolvedValueOnce({
            slot: { meetingLink: "https://meet.example/abc" },
        });
        const { result } = renderHook(() => useSessions(CR_ID));
        await flush();

        let outcome;
        await act(async () => {
            outcome = await result.current.setMeetingLink(0, "https://meet.example/abc");
        });

        expect(outcome).toEqual({ success: true });
        expect(sessionsApi.setSlotMeetingLink).toHaveBeenCalledWith(
            CR_ID,
            0,
            "https://meet.example/abc",
        );
        expect(result.current.slots[0].meetingLink).toBe("https://meet.example/abc");
        expect(result.current.slots[1].meetingLink).toBe(""); // untouched slot — covers the i !== slotIndex branch
        expect(result.current.savingSlots.has(0)).toBe(false);
    });

    it("markSlotComplete: does not touch slots when the response omits a slots key", async () => {
        sessionsApi.markSlotComplete.mockResolvedValueOnce({
            completedSlots: 1,
            totalSlots: 1,
            progress: 100,
            allComplete: true,
        });
        const { result } = renderHook(() => useSessions(CR_ID));
        await flush();
        const slotsBefore = result.current.slots;

        await act(async () => {
            await result.current.markSlotComplete(0);
        });

        expect(result.current.slots).toBe(slotsBefore); // unchanged reference — covers the falsy `data.slots` branch
        expect(result.current.allComplete).toBe(true);
    });

    it("setMeetingLink: sets error and returns failure message on rejection", async () => {
        sessionsApi.setSlotMeetingLink.mockRejectedValueOnce({
            response: { data: { message: "Invalid URL" } },
        });
        const { result } = renderHook(() => useSessions(CR_ID));
        await flush();

        let outcome;
        await act(async () => {
            outcome = await result.current.setMeetingLink(0, "not-a-url");
        });

        expect(outcome).toEqual({ success: false, message: "Invalid URL" });
        expect(result.current.error).toBe("Invalid URL");
    });

    it("setMeetingLink: falls back to the generic save-error message", async () => {
        sessionsApi.setSlotMeetingLink.mockRejectedValueOnce({});
        const { result } = renderHook(() => useSessions(CR_ID));
        await flush();

        await act(async () => {
            await result.current.setMeetingLink(0, "https://x.com");
        });

        expect(result.current.error).toBe("Failed to save meeting link.");
    });

    it("markSlotComplete: applies the returned update and sets allComplete", async () => {
        sessionsApi.markSlotComplete.mockResolvedValueOnce({
            slots: [{ meetingLink: "x", status: "completed" }],
            completedSlots: 1,
            totalSlots: 1,
            progress: 100,
            allComplete: true,
        });
        const { result } = renderHook(() => useSessions(CR_ID));
        await flush();

        let outcome;
        await act(async () => {
            outcome = await result.current.markSlotComplete(0);
        });

        expect(outcome.success).toBe(true);
        expect(result.current.allComplete).toBe(true);
        expect(result.current.progress).toBe(100);
    });

    it("markSlotComplete: sets error and returns failure on rejection", async () => {
        sessionsApi.markSlotComplete.mockRejectedValueOnce({
            response: { data: { message: "Already completed" } },
        });
        const { result } = renderHook(() => useSessions(CR_ID));
        await flush();

        let outcome;
        await act(async () => {
            outcome = await result.current.markSlotComplete(0);
        });

        expect(outcome).toEqual({ success: false, message: "Already completed" });
        expect(result.current.error).toBe("Already completed");
    });

    it("markSlotComplete: falls back to the generic complete-error message", async () => {
        sessionsApi.markSlotComplete.mockRejectedValueOnce({});
        const { result } = renderHook(() => useSessions(CR_ID));
        await flush();

        await act(async () => {
            await result.current.markSlotComplete(0);
        });

        expect(result.current.error).toBe("Failed to mark session complete.");
    });

    it("addSlot: on success applies the update and returns the new slotId", async () => {
        sessionsApi.addSlot.mockResolvedValueOnce({
            slots: [{ meetingLink: "" }, { meetingLink: "" }],
            totalSlots: 2,
            slotId: "slot-2",
        });
        const { result } = renderHook(() => useSessions(CR_ID));
        await flush();

        let outcome;
        await act(async () => {
            outcome = await result.current.addSlot({
                day: "Mon",
                date: "2026-07-13",
                startTime: "10:00",
                endTime: "11:00",
            });
        });

        expect(sessionsApi.addSlot).toHaveBeenCalledWith(CR_ID, {
            day: "Mon",
            date: "2026-07-13",
            startTime: "10:00",
            endTime: "11:00",
        });
        expect(outcome).toEqual({ success: true, slotId: "slot-2" });
        expect(result.current.totalSlots).toBe(2);
    });

    it("addSlot: defaults slotId to null when the server omits it", async () => {
        sessionsApi.addSlot.mockResolvedValueOnce({ slots: [] });
        const { result } = renderHook(() => useSessions(CR_ID));
        await flush();

        let outcome;
        await act(async () => {
            outcome = await result.current.addSlot({
                day: "Tue",
                date: "2026-07-14",
                startTime: "09:00",
                endTime: "10:00",
            });
        });

        expect(outcome).toEqual({ success: true, slotId: null });
    });

    it("addSlot: sets error and returns failure message on rejection", async () => {
        sessionsApi.addSlot.mockRejectedValueOnce({
            response: { data: { message: "Slot overlaps" } },
        });
        const { result } = renderHook(() => useSessions(CR_ID));
        await flush();

        let outcome;
        await act(async () => {
            outcome = await result.current.addSlot({
                day: "Wed",
                date: "2026-07-15",
                startTime: "10:00",
                endTime: "11:00",
            });
        });

        expect(outcome).toEqual({ success: false, message: "Slot overlaps" });
        expect(result.current.error).toBe("Slot overlaps");
    });

    it("addSlot: falls back to the generic add-error message", async () => {
        sessionsApi.addSlot.mockRejectedValueOnce({});
        const { result } = renderHook(() => useSessions(CR_ID));
        await flush();

        let outcome;
        await act(async () => {
            outcome = await result.current.addSlot({
                day: "Thu",
                date: "2026-07-16",
                startTime: "10:00",
                endTime: "11:00",
            });
        });

        expect(outcome.message).toBe("Failed to add session.");
    });

    it("cancelSlot: applies the update on success, defaulting reason to \"\"", async () => {
        sessionsApi.cancelSlot.mockResolvedValueOnce({
            slots: [{ meetingLink: "", status: "cancelled" }],
        });
        const { result } = renderHook(() => useSessions(CR_ID));
        await flush();

        let outcome;
        await act(async () => {
            outcome = await result.current.cancelSlot(0);
        });

        expect(sessionsApi.cancelSlot).toHaveBeenCalledWith(CR_ID, 0, "");
        expect(outcome.success).toBe(true);
    });

    it("cancelSlot: passes a custom reason through", async () => {
        sessionsApi.cancelSlot.mockResolvedValueOnce({ slots: [] });
        const { result } = renderHook(() => useSessions(CR_ID));
        await flush();

        await act(async () => {
            await result.current.cancelSlot(0, "Scheduling conflict");
        });

        expect(sessionsApi.cancelSlot).toHaveBeenCalledWith(CR_ID, 0, "Scheduling conflict");
    });

    it("cancelSlot: sets error and returns failure message on rejection", async () => {
        sessionsApi.cancelSlot.mockRejectedValueOnce({
            response: { data: { message: "Cannot cancel completed slot" } },
        });
        const { result } = renderHook(() => useSessions(CR_ID));
        await flush();

        let outcome;
        await act(async () => {
            outcome = await result.current.cancelSlot(0);
        });

        expect(outcome).toEqual({
            success: false,
            message: "Cannot cancel completed slot",
        });
        expect(result.current.error).toBe("Cannot cancel completed slot");
    });

    it("cancelSlot: falls back to the generic cancel-error message", async () => {
        sessionsApi.cancelSlot.mockRejectedValueOnce({});
        const { result } = renderHook(() => useSessions(CR_ID));
        await flush();

        let outcome;
        await act(async () => {
            outcome = await result.current.cancelSlot(0);
        });

        expect(outcome.message).toBe("Failed to cancel slot.");
    });

    it("rescheduleSlot: applies the update on success", async () => {
        sessionsApi.rescheduleSlot.mockResolvedValueOnce({
            slots: [{ meetingLink: "", date: "2026-07-20" }],
        });
        const { result } = renderHook(() => useSessions(CR_ID));
        await flush();

        let outcome;
        await act(async () => {
            outcome = await result.current.rescheduleSlot(0, {
                date: "2026-07-20",
                startTime: "10:00",
                endTime: "11:00",
            });
        });

        expect(sessionsApi.rescheduleSlot).toHaveBeenCalledWith(CR_ID, 0, {
            date: "2026-07-20",
            startTime: "10:00",
            endTime: "11:00",
        });
        expect(outcome.success).toBe(true);
    });

    it("rescheduleSlot: sets error and returns failure message on rejection", async () => {
        sessionsApi.rescheduleSlot.mockRejectedValueOnce({
            response: { data: { message: "Slot no longer available" } },
        });
        const { result } = renderHook(() => useSessions(CR_ID));
        await flush();

        let outcome;
        await act(async () => {
            outcome = await result.current.rescheduleSlot(0, {
                date: "2026-07-20",
                startTime: "10:00",
                endTime: "11:00",
            });
        });

        expect(outcome).toEqual({
            success: false,
            message: "Slot no longer available",
        });
    });

    it("rescheduleSlot: falls back to the generic reschedule-error message", async () => {
        sessionsApi.rescheduleSlot.mockRejectedValueOnce({});
        const { result } = renderHook(() => useSessions(CR_ID));
        await flush();

        let outcome;
        await act(async () => {
            outcome = await result.current.rescheduleSlot(0, {
                date: "2026-07-20",
                startTime: "10:00",
                endTime: "11:00",
            });
        });

        expect(outcome.message).toBe("Failed to reschedule slot.");
    });

    it("tracks concurrent saving state per-slot via the Set, including the -1 addSlot key", async () => {
        let resolveAdd;
        sessionsApi.addSlot.mockReturnValueOnce(
            new Promise((resolve) => {
                resolveAdd = resolve;
            }),
        );
        const { result } = renderHook(() => useSessions(CR_ID));
        await flush();

        let addPromise;
        act(() => {
            addPromise = result.current.addSlot({
                day: "Fri",
                date: "2026-07-17",
                startTime: "10:00",
                endTime: "11:00",
            });
        });

        expect(result.current.savingSlots.has(-1)).toBe(true);

        await act(async () => {
            resolveAdd({ slots: [] });
            await addPromise;
        });

        expect(result.current.savingSlots.has(-1)).toBe(false);
    });

    it("re-fetches when connectRequestId changes", async () => {
        const { rerender } = renderHook(({ id }) => useSessions(id), {
            initialProps: { id: CR_ID },
        });
        await flush();
        expect(sessionsApi.getSlots).toHaveBeenCalledWith(CR_ID);

        rerender({ id: "cr2" });
        await flush();
        expect(sessionsApi.getSlots).toHaveBeenCalledWith("cr2");
    });

    it("keeps the latest onAllComplete callback reference without re-triggering effects", async () => {
        const cb1 = vi.fn();
        const cb2 = vi.fn();
        const { rerender } = renderHook(({ cb }) => useSessions(CR_ID, cb), {
            initialProps: { cb: cb1 },
        });
        await flush();
        const callsAfterMount = sessionsApi.getSlots.mock.calls.length;

        rerender({ cb: cb2 });
        await flush();

        // Changing the callback prop must not re-trigger fetchSlots
        expect(sessionsApi.getSlots.mock.calls.length).toBe(callsAfterMount);
    });
});