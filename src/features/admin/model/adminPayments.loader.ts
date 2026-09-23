// src/features/admin/model/adminPayments.loader.ts
//

import { getPaymentStats, getPaymentChart, getPaymentTransactions } from "./admin.api";
import logger from "@/shared/utils/logger";

export const adminPaymentsLoader = async ({ request }: { request: Request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const search = url.searchParams.get("search") ?? "";
    const type = url.searchParams.get("type") ?? "";

    const queryParams: { page: number; limit: number; search?: string; type?: string } = { page, limit: 15 };
    if (search) queryParams.search = search;
    if (type) queryParams.type = type;

    const [transactionsResult, statsResult, chartResult] = await Promise.allSettled([
        getPaymentTransactions(queryParams),
        getPaymentStats(),
        getPaymentChart(),
    ]);

    let error: string | null = null;
    let transactions: any[] = [];
    let pagination = { totalCount: 0, currentPage: 1, totalPages: 1 };
    if (transactionsResult.status === "fulfilled") {
        transactions = transactionsResult.value.data.transactions || [];
        pagination = transactionsResult.value.data.pagination;
    } else {
        error = "Failed to load transactions.";
    }

    if (statsResult.status === "rejected") {
        logger.warn("Failed to fetch payment stats", { err: statsResult.reason });
    }
    if (chartResult.status === "rejected") {
        logger.warn("Failed to fetch payment chart", { err: chartResult.reason });
    }

    return {
        transactions,
        pagination,
        stats: statsResult.status === "fulfilled" ? statsResult.value.data : null,
        chartData: chartResult.status === "fulfilled" ? (chartResult.value.data || []) : [],
        error,
    };
};