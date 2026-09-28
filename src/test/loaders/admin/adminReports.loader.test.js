// src/test/loaders/admin/adminReports.loader.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminReportsLoader } from "@/features/admin/model/adminReports.loader";
import { getReports, getReportStats } from "@/features/admin/model/admin.api";
import logger from "@/shared/utils/logger";

vi.mock("@/features/admin/model/admin.api", () => ({
    getCurrentAdmin: vi.fn().mockResolvedValue({ data: {} }),
    getReports: vi.fn(),
    getReportStats: vi.fn(),
}));

vi.mock("@/shared/utils/logger", () => ({
    default: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const makeRequest = (search = "") =>
    new Request(`https://app.test/admin/reports${search}`);

describe("adminReportsLoader", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("defaults page/search/status and omits empty filters from the query params", async () => {
        getReports.mockResolvedValue({
            data: { reports: [], pagination: { totalCount: 0, currentPage: 1, totalPages: 1 } },
        });
        getReportStats.mockResolvedValue({ data: { total: 0 } });

        await adminReportsLoader({ request: makeRequest() });

        expect(getReports).toHaveBeenCalledWith({ page: 1, limit: 10 });
    });

    it("forwards page, search and status when present in the URL", async () => {
        getReports.mockResolvedValue({
            data: { reports: [], pagination: { totalCount: 0, currentPage: 2, totalPages: 3 } },
        });
        getReportStats.mockResolvedValue({ data: { total: 0 } });

        await adminReportsLoader({
            request: makeRequest("?page=2&search=spam&status=open"),
        });

        expect(getReports).toHaveBeenCalledWith({
            page: 2,
            limit: 10,
            search: "spam",
            status: "open",
        });
    });

    it("returns reports, pagination and stats when both requests succeed", async () => {
        const reports = [{ id: "r1" }, { id: "r2" }];
        const pagination = { totalCount: 2, currentPage: 1, totalPages: 1 };
        getReports.mockResolvedValue({ data: { reports, pagination } });
        getReportStats.mockResolvedValue({ data: { open: 1, resolved: 1 } });

        const result = await adminReportsLoader({ request: makeRequest() });

        expect(result).toEqual({
            reports,
            pagination,
            stats: { open: 1, resolved: 1 },
            error: null,
        });
    });

    it("falls back to an empty reports array when the API returns no reports field", async () => {
        const pagination = { totalCount: 0, currentPage: 1, totalPages: 1 };
        getReports.mockResolvedValue({ data: { pagination } });
        getReportStats.mockResolvedValue({ data: {} });

        const result = await adminReportsLoader({ request: makeRequest() });

        expect(result.reports).toEqual([]);
    });

    it("sets a generic error and empty defaults when the reports request fails", async () => {
        getReports.mockRejectedValue(new Error("network down"));
        getReportStats.mockResolvedValue({ data: { open: 1 } });

        const result = await adminReportsLoader({ request: makeRequest() });

        expect(result.error).toBe("Failed to load reports.");
        expect(result.reports).toEqual([]);
        expect(result.pagination).toEqual({ totalCount: 0, currentPage: 1, totalPages: 1 });
        // The reports failure shouldn't block the stats data from coming through.
        expect(result.stats).toEqual({ open: 1 });
    });

    it("logs a warning and returns null stats when the stats request fails, without failing the whole loader", async () => {
        const reports = [{ id: "r1" }];
        const pagination = { totalCount: 1, currentPage: 1, totalPages: 1 };
        getReports.mockResolvedValue({ data: { reports, pagination } });
        const statsError = new Error("stats unavailable");
        getReportStats.mockRejectedValue(statsError);

        const result = await adminReportsLoader({ request: makeRequest() });

        expect(logger.warn).toHaveBeenCalledWith(
            "Failed to fetch report stats",
            expect.objectContaining({ err: statsError }),
        );
        expect(result.stats).toBeNull();
        expect(result.error).toBeNull();
        expect(result.reports).toEqual(reports);
    });

    it("sets an error and still logs the stats warning when both requests fail", async () => {
        getReports.mockRejectedValue(new Error("reports down"));
        const statsError = new Error("stats down");
        getReportStats.mockRejectedValue(statsError);

        const result = await adminReportsLoader({ request: makeRequest() });

        expect(result.error).toBe("Failed to load reports.");
        expect(result.stats).toBeNull();
        expect(logger.warn).toHaveBeenCalledWith(
            "Failed to fetch report stats",
            expect.objectContaining({ err: statsError }),
        );
    });
});