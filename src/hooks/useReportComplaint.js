// src/hooks/useReportComplaint.js
import { useState, useCallback } from "react";
import axiosInstance from "../utils/axiosInstance";

const useReportComplaint = (connectRequestId) => {
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState(null);

  const submitReport = useCallback(async ({ complaintType, description, screenshot }) => {
    if (!connectRequestId) return { success: false };

    try {
      setSubmitting(true);
      setError(null);

      // ── Build multipart form data (screenshot is optional) ──
      const formData = new FormData();
      formData.append("connectRequestId", connectRequestId);
      formData.append("complaintType",    complaintType);
      formData.append("description",      description);
      if (screenshot) formData.append("screenshot", screenshot);

      await axiosInstance.post("/reports", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return { success: true };
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to submit report. Please try again.";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setSubmitting(false);
    }
  }, [connectRequestId]);

  return { submitReport, submitting, error, setError };
};

export default useReportComplaint;