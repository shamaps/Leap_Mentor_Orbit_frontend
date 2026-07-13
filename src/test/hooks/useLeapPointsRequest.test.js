// src/test/hooks/useLeapPointsRequest.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import axiosInstance from "../../utils/axiosInstance";
import logger from "../../utils/logger";
import { useLeapPointsRequest } from "../../hooks/useLeapPointsRequest";

vi.mock("../../utils/axiosInstance");
vi.mock("../../utils/logger");

describe("useLeapPointsRequest", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("initial check on mount", () => {
        it("sets requestStatus to 'pending' when an existing pending request is found", async () => {
            axiosInstance.get.mockResolvedValue({ data: { status: "pending" } });

            const { result } = renderHook(() => useLeapPointsRequest());

            await waitFor(() => expect(result.current.checking).toBe(false));

            expect(axiosInstance.get).toHaveBeenCalledWith("/leap-requests/my-request", {
                suppressNotFoundLog: true,
            });
            expect(result.current.requestStatus).toBe("pending");
        });

        it("leaves requestStatus null when there's no existing request (non-pending status)", async () => {
            axiosInstance.get.mockResolvedValue({ data: { status: "approved" } });

            const { result } = renderHook(() => useLeapPointsRequest());

            await waitFor(() => expect(result.current.checking).toBe(false));

            expect(result.current.requestStatus).toBeNull();
        });

        it("does not log a warning on a 404 (no existing request)", async () => {
            axiosInstance.get.mockRejectedValue({ response: { status: 404 } });

            const { result } = renderHook(() => useLeapPointsRequest());

            await waitFor(() => expect(result.current.checking).toBe(false));

            expect(logger.warn).not.toHaveBeenCalled();
            expect(result.current.requestStatus).toBeNull();
        });

        it("logs a warning when the check fails with a non-404 error", async () => {
            axiosInstance.get.mockRejectedValue({
                response: { status: 500, data: { message: "server error" } },
            });

            const { result } = renderHook(() => useLeapPointsRequest());

            await waitFor(() => expect(result.current.checking).toBe(false));

            expect(logger.warn).toHaveBeenCalledWith("Leap request check failed", {
                detail: { message: "server error" },
            });
        });

        it("logs err.message when the failed response has no data", async () => {
            axiosInstance.get.mockRejectedValue({
                response: { status: 500 },
                message: "network fail",
            });

            const { result } = renderHook(() => useLeapPointsRequest());

            await waitFor(() => expect(result.current.checking).toBe(false));

            expect(logger.warn).toHaveBeenCalledWith("Leap request check failed", {
                detail: "network fail",
            });
        });
    });

    describe("handleUpgradeRequest", () => {
        it("sets status to 'sending' then 'sent' on success", async () => {
            axiosInstance.get.mockResolvedValue({ data: {} });
            axiosInstance.post.mockResolvedValue({});

            const { result } = renderHook(() => useLeapPointsRequest());
            await waitFor(() => expect(result.current.checking).toBe(false));

            await act(async () => {
                await result.current.handleUpgradeRequest();
            });

            expect(axiosInstance.post).toHaveBeenCalledWith("/leap-requests", {
                reason: "balance_refill",
            });
            expect(result.current.requestStatus).toBe("sent");
        });

        it("sets status to 'pending' when the API returns a 409 conflict", async () => {
            axiosInstance.get.mockResolvedValue({ data: {} });
            axiosInstance.post.mockRejectedValue({ response: { status: 409 } });

            const { result } = renderHook(() => useLeapPointsRequest());
            await waitFor(() => expect(result.current.checking).toBe(false));

            await act(async () => {
                await result.current.handleUpgradeRequest();
            });

            expect(result.current.requestStatus).toBe("pending");
        });

        it("sets status to 'pending' when the error message mentions 'pending'", async () => {
            axiosInstance.get.mockResolvedValue({ data: {} });
            axiosInstance.post.mockRejectedValue({
                response: { status: 400, data: { message: "You already have a Pending request" } },
            });

            const { result } = renderHook(() => useLeapPointsRequest());
            await waitFor(() => expect(result.current.checking).toBe(false));

            await act(async () => {
                await result.current.handleUpgradeRequest();
            });

            expect(result.current.requestStatus).toBe("pending");
        });

        it("sets status to 'error' and auto-resets to null after 3s on other failures", async () => {
            vi.useFakeTimers({ shouldAdvanceTime: true });
            axiosInstance.get.mockResolvedValue({ data: {} });
            axiosInstance.post.mockRejectedValue({
                response: { status: 500, data: { message: "boom" } },
            });

            const { result } = renderHook(() => useLeapPointsRequest());
            await waitFor(() => expect(result.current.checking).toBe(false));

            await act(async () => {
                await result.current.handleUpgradeRequest();
            });

            expect(result.current.requestStatus).toBe("error");
            expect(logger.error).toHaveBeenCalledWith(
                "Leap request error",
                expect.objectContaining({ detail: expect.any(String) }),
            );

            await act(async () => {
                vi.advanceTimersByTime(3000);
            });

            expect(result.current.requestStatus).toBeNull();
        });
    });
});