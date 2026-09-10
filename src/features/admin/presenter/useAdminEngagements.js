// src/features/admin/presenter/useAdminEngagements.js
import { useState, useEffect, useCallback, useRef } from "react";
import { getEngagementStats, getEngagements } from "../model/admin.api";
import { useToast } from "@/shared/context/ToastContext";

export const useAdminEngagements = () => {
  const [stats, setStats] = useState(null);
  const [engagements, setEngagements] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const searchTimer = useRef(null);
  const { showToast } = useToast();

  // ── Fetch stats ───────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await getEngagementStats();
      setStats(res.data);
    } catch { showToast({ message: "Failed to load stats.", type: "error" }); }
  }, []);

  // ── Fetch engagements ─────────────────────────────────────
  const fetchEngagements = useCallback(async (
    page = 1,
    q = search,
    status = statusFilter,
    from = dateFrom,
    to = dateTo,
  ) => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (q) params.search = q;
      if (status) params.status = status;
      if (from) params.dateFrom = from;
      if (to) params.dateTo = to;
      const res = await getEngagements(params);
      setEngagements(res.data.engagements);
      setPagination(res.data.pagination);
    } catch {
      showToast({ type: "error", message: "Failed to load engagements." });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, dateFrom, dateTo]);

  useEffect(() => { fetchStats(); fetchEngagements(); }, []);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchEngagements(1, val, statusFilter, dateFrom, dateTo), 400);
  };

  const handleStatusFilter = (s) => {
    setStatusFilter(s);
    fetchEngagements(1, search, s, dateFrom, dateTo);
  };

  const handleDateFilter = (from, to) => {
    setDateFrom(from);
    setDateTo(to);
    fetchEngagements(1, search, statusFilter, from, to);
  };

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return {
    stats,
    engagements,
    pagination,
    search,
    statusFilter,
    dateFrom,
    dateTo,
    loading,
    expandedId,
    fetchEngagements,
    handleSearch,
    handleStatusFilter,
    handleDateFilter,
    toggleExpand,
  };
};
