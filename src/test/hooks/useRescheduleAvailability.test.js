// src/test/hooks/useRescheduleAvailability.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import * as availabilityApi from "../../api/availability.api";
import { useRescheduleAvailability } from "../../hooks/useRescheduleAvailability";

vi.mock("../../api/availability.api");

describe("useRescheduleAvailability", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("fetches availability on mount and populates slots + durations", async () => {
        availabilityApi.getMentorAvailabilityForReschedule.mockResolvedValue({
            slots: [{ start: "10am" }],
            sessionDurations: [45, 90],
        });

        const { result } = renderHook(() => useRescheduleAvailability("conn-1", 30));

        await waitFor(() => expect(result.current.availLoading).toBe(false));

        expect(availabilityApi.getMentorAvailabilityForReschedule).toHaveBeenCalledWith(
            "conn-1",
            30,
        );
        expect(result.current.availability).toEqual([{ start: "10am" }]);
        expect(result.current.sessionDurations).toEqual([45, 90]);
        expect(result.current.availError).toBeNull();
    });

    it("defaults availability to an empty array when slots is missing", async () => {
        availabilityApi.getMentorAvailabilityForReschedule.mockResolvedValue({});

        const { result } = renderHook(() => useRescheduleAvailability("conn-2", 60));

        await waitFor(() => expect(result.current.availLoading).toBe(false));

        expect(result.current.availability).toEqual([]);
    });

    it("keeps default sessionDurations when sessionDurations is missing/empty", async () => {
        availabilityApi.getMentorAvailabilityForReschedule.mockResolvedValue({
            slots: [],
            sessionDurations: [],
        });

        const { result } = renderHook(() => useRescheduleAvailability("conn-3", 30));

        await waitFor(() => expect(result.current.availLoading).toBe(false));

        expect(result.current.sessionDurations).toEqual([30, 60]);
    });

    it("sets a fallback error message when the API fails without a response message", async () => {
        availabilityApi.getMentorAvailabilityForReschedule.mockRejectedValue({});

        const { result } = renderHook(() => useRescheduleAvailability("conn-4", 30));

        await waitFor(() => expect(result.current.availLoading).toBe(false));

        expect(result.current.availError).toBe("Failed to load availability.");
    });

    it("uses the server-provided error message when available", async () => {
        availabilityApi.getMentorAvailabilityForReschedule.mockRejectedValue({
            response: { data: { message: "No mentor availability found." } },
        });

        const { result } = renderHook(() => useRescheduleAvailability("conn-5", 30));

        await waitFor(() => expect(result.current.availLoading).toBe(false));

        expect(result.current.availError).toBe("No mentor availability found.");
    });

    it("refetches when duration changes", async () => {
        availabilityApi.getMentorAvailabilityForReschedule
            .mockResolvedValueOnce({ slots: [{ start: "9am" }] })
            .mockResolvedValueOnce({ slots: [{ start: "2pm" }] });

        const { result, rerender } = renderHook(
            ({ dur }) => useRescheduleAvailability("conn-6", dur),
            { initialProps: { dur: 30 } },
        );

        await waitFor(() => expect(result.current.availLoading).toBe(false));
        expect(result.current.availability).toEqual([{ start: "9am" }]);

        rerender({ dur: 60 });

        await waitFor(() =>
            expect(result.current.availability).toEqual([{ start: "2pm" }]),
        );
        expect(availabilityApi.getMentorAvailabilityForReschedule).toHaveBeenCalledTimes(2);
        expect(availabilityApi.getMentorAvailabilityForReschedule).toHaveBeenLastCalledWith(
            "conn-6",
            60,
        );
    });
});