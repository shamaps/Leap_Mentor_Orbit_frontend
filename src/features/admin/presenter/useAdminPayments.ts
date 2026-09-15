// src/features/admin/presenter/useAdminPayments.js
import { useState, useEffect, useCallback, useRef } from "react";
import { getPaymentStats, getPaymentChart, getPaymentTransactions } from "../model/admin.api";
import { useToast } from "@/shared/context/ToastContext";

export const useAdminPayments = () => {
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ totalCount: 0, currentPage: 1, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { showToast } = useToast();

  const fetchStats = useCallback(async () => {
    try {
      const res = await getPaymentStats();
      setStats(res.data);
    } catch {
      showToast({ message: "Failed to load payment stats.", type: "error" });
    }
  }, [showToast]);

  const fetchChart = useCallback(async () => {
    try {
      setLoadingChart(true);
      const res = await getPaymentChart();
      setChartData(res.data || []);
    } catch {
      showToast({ message: "Failed to load chart.", type: "error" });
    } finally {
      setLoadingChart(false);
    }
  }, [showToast]);

  const fetchTransactions = useCallback(async (targetPage = 1, query = search, filterType = typeFilter) => {
    try {
      setLoading(true);
      const queryParams: { page: number; limit: number; search?: string; type?: string } = { page: targetPage, limit: 15 };
      if (query) queryParams.search = query;
      if (filterType) queryParams.type = filterType;

      const res = await getPaymentTransactions(queryParams);
      setTransactions(res.data.transactions || []);
      setPagination(res.data.pagination);
    } catch {
      showToast({ message: "Failed to load transactions.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, showToast]);

  useEffect(() => {
    fetchStats();
    fetchChart();
    fetchTransactions();
  }, [fetchStats, fetchChart]);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchTransactions(1, val, typeFilter), 400);
  };

  const handleTypeFilter = (type: string) => {
    setTypeFilter(type);
    fetchTransactions(1, search, type);
  };

  return {
    stats,
    chartData,
    transactions,
    pagination,
    search,
    typeFilter,
    loading,
    loadingChart,
    fetchTransactions,
    handleSearch,
    handleTypeFilter,
  };
};