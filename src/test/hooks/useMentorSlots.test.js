// src/test/hooks/useMentorSlots.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import axiosInstance from "../../utils/axiosInstance";
import { useMentorSlots } from "../../hooks/useMentorSlots";

vi.mock("../../utils/axiosInstance");

describe("useMentorSlots", () => {
    let setSelectedDuration;

    beforeEach(() => {
        vi.clearAllMocks();
        setSelectedDuration = vi.fn();
    });

    it("does not fetch when mentorUserId is falsy", () => {
        renderHook(() => useMentorSlots(null, 60, setSelectedDuration));

        expect(axiosInstance.get).not.toHaveBeenCalled();
    });

    it("fetches slots and updates groupedSlots on success", async () => {
        axiosInstance.get.mockResolvedValue({
            data: { slots: [{ date: "2026-07-11" }], sessionDurations: [30, 60] },
        });

        const { result } = renderHook(() =>
            useMentorSlots("mentor-1", 60, setSelectedDuration),
        );

        await waitFor(() => expect(result.current.fetchingSlots).toBe(false));

        expect(axiosInstance.get).toHaveBeenCalledWith(
            "/availability/mentor-1/slots?duration=60",
        );
        expect(result.current.groupedSlots).toEqual([{ date: "2026-07-11" }]);
        expect(result.current.availableDurations).toEqual([30, 60]);
        expect(setSelectedDuration).not.toHaveBeenCalled();
        expect(result.current.slotsError).toBe("");
    });

    it("defaults groupedSlots to an empty array when slots is missing", async () => {
        axiosInstance.get.mockResolvedValue({ data: {} });

        const { result } = renderHook(() =>
            useMentorSlots("mentor-1", 60, setSelectedDuration),
        );

        await waitFor(() => expect(result.current.fetchingSlots).toBe(false));

        expect(result.current.groupedSlots).toEqual([]);
    });

    it("keeps default availableDurations when sessionDurations is missing/empty", async () => {
        axiosInstance.get.mockResolvedValue({
            data: { slots: [], sessionDurations: [] },
        });

        const { result } = renderHook(() =>
            useMentorSlots("mentor-1", 60, setSelectedDuration),
        );

        await waitFor(() => expect(result.current.fetchingSlots).toBe(false));

        expect(result.current.availableDurations).toEqual([60]);
    });

    it("switches selectedDuration when the current duration is unsupported", async () => {
        axiosInstance.get.mockResolvedValue({
            data: { slots: [], sessionDurations: [30, 45] },
        });

        renderHook(() => useMentorSlots("mentor-1", 60, setSelectedDuration));

        await waitFor(() => expect(setSelectedDuration).toHaveBeenCalledWith(30));
    });

    it("does not switch selectedDuration when the current duration is supported", async () => {
        axiosInstance.get.mockResolvedValue({
            data: { slots: [], sessionDurations: [30, 60] },
        });

        const { result } = renderHook(() =>
            useMentorSlots("mentor-1", 60, setSelectedDuration),
        );

        await waitFor(() => expect(result.current.fetchingSlots).toBe(false));

        expect(setSelectedDuration).not.toHaveBeenCalled();
    });

    it("sets a 'no availability' message on a 404 error and clears groupedSlots", async () => {
        axiosInstance.get.mockRejectedValue({ response: { status: 404 } });

        const { result } = renderHook(() =>
            useMentorSlots("mentor-1", 60, setSelectedDuration),
        );

        await waitFor(() => expect(result.current.fetchingSlots).toBe(false));

        expect(result.current.slotsError).toBe(
            "This mentor hasn't set their availability yet.",
        );
        expect(result.current.groupedSlots).toEqual([]);
    });

    it("sets a generic error message for non-404 errors", async () => {
        axiosInstance.get.mockRejectedValue({ response: { status: 403 } });

        const { result } = renderHook(() =>
            useMentorSlots("mentor-1", 60, setSelectedDuration),
        );

        await waitFor(() => expect(result.current.fetchingSlots).toBe(false));

        expect(result.current.slotsError).toBe("Failed to load available slots.");
    });

    it("refetches when mentorUserId or selectedDuration changes", async () => {
        axiosInstance.get
            .mockResolvedValueOnce({ data: { slots: [{ date: "d1" }] } })
            .mockResolvedValueOnce({ data: { slots: [{ date: "d2" }] } });

        const { result, rerender } = renderHook(
            ({ id, dur }) => useMentorSlots(id, dur, setSelectedDuration),
            { initialProps: { id: "mentor-1", dur: 60 } },
        );

        await waitFor(() => expect(result.current.fetchingSlots).toBe(false));
        expect(result.current.groupedSlots).toEqual([{ date: "d1" }]);

        rerender({ id: "mentor-1", dur: 30 });

        await waitFor(() =>
            expect(result.current.groupedSlots).toEqual([{ date: "d2" }]),
        );
        expect(axiosInstance.get).toHaveBeenCalledTimes(2);
    });
    it("sets a generic backend error message for 5xx errors", async () => {
        axiosInstance.get.mockRejectedValue({ response: { status: 500 } });

        const { result } = renderHook(() =>
            useMentorSlots("mentor-1", 60, setSelectedDuration),
        );

        await waitFor(() => expect(result.current.fetchingSlots).toBe(false));

        expect(result.current.slotsError).toBe(
            "Something went wrong on our end. We've been notified — please try again shortly.",
        );
    });
    it("fetchSlots can be invoked manually with an explicit duration", async () => {
        axiosInstance.get.mockResolvedValue({ data: { slots: [{ date: "manual" }] } });

        const { result } = renderHook(() =>
            useMentorSlots("mentor-1", 60, setSelectedDuration),
        );

        await waitFor(() => expect(result.current.fetchingSlots).toBe(false));

        axiosInstance.get.mockClear();
        axiosInstance.get.mockResolvedValue({ data: { slots: [{ date: "manual2" }] } });

        await act(async () => {
            await result.current.fetchSlots(90);
        });

        expect(axiosInstance.get).toHaveBeenCalledWith(
            "/availability/mentor-1/slots?duration=90",
        );
    });
});