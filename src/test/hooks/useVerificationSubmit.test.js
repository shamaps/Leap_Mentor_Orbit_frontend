// src/test/hooks/useVerificationSubmit.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import axiosInstance from "../../utils/axiosInstance";
import { useVerificationSubmit } from "../../hooks/useVerificationSubmit";

vi.mock("../../utils/axiosInstance");

const makePayload = (overrides = {}) => ({
    phoneNumber: "  9876543210  ",
    resumeFile: new File(["resume"], "resume.pdf", { type: "application/pdf" }),
    workExperienceFiles: [
        new File(["exp1"], "exp1.pdf", { type: "application/pdf" }),
        new File(["exp2"], "exp2.pdf", { type: "application/pdf" }),
    ],
    ...overrides,
});

describe("useVerificationSubmit", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("has correct initial state", () => {
        const { result } = renderHook(() => useVerificationSubmit());

        expect(result.current.loading).toBe(false);
        expect(result.current.msg).toEqual({ type: "", text: "" });
    });

    it("submits trimmed phone number, resume, and each work experience file", async () => {
        axiosInstance.post.mockResolvedValue({});

        const { result } = renderHook(() => useVerificationSubmit());
        const payload = makePayload();

        let res;
        await act(async () => {
            res = await result.current.submitVerification(payload);
        });

        expect(res).toEqual({ success: true });
        expect(axiosInstance.post).toHaveBeenCalledWith(
            "/upload/verification-documents",
            expect.any(FormData),
        );

        const formData = axiosInstance.post.mock.calls[0][1];
        expect(formData.get("phoneNumber")).toBe("9876543210");
        expect(formData.get("resume")).toBe(payload.resumeFile);
        expect(formData.getAll("workExperienceDocs")).toEqual(payload.workExperienceFiles);

        expect(result.current.loading).toBe(false);
        expect(result.current.msg).toEqual({ type: "", text: "" });
    });

    it("handles an empty workExperienceFiles array without appending any docs", async () => {
        axiosInstance.post.mockResolvedValue({});

        const { result } = renderHook(() => useVerificationSubmit());
        const payload = makePayload({ workExperienceFiles: [] });

        await act(async () => {
            await result.current.submitVerification(payload);
        });

        const formData = axiosInstance.post.mock.calls[0][1];
        expect(formData.getAll("workExperienceDocs")).toEqual([]);
    });

    it("sets a fallback error message when the API fails without a response message", async () => {
        axiosInstance.post.mockRejectedValue({});

        const { result } = renderHook(() => useVerificationSubmit());

        let res;
        await act(async () => {
            res = await result.current.submitVerification(makePayload());
        });

        expect(res).toEqual({ success: false });
        expect(result.current.msg).toEqual({
            type: "error",
            text: "Failed to submit documents. Please try again.",
        });
        expect(result.current.loading).toBe(false);
    });

    it("uses the server-provided error message when available", async () => {
        axiosInstance.post.mockRejectedValue({
            response: { data: { message: "Invalid phone number." } },
        });

        const { result } = renderHook(() => useVerificationSubmit());

        let res;
        await act(async () => {
            res = await result.current.submitVerification(makePayload());
        });

        expect(res).toEqual({ success: false });
        expect(result.current.msg).toEqual({
            type: "error",
            text: "Invalid phone number.",
        });
    });

    it("resets msg to empty at the start of a new submission", async () => {
        axiosInstance.post
            .mockRejectedValueOnce({})
            .mockResolvedValueOnce({});

        const { result } = renderHook(() => useVerificationSubmit());

        await act(async () => {
            await result.current.submitVerification(makePayload());
        });
        expect(result.current.msg.type).toBe("error");

        await act(async () => {
            await result.current.submitVerification(makePayload());
        });
        expect(result.current.msg).toEqual({ type: "", text: "" });
    });
});