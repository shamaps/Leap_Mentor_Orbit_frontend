// src/features/admin/presenter/useAdminWalletRequests.js
import { useState, useEffect, useCallback } from "react";
import { getLeapWalletRequests, approveLeapWalletRequest, rejectLeapWalletRequest } from "../model/admin.api";
import type { AdminWalletRequest } from "../model/admin.types";
import { useToast } from "@/shared/context/ToastContext";
import getErrorMessage from "@/shared/utils/getErrorMessage";
import logger from "@/shared/utils/logger";

export const useAdminWalletRequests = () => {
  const [requests, setRequests] = useState<AdminWalletRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [historyMentee, setHistoryMentee] = useState<AdminWalletRequest["mentee"] | null>(null);
  const { showToast } = useToast();

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getLeapWalletRequests();
      setRequests(res.data.requests || res.data || []);
    } catch (err) {
      logger.warn("Failed to fetch leap requests", { message: getErrorMessage(err) });
      showToast({ message: "Failed to load requests.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (reqId: string) => {
    try {
      setActionLoading(reqId);
      await approveLeapWalletRequest(reqId);
      setRequests((prev) =>
        prev.map((r) => (r._id === reqId ? { ...r, status: "approved" } : r)),
      );
      showToast({ message: "500 LP added to mentee's wallet successfully!", type: "success" });
    } catch (err) {
      showToast({ message: getErrorMessage(err, "Approval failed."), type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reqId: string) => {
    try {
      setActionLoading(reqId);
      await rejectLeapWalletRequest(reqId);
      setRequests((prev) =>
        prev.map((r) => (r._id === reqId ? { ...r, status: "rejected" } : r)),
      );
      showToast({ message: "Request rejected.", type: "error" });
    } catch (err) {
      showToast({ message: getErrorMessage(err, "Rejection failed."), type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = requests.filter((r) => {
    const matchTab = activeTab === "all" || r.status === activeTab;
    const name = r.mentee?.name?.toLowerCase() || "";
    const email = r.mentee?.email?.toLowerCase() || "";
    const matchSearch =
      name.includes(search.toLowerCase()) ||
      email.includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = {
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
    all: requests.length,
  };

  return {
    requests,
    loading,
    actionLoading,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    historyMentee,
    setHistoryMentee,
    handleApprove,
    handleReject,
    filtered,
    counts,
  };
};