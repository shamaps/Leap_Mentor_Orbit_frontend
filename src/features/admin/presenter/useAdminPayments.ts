// src/features/admin/presenter/useAdminPayments.js
import { useState, useCallback, useRef, useEffect } from "react";
import { useLoaderData, useSearchParams, useNavigation } from "react-router-dom";
import { useToast } from "@/shared/context/ToastContext";

export const useAdminPayments = () => {
  // Initial (and every subsequent filter/page) fetch is done by
  // adminPaymentsLoader — see App.tsx's "/admin/payments" route.
  const { transactions, pagination, stats, chartData, error } = useLoaderData() as {
    transactions: any[];
    pagination: { totalCount: number; currentPage: number; totalPages: number };
    stats: any;
    chartData: any[];
    error: string | null;
  };
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const { showToast } = useToast();

  const search = searchParams.get("search") ?? "";
  const typeFilter = searchParams.get("type") ?? "";
  const loading = navigation.state !== "idle";
  // No separate chart loading state anymore — the loader resolves both
  // together, so there's no "table ready, chart still spinning" gap.
  const loadingChart = loading;

  const [searchInput, setSearchInput] = useState(search);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (error) showToast({ message: error, type: "error" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const updateParams = useCallback(
    (next: { page?: number; search?: string; type?: string }) => {
      const params = new URLSearchParams(searchParams);
      if (next.page !== undefined) params.set("page", String(next.page));
      if (next.search !== undefined) {
        if (next.search) params.set("search", next.search);
        else params.delete("search");
      }
      if (next.type !== undefined) {
        if (next.type) params.set("type", next.type);
        else params.delete("type");
      }
      setSearchParams(params);
    },
    [searchParams, setSearchParams],
  );

  const fetchTransactions = useCallback(
    (page = 1) => updateParams({ page }),
    [updateParams],
  );

  const handleSearch = (val: string) => {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => updateParams({ page: 1, search: val }), 400);
  };

  const handleTypeFilter = (type: string) => {
    updateParams({ page: 1, type });
  };

  return {
    stats,
    chartData,
    transactions,
    pagination,
    search: searchInput,
    typeFilter,
    loading,
    loadingChart,
    fetchTransactions,
    handleSearch,
    handleTypeFilter,
  };
};