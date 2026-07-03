// src/hooks/useReport.js
import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../utils/axiosInstance";

const useReport = (connectRequestId, refreshKey = 0) => {
  const [myFeedback, setMyFeedback] = useState(null);
  const [theirFeedback, setTheirFeedback] = useState(null);
  const [sessionStatus, setSessionStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [mySlotFeedback, setMySlotFeedback] = useState([]);
  const fetchFeedback = useCallback(async () => {
    if (!connectRequestId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await axiosInstance.get(`/feedback/${connectRequestId}`);
      setMyFeedback(res.data.myFeedback || null);
      setMySlotFeedback(res.data.mySlotFeedback || []);
      setTheirFeedback(res.data.theirFeedback || null);
      setSessionStatus(res.data.sessionStatus || null);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load feedback.");
    } finally {
      setLoading(false);
    }
  }, [connectRequestId]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback, refreshKey]);

  // slotIndex now accepted and sent to backend
  const submitFeedback = useCallback(
    async (rating, comment, slotIndex) => {
      console.log("sending feedback:", {
        connectRequestId,
        rating,
        comment,
        slotIndex,
      });
      if (!connectRequestId) return { success: false };
      try {
        setSubmitting(true);
        setError(null);
        const res = await axiosInstance.post("/feedback", {
          connectRequestId,
          rating,
          comment,
          slotIndex,
        });
        setMyFeedback(res.data.feedback);
        return { success: true };
      } catch (err) {
        const msg =
          err?.response?.data?.message || "Failed to submit feedback.";
        setError(msg);
        return { success: false, message: msg };
      } finally {
        setSubmitting(false);
      }
    },
    [connectRequestId],
  );

  return {
    myFeedback,
    mySlotFeedback,
    theirFeedback,
    sessionStatus,
    loading,
    submitting,
    error,
    submitFeedback,
    refetch: fetchFeedback,
  };
};

export default useReport;
