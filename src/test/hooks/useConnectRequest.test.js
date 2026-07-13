// src/test/hooks/useConnectRequest.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { sendConnectRequest } from "../../api/connectRequests.api";
import useConnectRequest from "../../hooks/useConnectRequest";

vi.mock("../../api/connectRequests.api");

const validPayload = {
    mentorId: "mentor-1",
    message: "hi",
    selectedSlots: [{ start: "10am" }],
    sessionRate: 500,
    sessionCount: 2,
};

describe("useConnectRequest", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns false and sets an error when no slots are selected", async () => {
        const { result } = renderHook(() => useConnectRequest());

        await act(async () => {
            const ok = await result.current.sendRequest({ ...validPayload, selectedSlots: [] });
            expect(ok).toBe(false);
        });

        expect(result.current.error).toBe(
            "Please select at least one available slot before sending.",
        );
        expect(sendConnectRequest).not.toHaveBeenCalled();
    });

    it("returns false and sets an error when selectedSlots is undefined", async () => {
        const { result } = renderHook(() => useConnectRequest());

        await act(async () => {
            const ok = await result.current.sendRequest({ ...validPayload, selectedSlots: undefined });
            expect(ok).toBe(false);
        });

        expect(result.current.error).toBe(
            "Please select at least one available slot before sending.",
        );
    });

    it("sends the request successfully and sets success true", async () => {
        sendConnectRequest.mockResolvedValue({});

        const { result } = renderHook(() => useConnectRequest());

        let ok;
        await act(async () => {
            ok = await result.current.sendRequest(validPayload);
        });

        expect(ok).toBe(true);
        expect(sendConnectRequest).toHaveBeenCalledWith({
            mentorId: "mentor-1",
            message: "hi",
            selectedSlots: validPayload.selectedSlots,
            sessionRate: 500,
            sessionCount: 2,
        });
        expect(result.current.success).toBe(true);
        expect(result.current.sending).toBe(false);
        expect(result.current.error).toBe("");
    });

    it("sets an error message and returns false when the API call fails", async () => {
        sendConnectRequest.mockRejectedValue(new Error("boom"));

        const { result } = renderHook(() => useConnectRequest());

        let ok;
        await act(async () => {
            ok = await result.current.sendRequest(validPayload);
        });

        expect(ok).toBe(false);
        expect(result.current.success).toBe(false);
        expect(result.current.sending).toBe(false);
        expect(result.current.error).not.toBe("");
    });

    it("blocks a concurrent call while a request is already in flight", async () => {
        let resolveRequest;
        sendConnectRequest.mockImplementation(
            () => new Promise((resolve) => { resolveRequest = resolve; }),
        );

        const { result } = renderHook(() => useConnectRequest());

        let firstCallPromise;
        act(() => {
            firstCallPromise = result.current.sendRequest(validPayload);
        });

        await waitFor(() => expect(result.current.sending).toBe(true));

        let secondCallResult;
        await act(async () => {
            secondCallResult = await result.current.sendRequest(validPayload);
        });

        expect(secondCallResult).toBe(false);
        expect(sendConnectRequest).toHaveBeenCalledTimes(1);

        await act(async () => {
            resolveRequest({});
            await firstCallPromise;
        });

        expect(result.current.success).toBe(true);
    });

    it("reset clears sending, success, error, and the in-flight lock", async () => {
        sendConnectRequest.mockRejectedValue(new Error("fail"));

        const { result } = renderHook(() => useConnectRequest());

        await act(async () => {
            await result.current.sendRequest(validPayload);
        });
        expect(result.current.error).not.toBe("");

        act(() => {
            result.current.reset();
        });

        expect(result.current.sending).toBe(false);
        expect(result.current.success).toBe(false);
        expect(result.current.error).toBe("");

        // in-flight lock released → a subsequent call can go through
        sendConnectRequest.mockResolvedValue({});
        let ok;
        await act(async () => {
            ok = await result.current.sendRequest(validPayload);
        });
        expect(ok).toBe(true);
    });
});