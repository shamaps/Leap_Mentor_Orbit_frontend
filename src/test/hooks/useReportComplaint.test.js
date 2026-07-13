// src/test/hooks/useReportComplaint.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import axiosInstance from "../../utils/axiosInstance";
import useReportComplaint from "../../hooks/useReportComplaint";

vi.mock("../../utils/axiosInstance");

const payload = {
    complaintType: "harassment",
    description: "Something happened",
    screenshot: null,
};

describe("useReportComplaint", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns success: false immediately when connectRequestId is missing", async () => {
        const { result } = renderHook(() => useReportComplaint(null));

        let res;
        await act(async () => {
            res = await result.current.submitReport(payload);
        });

        expect(res).toEqual({ success: false });
        expect(axiosInstance.post).not.toHaveBeenCalled();
    });

    it("submits the report with multipart form data (no screenshot)", async () => {
        axiosInstance.post.mockResolvedValue({});

        const { result } = renderHook(() => useReportComplaint("conn-1"));

        let res;
        await act(async () => {
            res = await result.current.submitReport(payload);
        });

        expect(res).toEqual({ success: true });
        expect(axiosInstance.post).toHaveBeenCalledWith(
            "/reports",
            expect.any(FormData),
            { headers: { "Content-Type": "multipart/form-data" } },
        );

        const formData = axiosInstance.post.mock.calls[0][1];
        expect(formData.get("connectRequestId")).toBe("conn-1");
        expect(formData.get("complaintType")).toBe("harassment");
        expect(formData.get("description")).toBe("Something happened");
        expect(formData.has("screenshot")).toBe(false);

        expect(result.current.submitting).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it("appends the screenshot to form data when provided", async () => {
        axiosInstance.post.mockResolvedValue({});
        const file = new File(["data"], "shot.png", { type: "image/png" });

        const { result } = renderHook(() => useReportComplaint("conn-2"));

        await act(async () => {
            await result.current.submitReport({ ...payload, screenshot: file });
        });

        const formData = axiosInstance.post.mock.calls[0][1];
        expect(formData.get("screenshot")).toBe(file);
    });

    it("sets a fallback error message when the API fails without a response message", async () => {
        axiosInstance.post.mockRejectedValue({});

        const { result } = renderHook(() => useReportComplaint("conn-3"));

        let res;
        await act(async () => {
            res = await result.current.submitReport(payload);
        });

        expect(res).toEqual({
            success: false,
            message: "Failed to submit report. Please try again.",
        });
        expect(result.current.error).toBe("Failed to submit report. Please try again.");
        expect(result.current.submitting).toBe(false);
    });

    it("uses the server-provided error message when available", async () => {
        axiosInstance.post.mockRejectedValue({
            response: { data: { message: "Duplicate report." } },
        });

        const { result } = renderHook(() => useReportComplaint("conn-4"));

        let res;
        await act(async () => {
            res = await result.current.submitReport(payload);
        });

        expect(res).toEqual({ success: false, message: "Duplicate report." });
        expect(result.current.error).toBe("Duplicate report.");
    });

    it("setError can be used to manually clear/set the error", async () => {
        axiosInstance.post.mockRejectedValue({});

        const { result } = renderHook(() => useReportComplaint("conn-5"));

        await act(async () => {
            await result.current.submitReport(payload);
        });
        expect(result.current.error).not.toBeNull();

        act(() => {
            result.current.setError(null);
        });

        expect(result.current.error).toBeNull();
    });
});