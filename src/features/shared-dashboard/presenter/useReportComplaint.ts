// src/hooks/useReportComplaint.js
import { useState, useCallback } from "react";
import { submitComplaintReport } from "@/features/shared-dashboard/model/reports.api";
import { getErrorMessage } from "@/features/shared-dashboard/model/types";

const useReportComplaint = (connectRequestId: string) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitReport = useCallback(
    async ({ complaintType, description, screenshot }: { complaintType: string; description: string; screenshot?: File | null }) => {
      if (!connectRequestId) return { success: false };

      try {
        setSubmitting(true);
        setError(null);

        // ── Build multipart form data (screenshot is optional) ──
        const formData = new FormData();
        formData.append("connectRequestId", connectRequestId);
        formData.append("complaintType", complaintType);
        formData.append("description", description);
        if (screenshot) formData.append("screenshot", screenshot);

        await submitComplaintReport(formData);

        return { success: true };
      } catch (err) {
        const msg = getErrorMessage(err, "Failed to submit report. Please try again.");
        setError(msg);
        return { success: false, message: msg };
      } finally {
        setSubmitting(false);
      }
    },
    [connectRequestId],
  );

  return { submitReport, submitting, error, setError };
};

export default useReportComplaint;