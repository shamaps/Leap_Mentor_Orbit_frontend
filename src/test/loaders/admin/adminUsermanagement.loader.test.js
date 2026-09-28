// src/test/loaders/admin/adminUserManagement.loader.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminUserManagementLoader } from "@/features/admin/model/adminUserManagement.loader";
import {
    getUsers,
    getUserStats,
    getUserGrowthData,
    getMentorIndustryStats,
} from "@/features/admin/model/admin.api";
import logger from "@/shared/utils/logger";

vi.mock("@/features/admin/model/admin.api", () => ({
    getCurrentAdmin: vi.fn().mockResolvedValue({ data: {} }),
    getUsers: vi.fn(),
    getUserStats: vi.fn(),
    getUserGrowthData: vi.fn(),
    getMentorIndustryStats: vi.fn(),
}));

vi.mock("@/shared/utils/logger", () => ({
    default: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const makeRequest = (search = "") =>
    new Request(`https://app.test/admin/users${search}`);

const usersOk = (overrides = {}) => ({
    data: { users: [], pagination: { total: 0, page: 1, totalPages: 1 }, ...overrides },
});

describe("adminUserManagementLoader", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Happy-path defaults for the three "extra" calls; individual tests
        // override one at a time to exercise each rejection branch.
        getUserStats.mockResolvedValue({ data: { total: 0 } });
        getUserGrowthData.mockResolvedValue({ data: [] });
        getMentorIndustryStats.mockResolvedValue({ data: [] });
    });

    it("builds params with defaults and omits search/role/deleted when absent", async () => {
        getUsers.mockResolvedValue(usersOk());

        await adminUserManagementLoader({ request: makeRequest() });

        expect(getUsers).toHaveBeenCalledWith({ page: 1, limit: 15 });
    });

    it("forwards page, search, role and deleted=true when present in the URL", async () => {
        getUsers.mockResolvedValue(usersOk());

        await adminUserManagementLoader({
            request: makeRequest("?page=3&search=amy&role=mentor&deleted=true"),
        });

        expect(getUsers).toHaveBeenCalledWith({
            page: 3,
            limit: 15,
            search: "amy",
            role: "mentor",
            deleted: true,
        });
    });

    it("does not set deleted when the query param is present but not 'true'", async () => {
        getUsers.mockResolvedValue(usersOk());

        await adminUserManagementLoader({ request: makeRequest("?deleted=false") });

        expect(getUsers).toHaveBeenCalledWith({ page: 1, limit: 15 });
    });

    it("returns users, pagination, stats, growth and industry data when everything succeeds", async () => {
        const users = [{ id: "u1" }];
        const pagination = { total: 1, page: 1, totalPages: 1 };
        getUsers.mockResolvedValue(usersOk({ users, pagination }));
        getUserStats.mockResolvedValue({ data: { total: 42 } });
        getUserGrowthData.mockResolvedValue({ data: [{ month: "Jan", count: 5 }] });
        getMentorIndustryStats.mockResolvedValue({ data: [{ industry: "Tech", count: 3 }] });

        const result = await adminUserManagementLoader({ request: makeRequest() });

        expect(result).toEqual({
            users,
            pagination,
            stats: { total: 42 },
            growthData: [{ month: "Jan", count: 5 }],
            industryData: [{ industry: "Tech", count: 3 }],
            error: null,
        });
    });

    // Line 34: users request rejected -> generic error, empty users/pagination defaults.
    it("sets an error and default users/pagination when the users request fails", async () => {
        getUsers.mockRejectedValue(new Error("users down"));

        const result = await adminUserManagementLoader({ request: makeRequest() });

        expect(result.error).toBe("Failed to load users.");
        expect(result.users).toEqual([]);
        expect(result.pagination).toEqual({ total: 0, page: 1, totalPages: 1 });
    });

    // Line 38: stats request rejected -> warn logged, stats null, everything else unaffected.
    it("logs a warning and returns null stats when the user stats request fails", async () => {
        getUsers.mockResolvedValue(usersOk());
        const statsError = new Error("stats down");
        getUserStats.mockRejectedValue(statsError);

        const result = await adminUserManagementLoader({ request: makeRequest() });

        expect(logger.warn).toHaveBeenCalledWith(
            "Failed to fetch user stats",
            expect.objectContaining({ err: statsError }),
        );
        expect(result.stats).toBeNull();
        expect(result.error).toBeNull();
    });

    // Line 41: growth request rejected -> warn logged, growthData falls back to [].
    it("logs a warning and returns an empty growthData array when the growth request fails", async () => {
        getUsers.mockResolvedValue(usersOk());
        const growthError = new Error("growth down");
        getUserGrowthData.mockRejectedValue(growthError);

        const result = await adminUserManagementLoader({ request: makeRequest() });

        expect(logger.warn).toHaveBeenCalledWith(
            "Failed to fetch user growth data",
            expect.objectContaining({ err: growthError }),
        );
        expect(result.growthData).toEqual([]);
        expect(result.error).toBeNull();
    });

    // Line 44: industry request rejected -> warn logged, industryData falls back to [].
    it("logs a warning and returns an empty industryData array when the industry request fails", async () => {
        getUsers.mockResolvedValue(usersOk());
        const industryError = new Error("industry down");
        getMentorIndustryStats.mockRejectedValue(industryError);

        const result = await adminUserManagementLoader({ request: makeRequest() });

        expect(logger.warn).toHaveBeenCalledWith(
            "Failed to fetch mentor industry stats",
            expect.objectContaining({ err: industryError }),
        );
        expect(result.industryData).toEqual([]);
        expect(result.error).toBeNull();
    });

    it("falls back to an empty array when a successful growth/industry response has no data", async () => {
        getUsers.mockResolvedValue(usersOk());
        getUserGrowthData.mockResolvedValue({ data: null });
        getMentorIndustryStats.mockResolvedValue({ data: null });

        const result = await adminUserManagementLoader({ request: makeRequest() });

        expect(result.growthData).toEqual([]);
        expect(result.industryData).toEqual([]);
    });

    it("logs independent warnings and still returns a fully-populated users result when all three secondary requests fail", async () => {
        const users = [{ id: "u1" }];
        const pagination = { total: 1, page: 1, totalPages: 1 };
        getUsers.mockResolvedValue(usersOk({ users, pagination }));
        getUserStats.mockRejectedValue(new Error("stats down"));
        getUserGrowthData.mockRejectedValue(new Error("growth down"));
        getMentorIndustryStats.mockRejectedValue(new Error("industry down"));

        const result = await adminUserManagementLoader({ request: makeRequest() });

        expect(logger.warn).toHaveBeenCalledTimes(3);
        expect(result).toEqual({
            users,
            pagination,
            stats: null,
            growthData: [],
            industryData: [],
            error: null,
        });
    });
});