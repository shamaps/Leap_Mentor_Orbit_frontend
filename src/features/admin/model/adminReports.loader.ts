// src/features/admin/model/adminReports.loader.ts

import { getReportStats, getReports } from "./admin.api";
import logger from "@/shared/utils/logger";

export const adminReportsLoader = async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const search = url.searchParams.get("search") ?? "";
    const status = url.searchParams.get("status") ?? "";

    const queryParams: { page: number; limit: number; search?: string; status?: string } = { page, limit: 10 };
    if (search) queryParams.search = search;
    if (status) queryParams.status = status;

    const [reportsResult, statsResult] = await Promise.allSettled([
        getReports(queryParams),
        getReportStats(),
    ]);

    let error: string | null = null;
    let reports: any[] = [];
    let pagination = { totalCount: 0, currentPage: 1, totalPages: 1 };
    if (reportsResult.status === "fulfilled") {
        reports = reportsResult.value.data.reports || [];
        pagination = reportsResult.value.data.pagination;
    } else {
        error = "Failed to load reports.";
    }

    if (statsResult.status === "rejected") {
        logger.warn("Failed to fetch report stats", { err: statsResult.reason });
    }

    return {
        reports,
        pagination,
        stats: statsResult.status === "fulfilled" ? statsResult.value.data : null,
        error,
    };
};