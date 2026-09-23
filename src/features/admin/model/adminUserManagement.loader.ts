// src/features/admin/model/adminUserManagement.loader.ts
import { getUserStats, getUserGrowthData, getMentorIndustryStats, getUsers } from "./admin.api";
import logger from "@/shared/utils/logger";

export const adminUserManagementLoader = async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const search = url.searchParams.get("search") ?? "";
    const role = url.searchParams.get("role") ?? "";
    const deleted = url.searchParams.get("deleted") === "true";

    const params: { page: number; limit: number; search?: string; role?: string; deleted?: boolean } = {
        page,
        limit: 15,
    };
    if (search) params.search = search;
    if (role) params.role = role;
    if (deleted) params.deleted = true;

    const [usersResult, statsResult, growthResult, industryResult] = await Promise.allSettled([
        getUsers(params),
        getUserStats(),
        getUserGrowthData(),
        getMentorIndustryStats(),
    ]);

    let error: string | null = null;
    let users: any[] = [];
    let pagination = { total: 0, page: 1, totalPages: 1 };
    if (usersResult.status === "fulfilled") {
        users = usersResult.value.data.users;
        pagination = usersResult.value.data.pagination;
    } else {
        error = "Failed to load users.";
    }

    if (statsResult.status === "rejected") {
        logger.warn("Failed to fetch user stats", { err: statsResult.reason });
    }
    if (growthResult.status === "rejected") {
        logger.warn("Failed to fetch user growth data", { err: growthResult.reason });
    }
    if (industryResult.status === "rejected") {
        logger.warn("Failed to fetch mentor industry stats", { err: industryResult.reason });
    }

    return {
        users,
        pagination,
        stats: statsResult.status === "fulfilled" ? statsResult.value.data : null,
        growthData: growthResult.status === "fulfilled" ? (growthResult.value.data || []) : [],
        industryData: industryResult.status === "fulfilled" ? (industryResult.value.data || []) : [],
        error,
    };
};
