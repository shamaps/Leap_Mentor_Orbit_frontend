// src/features/shared-dashboard/model/reports.api.ts
import axiosInstance from "@/shared/utils/axiosInstance";

export const submitComplaintReport = (formData: FormData) =>
  axiosInstance.post("/reports", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });