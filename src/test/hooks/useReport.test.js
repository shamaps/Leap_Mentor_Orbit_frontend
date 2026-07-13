// src/test/hooks/useReport.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import axiosInstance from "../../utils/axiosInstance";
import logger from "../../utils/logger";
import useReport from "../../hooks/useReport";

vi.mock("../../utils/axiosInstance");
vi.mock("../../utils/logger");

describe("useReport", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("fetchFeedback (on mount)", () => {
        it("does not fetch when connectRequestId is falsy", () => {
            renderHook(() => useReport(null));

            expect(axiosInstance.get).not.toHaveBeenCalled();
        });

        it("fetches and sets feedback fields on success", async () => {
            axiosInstance.get.mockResolvedValue({
                data: {
                    myFeedback: { rating: 5 },
                    mySlotFeedback: [{ slotIndex: 0, rating: 5 }],
                    theirFeedback: { rating: 4 },
                    sessionStatus: "completed",
                },
            });

            const { result } = renderHook(() => useReport("conn-1"));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(axiosInstance.get).toHaveBeenCalledWith("/feedback/conn-1");
            expect(result.current.myFeedback).toEqual({ rating: 5 });
            expect(result.current.mySlotFeedback).toEqual([{ slotIndex: 0, rating: 5 }]);
            expect(result.current.theirFeedback).toEqual({ rating: 4 });
            expect(result.current.sessionStatus).toBe("completed");
            expect(result.current.error).toBeNull();
        });

        it("defaults fields to null/empty array when missing from the response", async () => {
            axiosInstance.get.mockResolvedValue({ data: {} });

            const { result } = renderHook(() => useReport("conn-2"));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.myFeedback).toBeNull();
            expect(result.current.mySlotFeedback).toEqual([]);
            expect(result.current.theirFeedback).toBeNull();
            expect(result.current.sessionStatus).toBeNull();
        });

        it("sets an error message from the API response on failure", async () => {
            axiosInstance.get.mockRejectedValue({
                response: { data: { message: "Feedback not found" } },
            });

            const { result } = renderHook(() => useReport("conn-3"));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.error).toBe("Feedback not found");
        });

        it("falls back to a generic error message when the API gives none", async () => {
            axiosInstance.get.mockRejectedValue({});

            const { result } = renderHook(() => useReport("conn-4"));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.error).toBe("Failed to load feedback.");
        });

        it("refetches when refreshKey changes", async () => {
            axiosInstance.get.mockResolvedValue({ data: {} });

            const { rerender } = renderHook(
                ({ id, key }) => useReport(id, key),
                { initialProps: { id: "conn-5", key: 0 } },
            );

            await waitFor(() => expect(axiosInstance.get).toHaveBeenCalledTimes(1));

            rerender({ id: "conn-5", key: 1 });

            await waitFor(() => expect(axiosInstance.get).toHaveBeenCalledTimes(2));
        });

        it("exposes refetch which manually triggers fetchFeedback", async () => {
            axiosInstance.get.mockResolvedValue({ data: {} });

            const { result } = renderHook(() => useReport("conn-6"));

            await waitFor(() => expect(result.current.loading).toBe(false));
            axiosInstance.get.mockClear();

            await act(async () => {
                await result.current.refetch();
            });

            expect(axiosInstance.get).toHaveBeenCalledWith("/feedback/conn-6");
        });
    });

    describe("submitFeedback", () => {
        it("returns { success: false } and does not call the API when connectRequestId is falsy", async () => {
            const { result } = renderHook(() => useReport(null));

            let res;
            await act(async () => {
                res = await result.current.submitFeedback(5, "Great session", 0);
            });

            expect(res).toEqual({ success: false });
            expect(axiosInstance.post).not.toHaveBeenCalled();
        });

        it("logs debug info before submitting", async () => {
            axiosInstance.get.mockResolvedValue({ data: {} });
            axiosInstance.post.mockResolvedValue({ data: { feedback: { rating: 5 } } });

            const { result } = renderHook(() => useReport("conn-7"));
            await waitFor(() => expect(result.current.loading).toBe(false));

            await act(async () => {
                await result.current.submitFeedback(5, "Great session", 1);
            });

            expect(logger.debug).toHaveBeenCalledWith("Sending feedback", {
                connectRequestId: "conn-7",
                rating: 5,
                comment: "Great session",
                slotIndex: 1,
            });
        });

        it("submits feedback successfully and updates myFeedback", async () => {
            axiosInstance.get.mockResolvedValue({ data: {} });
            axiosInstance.post.mockResolvedValue({ data: { feedback: { rating: 5, comment: "Great" } } });

            const { result } = renderHook(() => useReport("conn-8"));
            await waitFor(() => expect(result.current.loading).toBe(false));

            let res;
            await act(async () => {
                res = await result.current.submitFeedback(5, "Great", 0);
            });

            expect(axiosInstance.post).toHaveBeenCalledWith("/feedback", {
                connectRequestId: "conn-8",
                rating: 5,
                comment: "Great",
                slotIndex: 0,
            });
            expect(res).toEqual({ success: true });
            expect(result.current.myFeedback).toEqual({ rating: 5, comment: "Great" });
            expect(result.current.submitting).toBe(false);
        });

        it("returns an error message and sets error state on failure", async () => {
            axiosInstance.get.mockResolvedValue({ data: {} });
            axiosInstance.post.mockRejectedValue({
                response: { data: { message: "Already submitted" } },
            });

            const { result } = renderHook(() => useReport("conn-9"));
            await waitFor(() => expect(result.current.loading).toBe(false));

            let res;
            await act(async () => {
                res = await result.current.submitFeedback(3, "Ok", 0);
            });

            expect(res).toEqual({ success: false, message: "Already submitted" });
            expect(result.current.error).toBe("Already submitted");
            expect(result.current.submitting).toBe(false);
        });

        it("falls back to a generic error message when the API gives none", async () => {
            axiosInstance.get.mockResolvedValue({ data: {} });
            axiosInstance.post.mockRejectedValue({});

            const { result } = renderHook(() => useReport("conn-10"));
            await waitFor(() => expect(result.current.loading).toBe(false));

            let res;
            await act(async () => {
                res = await result.current.submitFeedback(3, "Ok", 0);
            });

            expect(res).toEqual({ success: false, message: "Failed to submit feedback." });
        });
    });
});