// src/test/hooks/useAvailability.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import * as availabilityApi from "../../api/availability.api";
import useAvailability from "../../hooks/useAvailability";

vi.mock("../../api/availability.api");

describe("useAvailability", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("initial fetch", () => {
        it("has correct default state before the fetch resolves", () => {
            availabilityApi.getMyAvailability.mockReturnValue(new Promise(() => { }));

            const { result } = renderHook(() => useAvailability());

            expect(result.current.loading).toBe(true);
            expect(result.current.availability).toEqual({
                timezone: "Asia/Kolkata",
                sessionDurations: [30, 60],
                googleCalendarConnected: false,
                specificDates: [],
            });
        });

        it("merges fetched data over the defaults", async () => {
            availabilityApi.getMyAvailability.mockResolvedValue({
                timezone: "America/New_York",
                sessionDurations: [45],
                googleCalendarConnected: true,
                specificDates: [{ date: "2026-07-11" }],
            });

            const { result } = renderHook(() => useAvailability());

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.availability).toEqual({
                timezone: "America/New_York",
                sessionDurations: [45],
                googleCalendarConnected: true,
                specificDates: [{ date: "2026-07-11" }],
            });
        });

        it("defaults specificDates to an empty array when missing from the response", async () => {
            availabilityApi.getMyAvailability.mockResolvedValue({ timezone: "UTC" });

            const { result } = renderHook(() => useAvailability());

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.availability.specificDates).toEqual([]);
        });

        it("does not set an error message on a 404 (no availability set yet)", async () => {
            availabilityApi.getMyAvailability.mockRejectedValue({ response: { status: 404 } });

            const { result } = renderHook(() => useAvailability());

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.msg).toEqual({ type: "", text: "" });
        });

        it("sets an error message for non-404 failures", async () => {
            availabilityApi.getMyAvailability.mockRejectedValue({
                response: { status: 500, data: { message: "boom" } },
            });

            const { result } = renderHook(() => useAvailability());

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.msg.type).toBe("error");
        });
    });

    describe("toggleDuration", () => {
        it("adds a duration and keeps the list sorted", async () => {
            availabilityApi.getMyAvailability.mockResolvedValue({});
            const { result } = renderHook(() => useAvailability());
            await waitFor(() => expect(result.current.loading).toBe(false));

            act(() => {
                result.current.toggleDuration(45);
            });

            expect(result.current.availability.sessionDurations).toEqual([30, 45, 60]);
        });

        it("removes a duration if it is already present", async () => {
            availabilityApi.getMyAvailability.mockResolvedValue({});
            const { result } = renderHook(() => useAvailability());
            await waitFor(() => expect(result.current.loading).toBe(false));

            act(() => {
                result.current.toggleDuration(30);
            });

            expect(result.current.availability.sessionDurations).toEqual([60]);
        });
    });

    describe("updateTimezone", () => {
        it("updates the timezone field", async () => {
            availabilityApi.getMyAvailability.mockResolvedValue({});
            const { result } = renderHook(() => useAvailability());
            await waitFor(() => expect(result.current.loading).toBe(false));

            act(() => {
                result.current.updateTimezone("Europe/London");
            });

            expect(result.current.availability.timezone).toBe("Europe/London");
        });
    });

    describe("setSpecificDates", () => {
        it("accepts a direct value", async () => {
            availabilityApi.getMyAvailability.mockResolvedValue({});
            const { result } = renderHook(() => useAvailability());
            await waitFor(() => expect(result.current.loading).toBe(false));

            act(() => {
                result.current.setSpecificDates([{ date: "2026-08-01" }]);
            });

            expect(result.current.availability.specificDates).toEqual([{ date: "2026-08-01" }]);
        });

        it("accepts an updater function", async () => {
            availabilityApi.getMyAvailability.mockResolvedValue({
                specificDates: [{ date: "2026-08-01" }],
            });
            const { result } = renderHook(() => useAvailability());
            await waitFor(() => expect(result.current.loading).toBe(false));

            act(() => {
                result.current.setSpecificDates((prev) => [...prev, { date: "2026-08-02" }]);
            });

            expect(result.current.availability.specificDates).toEqual([
                { date: "2026-08-01" },
                { date: "2026-08-02" },
            ]);
        });
    });

    describe("saveAvailability", () => {
        it("saves with the current timezone/durations/dates and shows success", async () => {
            availabilityApi.getMyAvailability.mockResolvedValue({
                timezone: "UTC",
                sessionDurations: [30],
                specificDates: [],
            });
            availabilityApi.saveMyAvailability.mockResolvedValue({});

            const { result } = renderHook(() => useAvailability());
            await waitFor(() => expect(result.current.loading).toBe(false));

            await act(async () => {
                await result.current.saveAvailability();
            });

            expect(availabilityApi.saveMyAvailability).toHaveBeenCalledWith({
                timezone: "UTC",
                sessionDurations: [30],
                specificDates: [],
            });
            expect(result.current.msg).toEqual({
                type: "success",
                text: "Availability saved successfully!",
            });
            expect(result.current.saving).toBe(false);
        });

        it("sets an error message on save failure", async () => {
            availabilityApi.getMyAvailability.mockResolvedValue({});
            availabilityApi.saveMyAvailability.mockRejectedValue({
                response: { data: { message: "Save rejected" } },
            });

            const { result } = renderHook(() => useAvailability());
            await waitFor(() => expect(result.current.loading).toBe(false));

            await act(async () => {
                await result.current.saveAvailability();
            });

            expect(result.current.msg.type).toBe("error");
            expect(result.current.saving).toBe(false);
        });
    });

    describe("cancelChanges", () => {
        it("re-fetches and clears the message", async () => {
            availabilityApi.getMyAvailability
                .mockResolvedValueOnce({ timezone: "UTC" })
                .mockResolvedValueOnce({ timezone: "Asia/Kolkata", sessionDurations: [60] });

            const { result } = renderHook(() => useAvailability());
            await waitFor(() => expect(result.current.loading).toBe(false));

            act(() => {
                result.current.updateTimezone("Should be discarded");
            });

            await act(async () => {
                await result.current.cancelChanges();
            });

            expect(availabilityApi.getMyAvailability).toHaveBeenCalledTimes(2);
            expect(result.current.availability.timezone).toBe("Asia/Kolkata");
            expect(result.current.msg).toEqual({ type: "", text: "" });
        });

        it("silently ignores errors during cancel", async () => {
            availabilityApi.getMyAvailability
                .mockResolvedValueOnce({})
                .mockRejectedValueOnce(new Error("fail"));

            const { result } = renderHook(() => useAvailability());
            await waitFor(() => expect(result.current.loading).toBe(false));

            await act(async () => {
                await expect(result.current.cancelChanges()).resolves.not.toThrow();
            });

            expect(result.current.loading).toBe(false);
        });
    });
});