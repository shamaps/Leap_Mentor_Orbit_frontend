// src/test/hooks/useEscrowStatus.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import axiosInstance from "../../shared/utils/axiosInstance";
import logger from "../../shared/utils/logger";
import { useEscrowStatus } from "../../features/mentee/presenter/useEscrowStatus";

vi.mock("../../shared/utils/axiosInstance");
vi.mock("../../shared/utils/logger");

describe("useEscrowStatus", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("does not fetch when connectId is falsy, and stays in initial state", () => {
        const { result } = renderHook(() => useEscrowStatus(null));

        expect(axiosInstance.get).not.toHaveBeenCalled();
        expect(result.current.fetching).toBe(true);
        expect(result.current.walletBalance).toBeNull();
        expect(result.current.commissionRate).toBe(20);
    });

    it("fetches wallet balance and commission rate when connectId is provided", async () => {
        axiosInstance.get.mockResolvedValue({
            data: { wallet: { balance: 500 }, commissionRate: 15 },
        });

        const { result } = renderHook(() => useEscrowStatus("conn-1"));

        await waitFor(() => expect(result.current.fetching).toBe(false));

        expect(axiosInstance.get).toHaveBeenCalledWith("/escrow/status/conn-1");
        expect(result.current.walletBalance).toBe(500);
        expect(result.current.commissionRate).toBe(15);
    });

    it("defaults walletBalance to null when wallet/balance is missing", async () => {
        axiosInstance.get.mockResolvedValue({ data: {} });

        const { result } = renderHook(() => useEscrowStatus("conn-2"));

        await waitFor(() => expect(result.current.fetching).toBe(false));

        expect(result.current.walletBalance).toBeNull();
    });

    it("keeps default commissionRate when commissionRate is null/undefined in response", async () => {
        axiosInstance.get.mockResolvedValue({
            data: { wallet: { balance: 100 }, commissionRate: null },
        });

        const { result } = renderHook(() => useEscrowStatus("conn-3"));

        await waitFor(() => expect(result.current.fetching).toBe(false));

        expect(result.current.commissionRate).toBe(20);
    });

    it("updates commissionRate when it is explicitly 0 (not null/undefined)", async () => {
        axiosInstance.get.mockResolvedValue({
            data: { wallet: { balance: 50 }, commissionRate: 0 },
        });

        const { result } = renderHook(() => useEscrowStatus("conn-4"));

        await waitFor(() => expect(result.current.fetching).toBe(false));

        expect(result.current.commissionRate).toBe(0);
    });

    it("logs a warning and stops fetching when the request fails", async () => {
        axiosInstance.get.mockRejectedValue(new Error("network down"));

        const { result } = renderHook(() => useEscrowStatus("conn-5"));

        await waitFor(() => expect(result.current.fetching).toBe(false));

        expect(logger.warn).toHaveBeenCalledWith("Could not fetch escrow status", {
            message: "network down",
        });
        expect(result.current.walletBalance).toBeNull();
    });

    it("refetches when connectId changes", async () => {
        axiosInstance.get
            .mockResolvedValueOnce({ data: { wallet: { balance: 10 }, commissionRate: 5 } })
            .mockResolvedValueOnce({ data: { wallet: { balance: 20 }, commissionRate: 10 } });

        const { result, rerender } = renderHook(({ id }) => useEscrowStatus(id), {
            initialProps: { id: "conn-a" },
        });

        await waitFor(() => expect(result.current.fetching).toBe(false));
        expect(result.current.walletBalance).toBe(10);

        rerender({ id: "conn-b" });

        await waitFor(() => expect(result.current.walletBalance).toBe(20));
        expect(axiosInstance.get).toHaveBeenCalledTimes(2);
    });
});