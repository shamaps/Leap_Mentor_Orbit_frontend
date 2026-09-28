// src/test/loaders/admin/adminSettings.loader.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminSettingsLoader } from "@/features/admin/model/adminSettings.loader";
import { getCommissionSettings } from "@/features/admin/model/admin.api";

vi.mock("@/features/admin/model/admin.api", () => ({
    getCurrentAdmin: vi.fn().mockResolvedValue({ data: {} }),
    getCommissionSettings: vi.fn(),
}));

describe("adminSettingsLoader", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns the commission rate with no error on success", async () => {
        getCommissionSettings.mockResolvedValue({ data: { commissionRate: 12.5 } });

        const result = await adminSettingsLoader();

        expect(result).toEqual({ commissionRate: 12.5, error: null });
    });

    it("returns a null commission rate and an error message when the request fails", async () => {
        getCommissionSettings.mockRejectedValue(new Error("network error"));

        const result = await adminSettingsLoader();

        expect(result).toEqual({ commissionRate: null, error: "Failed to load settings." });
    });

    it("returns the same error message regardless of the underlying failure reason", async () => {
        getCommissionSettings.mockRejectedValue({ response: { status: 500 } });

        const result = await adminSettingsLoader();

        expect(result.commissionRate).toBeNull();
        expect(result.error).toBe("Failed to load settings.");
    });
});