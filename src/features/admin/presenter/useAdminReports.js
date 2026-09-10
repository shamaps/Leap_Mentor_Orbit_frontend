// src/features/admin/presenter/useAdminReports.js
import { useState, useEffect, useCallback, useRef } from "react";
import { getReportStats, getReports } from "../model/admin.api";
import { useToast } from "@/shared/context/ToastContext";

export const useAdminReports = () => {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ totalCount: 0, currentPage: 1, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const searchTimer = useRef(null);

  const { showToast } = useToast();

  const fetchStats = useCallback(async () => {
    try {
      const res = await getReportStats();
      setStats(res.data);
    } catch {
      showToast({ message: "Failed to load stats.", type: "error" });
    }
  }, [showToast]);

  const fetchReports = useCallback(async (targetPage = 1, currentQuery = search, activeStatus = statusFilter) => {
    try {
      setLoading(true);
      const queryParams = { page: targetPage, limit: 10 };
      if (currentQuery) queryParams.search = currentQuery;
      if (activeStatus) queryParams.status = activeStatus;

      const res = await getReports(queryParams);
      setReports(res.data.reports || []);
      setPagination(res.data.pagination);
    } catch {
      showToast({ type: "error", message: "Failed to update report" });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, showToast]);

  useEffect(() => {
    fetchStats();
    fetchReports();
  }, [fetchStats]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchReports(1, val, statusFilter), 400);
  };

  const handleStatusFilter = (s) => {
    setStatusFilter(s);
    fetchReports(1, search, s);
  };

  const handleSave = (id, updated) => {
    setReports((prev) => prev.map((r) => r.id.toString() === id.toString() ? { ...r, ...updated } : r));
    fetchStats();
    showToast({ message: "Report updated. Reporter has been notified. ✅" });
  };

  const handleRefund = (id) => {
    setReports((prev) => prev.map((r) => r.id.toString() === id.toString() ? { ...r, status: "resolved", refundProcessed: true } : r));
    fetchStats();
    showToast({ message: "Refund processed. Mentee has been notified. ✅" });
  };

  const handleDeleteSession = (id) => {
    setReports((prev) => prev.map((r) => r.id.toString() === id.toString() ? { ...r, status: "resolved", connectRequestId: null } : r));
    fetchStats();
    showToast({ message: "Session deleted. Both parties notified. ✅" });
  };

  return {
    stats,
    reports,
    pagination,
    search,
    statusFilter,
    loading,
    selected,
    setSelected,
    fetchReports,
    handleSearch,
    handleStatusFilter,
    handleSave,
    handleRefund,
    handleDeleteSession,
  };
};
