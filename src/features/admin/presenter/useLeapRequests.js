// src/features/admin/presenter/useLeapRequests.js
import { useState, useEffect, useCallback } from "react";
import { getAllLeapRequests, approveLeapRequest, rejectLeapRequest } from "../model/admin.api";
import logger from "@/shared/utils/logger";

export const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

export const useLeapRequests = () => {
  const [tab, setTab] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllLeapRequests();
      setRequests(res.data.requests || []);
    } catch (err) {
      logger.error("LeapRequests fetch error", { message: err.message });
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (id) => {
    try {
      setProcessingId(id);
      await approveLeapRequest(id);
      showToast("Request approved.");
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to approve.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id, note) => {
    try {
      setProcessingId(id);
      await rejectLeapRequest(id, note);
      showToast("Request rejected.");
      fetchRequests();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reject.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  return {
    tab,
    setTab,
    requests,
    loading,
    processingId,
    toast,
    handleApprove,
    handleReject,
    TABS,
  };
};
