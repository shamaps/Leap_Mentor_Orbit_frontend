// src/features/admin/model/adminEngagements.loader.ts

import { getEngagementStats, getEngagements } from "./admin.api";
import logger from "@/shared/utils/logger";

export const adminEngagementsLoader = async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const search = url.searchParams.get("search") ?? "";
    const status = url.searchParams.get("status") ?? "";
    const dateFrom = url.searchParams.get("dateFrom") ?? "";
    const dateTo = url.searchParams.get("dateTo") ?? "";

    const params: { page: number; limit: number; search?: string; status?: string; dateFrom?: string; dateTo?: string } = {
        page,
        limit: 15,
    };
    if (search) params.search = search;
    if (status) params.status = status;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;

    const [engagementsResult, statsResult] = await Promise.allSettled([
        getEngagements(params),
        getEngagementStats(),
    ]);

    let error: string | null = null;
    let engagements: any[] = [];
    let pagination = { total: 0, page: 1, totalPages: 1 };
    if (engagementsResult.status === "fulfilled") {
        engagements = engagementsResult.value.data.engagements;
        pagination = engagementsResult.value.data.pagination;
    } else {
        error = "Failed to load engagements.";
    }

    if (statsResult.status === "rejected") {
        logger.warn("Failed to fetch engagement stats", { err: statsResult.reason });
    }

    return {
        engagements,
        pagination,
        stats: statsResult.status === "fulfilled" ? statsResult.value.data : null,
        error,
    };
};