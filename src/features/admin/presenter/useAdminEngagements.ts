// src/features/admin/presenter/useAdminEngagements.js
import { useState, useCallback, useRef, useEffect } from "react";
import { useLoaderData, useSearchParams, useNavigation } from "react-router-dom";
import { useToast } from "@/shared/context/ToastContext";
import type { AdminEngagement, AdminStats } from "../model/admin.types";
import { applyParamUpdates } from "@/shared/utils/searchParams";
type EngagementParamUpdates = {
  page?: number;
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
};
export const useAdminEngagements = () => {
  // Initial (and every subsequent filter/page) fetch is done by
  // adminEngagementsLoader — see App.tsx's "/admin/engagements" route.
  const { engagements, pagination, stats, error } = useLoaderData() as {
    engagements: AdminEngagement[];
    pagination: { total: number; page: number; totalPages: number };
    stats: AdminStats | null;
    error: string | null;
  };
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const { showToast } = useToast();

  const search = searchParams.get("search") ?? "";
  const statusFilter = searchParams.get("status") ?? "";
  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const loading = navigation.state !== "idle";

  const [searchInput, setSearchInput] = useState(search);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (error) showToast({ message: error, type: "error" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const updateParams = useCallback(
    (next: EngagementParamUpdates) => {
      setSearchParams(applyParamUpdates(searchParams, next));
    },
    [searchParams, setSearchParams],
  );

  const fetchEngagements = useCallback(
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

  const handleDateFilter = (from: string, to: string) => {
    updateParams({ page: 1, dateFrom: from, dateTo: to });
  };

  const toggleExpand = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

  return {
    stats,
    engagements,
    pagination,
    search: searchInput,
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