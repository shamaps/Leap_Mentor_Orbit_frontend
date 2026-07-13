// src/test/hooks/useSlotLock.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import * as sessionsApi from "../../api/sessions.api";
import logger from "../../utils/logger";
import { useToast } from "../../context/ToastContext";
import useSlotLock from "../../hooks/useSlotLock";

vi.mock("../../api/sessions.api");
vi.mock("../../utils/logger");
vi.mock("../../context/ToastContext");

describe("useSlotLock", () => {
    let showToast;

    beforeEach(() => {
        vi.clearAllMocks();
        showToast = vi.fn();
        useToast.mockReturnValue({ showToast });
    });

    it("lockSlot returns ok:true with expiresAt on success", async () => {
        sessionsApi.lockSlot.mockResolvedValue({ expiresAt: "2026-07-11T10:30:00Z" });

        const { result } = renderHook(() => useSlotLock("mentor-1"));

        const res = await result.current.lockSlot("2026-07-11", "10:00", "10:30");

        expect(sessionsApi.lockSlot).toHaveBeenCalledWith({
            mentorId: "mentor-1",
            date: "2026-07-11",
            startTime: "10:00",
            endTime: "10:30",
        });
        expect(res).toEqual({ ok: true, expiresAt: "2026-07-11T10:30:00Z" });
    });

    it("lockSlot returns ok:false with code/msg from the API error", async () => {
        sessionsApi.lockSlot.mockRejectedValue({
            response: { data: { code: "SLOT_TAKEN", message: "Slot already locked" } },
        });

        const { result } = renderHook(() => useSlotLock("mentor-1"));

        const res = await result.current.lockSlot("2026-07-11", "10:00", "10:30");

        expect(res).toEqual({ ok: false, code: "SLOT_TAKEN", msg: "Slot already locked" });
    });

    it("lockSlot falls back to default message when the error has no response message", async () => {
        sessionsApi.lockSlot.mockRejectedValue({});

        const { result } = renderHook(() => useSlotLock("mentor-1"));

        const res = await result.current.lockSlot("2026-07-11", "10:00", "10:30");

        expect(res).toEqual({ ok: false, code: undefined, msg: "Could not lock slot" });
    });

    it("unlockSlot resolves silently on success", async () => {
        sessionsApi.unlockSlot.mockResolvedValue({});

        const { result } = renderHook(() => useSlotLock("mentor-1"));

        await result.current.unlockSlot("2026-07-11", "10:00", "10:30");

        expect(sessionsApi.unlockSlot).toHaveBeenCalledWith({
            mentorId: "mentor-1",
            date: "2026-07-11",
            startTime: "10:00",
            endTime: "10:30",
        });
        expect(showToast).not.toHaveBeenCalled();
    });

    it("unlockSlot logs a warning and shows an info toast on failure", async () => {
        sessionsApi.unlockSlot.mockRejectedValue(new Error("network fail"));

        const { result } = renderHook(() => useSlotLock("mentor-1"));

        await result.current.unlockSlot("2026-07-11", "10:00", "10:30");

        expect(logger.warn).toHaveBeenCalledWith("unlock failed", { message: "network fail" });
        expect(showToast).toHaveBeenCalledWith({
            type: "info",
            title: "Slot release delayed",
            message: "It'll free up automatically in a few minutes.",
        });
    });

    it("unlockAll resolves silently on success", async () => {
        sessionsApi.unlockAllSlots.mockResolvedValue({});

        const { result } = renderHook(() => useSlotLock("mentor-1"));

        await result.current.unlockAll();

        expect(sessionsApi.unlockAllSlots).toHaveBeenCalledWith("mentor-1");
        expect(logger.warn).not.toHaveBeenCalled();
    });

    it("unlockAll logs a warning on failure", async () => {
        sessionsApi.unlockAllSlots.mockRejectedValue(new Error("boom"));

        const { result } = renderHook(() => useSlotLock("mentor-1"));

        await result.current.unlockAll();

        expect(logger.warn).toHaveBeenCalledWith("unlock-all failed", { message: "boom" });
    });
});