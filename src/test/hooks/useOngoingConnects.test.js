// src/test/hooks/useOngoingConnects.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { getOngoingConnects } from "../../api/connectRequests.api";
import useOngoingConnects from "../../hooks/useOngoingConnects";

vi.mock("../../api/connectRequests.api");

describe("useOngoingConnects", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("fetches on mount and splits connects into ongoing and completed", async () => {
        getOngoingConnects.mockResolvedValue({
            connects: [
                { id: 1, status: "ongoing" },
                { id: 2, status: "completed" },
                { id: 3, status: "ongoing" },
            ],
        });

        const { result } = renderHook(() => useOngoingConnects());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.ongoing).toEqual([
            { id: 1, status: "ongoing" },
            { id: 3, status: "ongoing" },
        ]);
        expect(result.current.completed).toEqual([{ id: 2, status: "completed" }]);
        expect(result.current.connects).toBe(result.current.ongoing);
        expect(result.current.error).toBeNull();
    });

    it("defaults to empty lists when connects is missing from the response", async () => {
        getOngoingConnects.mockResolvedValue({});

        const { result } = renderHook(() => useOngoingConnects());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.ongoing).toEqual([]);
        expect(result.current.completed).toEqual([]);
    });

    it("sets a fallback error message when the API fails without a response message", async () => {
        getOngoingConnects.mockRejectedValue({});

        const { result } = renderHook(() => useOngoingConnects());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toBe("Failed to load connects.");
    });

    it("uses the server-provided error message when available", async () => {
        getOngoingConnects.mockRejectedValue({
            response: { data: { message: "Server exploded." } },
        });

        const { result } = renderHook(() => useOngoingConnects());

        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toBe("Server exploded.");
    });

    it("refetch re-invokes getOngoingConnects and updates state", async () => {
        getOngoingConnects
            .mockResolvedValueOnce({ connects: [{ id: 1, status: "ongoing" }] })
            .mockResolvedValueOnce({ connects: [{ id: 2, status: "completed" }] });

        const { result } = renderHook(() => useOngoingConnects());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.ongoing).toEqual([{ id: 1, status: "ongoing" }]);

        await act(async () => {
            await result.current.refetch();
        });

        expect(result.current.completed).toEqual([{ id: 2, status: "completed" }]);
        expect(getOngoingConnects).toHaveBeenCalledTimes(2);
    });
});