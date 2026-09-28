// src/hooks/useRequestHistory.js
import { useState, useEffect, useCallback } from "react";
import { getMyConnectRequests, deleteConnectRequest } from "@/features/mentee/model/menteeEngagement.api";
import logger from "@/shared/utils/logger";
import getErrorMessage from "@/shared/utils/getErrorMessage";
import type { RawConnectRequest } from "@/features/connects/model/connectRequestMapper";

export type ConnectRequestSummary = RawConnectRequest;

const useRequestHistory = () => {
  const [requests, setRequests] = useState<ConnectRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [selected, setSelected] = useState<ConnectRequestSummary | null>(null);

  // ── Fetch all requests ──────────────────────────────────────
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getMyConnectRequests();
      setRequests(res.data.requests || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load requests."));
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // ── Delete / cancel a request ───────────────────────────────
  const deleteRequest = useCallback(async (id: string) => {
    try {
      await deleteConnectRequest(id);
      setRequests((prev) => prev.filter((r) => r._id !== id));
      setSelected((prev) => (prev?._id === id ? null : prev));
    } catch (err) {
      logger.error("Delete error", {
        message: getErrorMessage(err),
      });
    }
  }, []);

  // ── Update a single request in place ───────────────────────
  const updateRequest = useCallback((id: string, patch: Partial<ConnectRequestSummary>) => {
    setRequests((prev) =>
      prev.map((r) => (r._id === id ? { ...r, ...patch } : r)),
    );
    setSelected((prev) => (prev?._id === id ? { ...prev, ...patch } : prev));
  }, []);

  // ── Filtered list ───────────────────────────────────────────
  const filtered =
    activeTab === "all"
      ? requests
      : requests.filter((r) => r.status === activeTab);

  // ── Tab counts ──────────────────────────────────────────────
  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    accepted: requests.filter((r) => r.status === "accepted").length,
    ongoing: requests.filter((r) => r.status === "ongoing").length,
    completed: requests.filter((r) => r.status === "completed").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
    referred: requests.filter((r) => r.status === "referred").length,
  };

  return {
    requests,
    filtered,
    counts,
    loading: loading && initialLoad,
    error,
    activeTab,
    setActiveTab,
    selected,
    setSelected,
    deleteRequest,
    updateRequest,
    fetchRequests,
  };
};

export default useRequestHistory;