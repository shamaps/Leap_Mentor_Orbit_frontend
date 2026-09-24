// src/features/admin/presenter/useAdminReports.js
import { useState, useCallback, useRef, useEffect } from "react";
import { useLoaderData, useSearchParams, useRevalidator, useNavigation } from "react-router-dom";
import { useToast } from "@/shared/context/ToastContext";

export const useAdminReports = () => {
  // Initial (and every subsequent filter/page) fetch is done by
  // adminReportsLoader — see App.tsx's "/admin/reports" route.
  const { reports: loaderReports, pagination, stats, error } = useLoaderData() as {
    reports: any[];
    pagination: { totalCount: number; currentPage: number; totalPages: number };
    stats: any;
    error: string | null;
  };
  const [searchParams, setSearchParams] = useSearchParams();
  const revalidator = useRevalidator();
  const navigation = useNavigation();
  const { showToast } = useToast();

  const search = searchParams.get("search") ?? "";
  const statusFilter = searchParams.get("status") ?? "";
  const loading = navigation.state !== "idle";

  const [searchInput, setSearchInput] = useState(search);
  const [selected, setSelected] = useState<any>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Local copy so the optimistic updates below (handleSave/handleRefund/
  // handleDeleteSession) can update a row instantly, without waiting for
  // the revalidate() round-trip. Resyncs whenever the loader returns fresh
  // data (a filter/page change, or a revalidate()).
  const [reports, setReports] = useState(loaderReports);
  useEffect(() => {
    setReports(loaderReports);
  }, [loaderReports]);

  useEffect(() => {
    if (error) showToast({ message: error, type: "error" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const updateParams = useCallback(
    (next: { page?: number; search?: string; status?: string }) => {
      const params = new URLSearchParams(searchParams);
      if (next.page !== undefined) params.set("page", String(next.page));
      if (next.search !== undefined) {
        if (next.search) params.set("search", next.search);
        else params.delete("search");
      }
      if (next.status !== undefined) {
        if (next.status) params.set("status", next.status);
        else params.delete("status");
      }
      setSearchParams(params);
    },
    [searchParams, setSearchParams],
  );

  const fetchReports = useCallback(
    (page = 1) => updateParams({ page }),
    [updateParams],
  );

  const handleSearch = (val: string) => {
    setSearchInput(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => updateParams({ page: 1, search: val }), 400);
  };

  const handleStatusFilter = (s: string) => {
    updateParams({ page: 1, status: s });
  };

  const handleSave = (id: string, updated: any) => {
    setReports((prev) => prev.map((r) => r.id.toString() === id.toString() ? { ...r, ...updated } : r));
    revalidator.revalidate();
    showToast({ message: "Report updated. Reporter has been notified. ✅" });
  };

  const handleRefund = (id: string) => {
    setReports((prev) => prev.map((r) => r.id.toString() === id.toString() ? { ...r, status: "resolved", refundProcessed: true } : r));
    revalidator.revalidate();
    showToast({ message: "Refund processed. Mentee has been notified. ✅" });
  };

  const handleDeleteSession = (id: string) => {
    setReports((prev) => prev.map((r) => r.id.toString() === id.toString() ? { ...r, status: "resolved", connectRequestId: null } : r));
    revalidator.revalidate();
    showToast({ message: "Session deleted. Both parties notified. ✅" });
  };

  return {
    stats,
    reports,
    pagination,
    search: searchInput,
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