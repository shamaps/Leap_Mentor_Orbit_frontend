// src/test/loaders/admin/adminVerifications.loader.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminVerificationsLoader } from "@/features/admin/model/adminVerifications.loader";
import { getMentorVerifications } from "@/features/admin/model/admin.api";

vi.mock("@/features/admin/model/admin.api", () => ({
    getCurrentAdmin: vi.fn().mockResolvedValue({ data: {} }),
    getMentorVerifications: vi.fn(),
}));

describe("adminVerificationsLoader", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns data.mentors when the response wraps mentors in a mentors field", async () => {
        const mentors = [{ id: "m1" }, { id: "m2" }];
        getMentorVerifications.mockResolvedValue({ data: { mentors } });

        const result = await adminVerificationsLoader();

        expect(result).toEqual({ mentors, error: null });
    });

    it("falls back to the raw data array when there is no mentors field", async () => {
        const mentors = [{ id: "m1" }];
        getMentorVerifications.mockResolvedValue({ data: mentors });

        const result = await adminVerificationsLoader();

        expect(result).toEqual({ mentors, error: null });
    });

    it("returns an empty mentors array and an error message when the request fails", async () => {
        getMentorVerifications.mockRejectedValue(new Error("network down"));

        const result = await adminVerificationsLoader();

        expect(result).toEqual({ mentors: [], error: "Failed to load verifications." });
    });
});