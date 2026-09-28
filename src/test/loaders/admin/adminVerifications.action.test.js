// src/test/loaders/admin/adminVerifications.action.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminVerificationsAction } from "@/features/admin/model/adminVerifications.action";
import { verifyMentor } from "@/features/admin/model/admin.api";

vi.mock("@/features/admin/model/admin.api", () => ({
    getCurrentAdmin: vi.fn().mockResolvedValue({ data: {} }),
    verifyMentor: vi.fn(),
}));

const makeRequest = (fields) => {
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined) formData.append(key, value);
    });
    return { formData: () => Promise.resolve(formData) };
};

describe("adminVerificationsAction", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns an error without calling verifyMentor when mentorProfileId is missing", async () => {
        const request = makeRequest({});

        const result = await adminVerificationsAction({ request });

        expect(result).toEqual({ success: false, error: "Missing mentor profile id." });
        expect(verifyMentor).not.toHaveBeenCalled();
    });

    it("returns an error when mentorProfileId is an empty string", async () => {
        const request = makeRequest({ mentorProfileId: "" });

        const result = await adminVerificationsAction({ request });

        expect(result).toEqual({ success: false, error: "Missing mentor profile id." });
        expect(verifyMentor).not.toHaveBeenCalled();
    });

    it("verifies the mentor and returns success with the id on success", async () => {
        verifyMentor.mockResolvedValue({ data: { ok: true } });
        const request = makeRequest({ mentorProfileId: "mp-123" });

        const result = await adminVerificationsAction({ request });

        expect(verifyMentor).toHaveBeenCalledWith("mp-123");
        expect(result).toEqual({ success: true, mentorProfileId: "mp-123" });
    });

    it("returns the API's error message when verification fails with a response body", async () => {
        verifyMentor.mockRejectedValue({
            response: { data: { message: "Mentor already verified." } },
        });
        const request = makeRequest({ mentorProfileId: "mp-123" });

        const result = await adminVerificationsAction({ request });

        expect(result).toEqual({ success: false, error: "Mentor already verified." });
    });

    it("falls back to a generic error message when the failure has no response body", async () => {
        verifyMentor.mockRejectedValue(new Error("network down"));
        const request = makeRequest({ mentorProfileId: "mp-123" });

        const result = await adminVerificationsAction({ request });

        expect(result).toEqual({ success: false, error: "Verification failed." });
    });
});