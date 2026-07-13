// src/test/hooks/useTrackEarnings.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useTrackEarnings from "../../hooks/useTrackEarnings";
import axiosInstance from "../../utils/axiosInstance";
import logger from "../../utils/logger";

vi.mock("../../utils/axiosInstance", () => ({
    default: { get: vi.fn(), post: vi.fn() },
}));
vi.mock("../../utils/logger", () => ({
    default: { warn: vi.fn(), error: vi.fn() },
}));

const flush = async () => {
    await act(async () => {
        await Promise.resolve();
    });
};

describe("useTrackEarnings", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        axiosInstance.get.mockReset();
        axiosInstance.post.mockReset();
        logger.error.mockReset();

        axiosInstance.get.mockImplementation((url) => {
            if (url === "/mentor/earnings") {
                return Promise.resolve({
                    data: {
                        totalEarnings: 1000,
                        sessionsThisMonth: 5,
                        avgRating: 4.5,
                        pendingPayout: 200,
                        walletBalance: 300,
                    },
                });
            }
            if (url.startsWith("/mentor/earnings/chart")) {
                return Promise.resolve({ data: { data: [{ month: "Jan", amount: 100 }] } });
            }
            if (url.startsWith("/mentor/earnings/payouts")) {
                return Promise.resolve({
                    data: {
                        payouts: [{ id: "p1" }],
                        pagination: { hasMore: false, totalCount: 1 },
                    },
                });
            }
            return Promise.resolve({ data: {} });
        });
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it("fetches stats, chart, and payouts on mount", async () => {
        const { result } = renderHook(() => useTrackEarnings());
        await flush();

        expect(axiosInstance.get).toHaveBeenCalledWith("/mentor/earnings");
        expect(axiosInstance.get).toHaveBeenCalledWith("/mentor/earnings/chart?period=monthly");
        expect(axiosInstance.get.mock.calls.some(([u]) => u.startsWith("/mentor/earnings/payouts"))).toBe(true);

        expect(result.current.stats).toEqual({
            totalEarnings: 1000,
            sessionsThisMonth: 5,
            avgRating: 4.5,
            pendingPayout: 200,
            walletBalance: 300,
        });
        expect(result.current.loadingStats).toBe(false);
        expect(result.current.chartData).toEqual([{ month: "Jan", amount: 100 }]);
        expect(result.current.loadingChart).toBe(false);
        expect(result.current.payouts).toEqual([{ id: "p1" }]);
        expect(result.current.loadingPayouts).toBe(false);
        expect(result.current.hasMore).toBe(false);
        expect(result.current.totalCount).toBe(1);
    });

    it("defaults every stat field to 0 when the server omits it", async () => {
        axiosInstance.get.mockImplementation((url) => {
            if (url === "/mentor/earnings") return Promise.resolve({ data: {} });
            return Promise.resolve({ data: {} });
        });
        const { result } = renderHook(() => useTrackEarnings());
        await flush();

        expect(result.current.stats).toEqual({
            totalEarnings: 0,
            sessionsThisMonth: 0,
            avgRating: 0,
            pendingPayout: 0,
            walletBalance: 0,
        });
    });

    it("sets an error message when stats fetch fails, using the server message", async () => {
        axiosInstance.get.mockImplementation((url) => {
            if (url === "/mentor/earnings") {
                return Promise.reject({ response: { data: { message: "Unauthorized" } } });
            }
            return Promise.resolve({ data: {} });
        });
        const { result } = renderHook(() => useTrackEarnings());
        await flush();

        expect(result.current.error).toBe("Unauthorized");
        expect(result.current.loadingStats).toBe(false);
    });

    it("falls back to the generic earnings-error message when stats fetch fails without a server message", async () => {
        axiosInstance.get.mockImplementation((url) => {
            if (url === "/mentor/earnings") return Promise.reject(new Error("network down"));
            return Promise.resolve({ data: {} });
        });
        const { result } = renderHook(() => useTrackEarnings());
        await flush();

        expect(result.current.error).toBe("Failed to load earnings.");
    });

    it("defaults chartData to [] when the server omits data, and logs on chart fetch failure", async () => {
        axiosInstance.get.mockImplementation((url) => {
            if (url.startsWith("/mentor/earnings/chart")) return Promise.resolve({ data: {} });
            if (url === "/mentor/earnings") return Promise.resolve({ data: {} });
            return Promise.resolve({ data: {} });
        });
        const { result } = renderHook(() => useTrackEarnings());
        await flush();
        expect(result.current.chartData).toEqual([]);

        axiosInstance.get.mockImplementation((url) => {
            if (url.startsWith("/mentor/earnings/chart")) return Promise.reject(new Error("chart down"));
            return Promise.resolve({ data: {} });
        });
        act(() => {
            result.current.handleChartPeriod("weekly");
        });
        await flush();

        expect(result.current.chartPeriod).toBe("weekly");
        expect(logger.error).toHaveBeenCalledWith("Chart fetch error", { message: "chart down" });
        expect(result.current.loadingChart).toBe(false);
    });

    it("defaults payouts/hasMore/totalCount when the server response is bare, and logs on payouts fetch failure", async () => {
        axiosInstance.get.mockImplementation((url) => {
            if (url.startsWith("/mentor/earnings/payouts")) return Promise.resolve({ data: {} });
            return Promise.resolve({ data: {} });
        });
        const { result } = renderHook(() => useTrackEarnings());
        await flush();

        expect(result.current.payouts).toEqual([]);
        expect(result.current.hasMore).toBe(false);
        expect(result.current.totalCount).toBe(0);

        axiosInstance.get.mockImplementation((url) => {
            if (url.startsWith("/mentor/earnings/payouts")) return Promise.reject(new Error("payouts down"));
            return Promise.resolve({ data: {} });
        });
        act(() => {
            result.current.setSearch("mentor");
        });
        await act(async () => {
            vi.advanceTimersByTime(300);
            await Promise.resolve();
        });

        expect(logger.error).toHaveBeenCalledWith("Payouts fetch error", { message: "payouts down" });
    });

    it("debounces search input into a single payouts fetch, resetting page to 1 and including the search param", async () => {
        const { result } = renderHook(() => useTrackEarnings());
        await flush();
        axiosInstance.get.mockClear();

        act(() => result.current.setSearch("a"));
        act(() => result.current.setSearch("ab"));
        act(() => result.current.setSearch("abc"));
        expect(
            axiosInstance.get.mock.calls.some(([u]) => u.startsWith("/mentor/earnings/payouts")),
        ).toBe(false);

        await act(async () => {
            vi.advanceTimersByTime(300);
            await Promise.resolve();
        });

        const payoutCalls = axiosInstance.get.mock.calls.filter(([u]) => u.startsWith("/mentor/earnings/payouts"));
        expect(payoutCalls).toHaveLength(1);
        expect(payoutCalls[0][0]).toContain("search=abc");
        expect(payoutCalls[0][0]).toContain("page=1");
        expect(result.current.page).toBe(1);
    });

    it("omits the search param entirely when search is cleared back to empty", async () => {
        const { result } = renderHook(() => useTrackEarnings());
        await flush();
        axiosInstance.get.mockClear();

        act(() => result.current.setSearch(""));
        await act(async () => {
            vi.advanceTimersByTime(300);
            await Promise.resolve();
        });

        const payoutCalls = axiosInstance.get.mock.calls.filter(([u]) => u.startsWith("/mentor/earnings/payouts"));
        expect(payoutCalls[0][0]).not.toContain("search=");
    });

    it("loadMore appends the next page of payouts to the existing list", async () => {
        const { result } = renderHook(() => useTrackEarnings());
        await flush();

        axiosInstance.get.mockImplementation((url) => {
            if (url.startsWith("/mentor/earnings/payouts")) {
                return Promise.resolve({
                    data: { payouts: [{ id: "p2" }], pagination: { hasMore: false, totalCount: 2 } },
                });
            }
            return Promise.resolve({ data: {} });
        });

        await act(async () => {
            result.current.loadMore();
        });

        expect(result.current.payouts).toEqual([{ id: "p1" }, { id: "p2" }]);
        expect(result.current.page).toBe(2);
    });

    it("goNext fetches the next page without appending (replaces the list)", async () => {
        const { result } = renderHook(() => useTrackEarnings());
        await flush();

        axiosInstance.get.mockImplementation((url) => {
            if (url.startsWith("/mentor/earnings/payouts")) {
                return Promise.resolve({
                    data: { payouts: [{ id: "p2" }], pagination: { hasMore: true, totalCount: 5 } },
                });
            }
            return Promise.resolve({ data: {} });
        });

        await act(async () => {
            result.current.goNext();
        });

        expect(result.current.payouts).toEqual([{ id: "p2" }]);
        expect(result.current.page).toBe(2);
    });

    it("goPrev decrements the page and never goes below 1", async () => {
        const { result } = renderHook(() => useTrackEarnings());
        await flush();

        await act(async () => {
            result.current.goNext();
        });
        expect(result.current.page).toBe(2);

        await act(async () => {
            result.current.goPrev();
        });
        expect(result.current.page).toBe(1);

        await act(async () => {
            result.current.goPrev();
        });
        expect(result.current.page).toBe(1); // clamped, not 0
    });

    it("handleWithdraw: succeeds, zeroes the wallet balance, and auto-closes the modal", async () => {
        axiosInstance.post.mockResolvedValueOnce({ data: { message: "Withdrawal requested" } });
        const { result } = renderHook(() => useTrackEarnings());
        await flush();

        await act(async () => {
            await result.current.handleWithdraw();
        });

        expect(axiosInstance.post).toHaveBeenCalledWith("/mentor/earnings/withdraw", {});
        expect(result.current.withdrawMsg).toEqual({
            type: "success",
            text: "Withdrawal requested",
        });
        expect(result.current.stats.walletBalance).toBe(0);
        expect(result.current.withdrawing).toBe(false);

        act(() => {
            result.current.setShowWithdraw(true);
        });
        await act(async () => {
            vi.advanceTimersByTime(1500);
        });

        expect(result.current.showWithdraw).toBe(false);
        expect(result.current.withdrawMsg).toEqual({ type: "", text: "" });
    });

    it("handleWithdraw: sets an error message using the server response on failure", async () => {
        axiosInstance.post.mockRejectedValueOnce({
            response: { data: { message: "Insufficient balance" } },
        });
        const { result } = renderHook(() => useTrackEarnings());
        await flush();

        await act(async () => {
            await result.current.handleWithdraw();
        });

        expect(result.current.withdrawMsg).toEqual({
            type: "error",
            text: "Insufficient balance",
        });
        expect(result.current.withdrawing).toBe(false);
    });

    it("handleWithdraw: falls back to the generic withdrawal-failed message", async () => {
        axiosInstance.post.mockRejectedValueOnce(new Error("boom"));
        const { result } = renderHook(() => useTrackEarnings());
        await flush();

        await act(async () => {
            await result.current.handleWithdraw();
        });

        expect(result.current.withdrawMsg).toEqual({
            type: "error",
            text: "Withdrawal failed.",
        });
    });

    it("fetchStats is exposed for manual refresh", async () => {
        const { result } = renderHook(() => useTrackEarnings());
        await flush();
        axiosInstance.get.mockClear();

        await act(async () => {
            await result.current.fetchStats();
        });

        expect(axiosInstance.get).toHaveBeenCalledWith("/mentor/earnings");
    });
});