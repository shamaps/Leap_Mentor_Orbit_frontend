// src/test/hooks/useRequestHistory.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import axiosInstance from "../../utils/axiosInstance";
import logger from "../../utils/logger";
import useRequestHistory from "../../hooks/useRequestHistory";

vi.mock("../../utils/axiosInstance");
vi.mock("../../utils/logger");

const sampleRequests = [
    { _id: "1", status: "pending" },
    { _id: "2", status: "accepted" },
    { _id: "3", status: "accepted" },
    { _id: "4", status: "ongoing" },
    { _id: "5", status: "completed" },
    { _id: "6", status: "rejected" },
    { _id: "7", status: "referred" },
];

describe("useRequestHistory", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("fetchRequests (on mount)", () => {
        it("fetches requests and sets loading false after initial load", async () => {
            axiosInstance.get.mockResolvedValue({ data: { requests: sampleRequests } });

            const { result } = renderHook(() => useRequestHistory());

            expect(result.current.loading).toBe(true);

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(axiosInstance.get).toHaveBeenCalledWith("/connect-requests/my-requests");
            expect(result.current.requests).toEqual(sampleRequests);
        });

        it("defaults requests to an empty array when missing from the response", async () => {
            axiosInstance.get.mockResolvedValue({ data: {} });

            const { result } = renderHook(() => useRequestHistory());

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.requests).toEqual([]);
        });

        it("sets an error message on failure", async () => {
            axiosInstance.get.mockRejectedValue({
                response: { data: { message: "Server error" } },
            });

            const { result } = renderHook(() => useRequestHistory());

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.error).toBe("Server error");
        });

        it("falls back to a generic error message when the API gives none", async () => {
            axiosInstance.get.mockRejectedValue({});

            const { result } = renderHook(() => useRequestHistory());

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.error).toBe("Failed to load requests.");
        });

        it("does not show loading spinner on a background refetch after initial load", async () => {
            axiosInstance.get.mockResolvedValue({ data: { requests: sampleRequests } });

            const { result } = renderHook(() => useRequestHistory());

            await waitFor(() => expect(result.current.loading).toBe(false));

            act(() => {
                result.current.fetchRequests();
            });

            // loading should stay false because initialLoad is already false
            expect(result.current.loading).toBe(false);

            await waitFor(() => expect(axiosInstance.get).toHaveBeenCalledTimes(2));
        });
    });

    describe("filtered and counts", () => {
        it("returns all requests when activeTab is 'all'", async () => {
            axiosInstance.get.mockResolvedValue({ data: { requests: sampleRequests } });

            const { result } = renderHook(() => useRequestHistory());
            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.filtered).toEqual(sampleRequests);
        });

        it("filters requests by activeTab", async () => {
            axiosInstance.get.mockResolvedValue({ data: { requests: sampleRequests } });

            const { result } = renderHook(() => useRequestHistory());
            await waitFor(() => expect(result.current.loading).toBe(false));

            act(() => {
                result.current.setActiveTab("accepted");
            });

            expect(result.current.filtered).toEqual([
                { _id: "2", status: "accepted" },
                { _id: "3", status: "accepted" },
            ]);
        });

        it("computes correct counts per status", async () => {
            axiosInstance.get.mockResolvedValue({ data: { requests: sampleRequests } });

            const { result } = renderHook(() => useRequestHistory());
            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.counts).toEqual({
                all: 7,
                pending: 1,
                accepted: 2,
                ongoing: 1,
                completed: 1,
                rejected: 1,
                referred: 1,
            });
        });
    });

    describe("deleteRequest", () => {
        it("removes the request from the list on success", async () => {
            axiosInstance.get.mockResolvedValue({ data: { requests: sampleRequests } });
            axiosInstance.delete.mockResolvedValue({});

            const { result } = renderHook(() => useRequestHistory());
            await waitFor(() => expect(result.current.loading).toBe(false));

            await act(async () => {
                await result.current.deleteRequest("2");
            });

            expect(axiosInstance.delete).toHaveBeenCalledWith("/connect-requests/2");
            expect(result.current.requests.find((r) => r._id === "2")).toBeUndefined();
        });

        it("clears selected when the deleted request was selected", async () => {
            axiosInstance.get.mockResolvedValue({ data: { requests: sampleRequests } });
            axiosInstance.delete.mockResolvedValue({});

            const { result } = renderHook(() => useRequestHistory());
            await waitFor(() => expect(result.current.loading).toBe(false));

            act(() => {
                result.current.setSelected({ _id: "2", status: "accepted" });
            });

            await act(async () => {
                await result.current.deleteRequest("2");
            });

            expect(result.current.selected).toBeNull();
        });

        it("does not clear selected when a different request is deleted", async () => {
            axiosInstance.get.mockResolvedValue({ data: { requests: sampleRequests } });
            axiosInstance.delete.mockResolvedValue({});

            const { result } = renderHook(() => useRequestHistory());
            await waitFor(() => expect(result.current.loading).toBe(false));

            act(() => {
                result.current.setSelected({ _id: "3", status: "accepted" });
            });

            await act(async () => {
                await result.current.deleteRequest("2");
            });

            expect(result.current.selected).toEqual({ _id: "3", status: "accepted" });
        });

        it("logs an error on failure and does not modify the list", async () => {
            axiosInstance.get.mockResolvedValue({ data: { requests: sampleRequests } });
            axiosInstance.delete.mockRejectedValue({
                response: { data: { message: "Cannot delete" } },
            });

            const { result } = renderHook(() => useRequestHistory());
            await waitFor(() => expect(result.current.loading).toBe(false));

            await act(async () => {
                await result.current.deleteRequest("2");
            });

            expect(logger.error).toHaveBeenCalledWith("Delete error", {
                message: "Cannot delete",
            });
            expect(result.current.requests.find((r) => r._id === "2")).toBeDefined();
        });
    });

    describe("updateRequest", () => {
        it("patches the matching request in the list", async () => {
            axiosInstance.get.mockResolvedValue({ data: { requests: sampleRequests } });

            const { result } = renderHook(() => useRequestHistory());
            await waitFor(() => expect(result.current.loading).toBe(false));

            act(() => {
                result.current.updateRequest("1", { status: "accepted" });
            });

            expect(result.current.requests.find((r) => r._id === "1").status).toBe("accepted");
        });

        it("patches selected when it matches the updated id", async () => {
            axiosInstance.get.mockResolvedValue({ data: { requests: sampleRequests } });

            const { result } = renderHook(() => useRequestHistory());
            await waitFor(() => expect(result.current.loading).toBe(false));

            act(() => {
                result.current.setSelected({ _id: "1", status: "pending" });
            });

            act(() => {
                result.current.updateRequest("1", { status: "accepted" });
            });

            expect(result.current.selected).toEqual({ _id: "1", status: "accepted" });
        });
    });
});