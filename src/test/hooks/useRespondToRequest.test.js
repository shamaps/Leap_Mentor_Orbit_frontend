// src/test/hooks/useRespondToRequest.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { respondToRequest, referRequest } from "../../api/connectRequests.api";
import { useToast } from "../../context/ToastContext";
import useRespondToRequest from "../../hooks/useRespondToRequest";

vi.mock("../../api/connectRequests.api");
vi.mock("../../context/ToastContext");

describe("useRespondToRequest", () => {
    let showToast;

    beforeEach(() => {
        vi.clearAllMocks();
        showToast = vi.fn();
        useToast.mockReturnValue({ showToast });
    });

    describe("respond", () => {
        it("accepts a request and shows a success toast", async () => {
            respondToRequest.mockResolvedValue({});

            const { result } = renderHook(() => useRespondToRequest());

            let returnValue;
            await act(async () => {
                returnValue = await result.current.respond({
                    requestId: "req-1",
                    status: "accepted",
                    confirmedSlot: { date: "2026-07-11" },
                    menteeName: "Alice",
                });
            });

            expect(respondToRequest).toHaveBeenCalledWith("req-1", {
                status: "accepted",
                confirmedSlot: { date: "2026-07-11" },
            });
            expect(showToast).toHaveBeenCalledWith({
                type: "success",
                title: "Request Accepted! 🎉",
                message: "You accepted Alice's request. A calendar invite has been sent.",
            });
            expect(returnValue).toBe(true);
            expect(result.current.responding).toBe(false);
        });

        it("declines a request and shows an info toast", async () => {
            respondToRequest.mockResolvedValue({});

            const { result } = renderHook(() => useRespondToRequest());

            let returnValue;
            await act(async () => {
                returnValue = await result.current.respond({
                    requestId: "req-2",
                    status: "declined",
                    confirmedSlot: null,
                    menteeName: "Bob",
                });
            });

            expect(showToast).toHaveBeenCalledWith({
                type: "info",
                title: "Request Declined",
                message: "You declined Bob's connect request.",
            });
            expect(returnValue).toBe(true);
        });

        it("shows an error toast and returns false on failure", async () => {
            respondToRequest.mockRejectedValue({
                response: { data: { message: "Slot no longer available" } },
            });

            const { result } = renderHook(() => useRespondToRequest());

            let returnValue;
            await act(async () => {
                returnValue = await result.current.respond({
                    requestId: "req-3",
                    status: "accepted",
                    confirmedSlot: {},
                    menteeName: "Carl",
                });
            });

            expect(showToast).toHaveBeenCalledWith({
                type: "error",
                title: "Action failed",
                message: "Slot no longer available",
            });
            expect(returnValue).toBe(false);
            expect(result.current.responding).toBe(false);
        });

        it("falls back to a generic error message when the API gives none", async () => {
            respondToRequest.mockRejectedValue({});

            const { result } = renderHook(() => useRespondToRequest());

            await act(async () => {
                await result.current.respond({
                    requestId: "req-4",
                    status: "accepted",
                    confirmedSlot: {},
                    menteeName: "Dana",
                });
            });

            expect(showToast).toHaveBeenCalledWith({
                type: "error",
                title: "Action failed",
                message: "Failed to respond to request.",
            });
        });
    });

    describe("refer", () => {
        it("refers a request and shows an info toast", async () => {
            referRequest.mockResolvedValue({});

            const { result } = renderHook(() => useRespondToRequest());

            let returnValue;
            await act(async () => {
                returnValue = await result.current.refer({
                    requestId: "req-5",
                    referToMentorId: "mentor-9",
                    menteeName: "Eve",
                    referredMentorName: "Dr. Smith",
                });
            });

            expect(referRequest).toHaveBeenCalledWith("req-5", "mentor-9");
            expect(showToast).toHaveBeenCalledWith({
                type: "info",
                title: "Request Referred",
                message: "Eve's request has been referred to Dr. Smith.",
            });
            expect(returnValue).toBe(true);
            expect(result.current.referring).toBe(false);
        });

        it("shows an error toast and returns false on failure", async () => {
            referRequest.mockRejectedValue({
                response: { data: { message: "Mentor unavailable" } },
            });

            const { result } = renderHook(() => useRespondToRequest());

            let returnValue;
            await act(async () => {
                returnValue = await result.current.refer({
                    requestId: "req-6",
                    referToMentorId: "mentor-2",
                    menteeName: "Frank",
                    referredMentorName: "Dr. Lee",
                });
            });

            expect(showToast).toHaveBeenCalledWith({
                type: "error",
                title: "Referral failed",
                message: "Mentor unavailable",
            });
            expect(returnValue).toBe(false);
        });

        it("falls back to a generic error message when the API gives none", async () => {
            referRequest.mockRejectedValue({});

            const { result } = renderHook(() => useRespondToRequest());

            await act(async () => {
                await result.current.refer({
                    requestId: "req-7",
                    referToMentorId: "mentor-3",
                    menteeName: "Grace",
                    referredMentorName: "Dr. Patel",
                });
            });

            expect(showToast).toHaveBeenCalledWith({
                type: "error",
                title: "Referral failed",
                message: "Failed to refer request.",
            });
        });
    });
});