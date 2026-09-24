// src/features/mentor/model/earnings.api.ts
import axiosInstance from "@/shared/utils/axiosInstance";

export const getEarningsStats = () => axiosInstance.get("/mentor/earnings");

export const getEarningsChart = (period: string) =>
  axiosInstance.get(`/mentor/earnings/chart?period=${period}`);

export const getEarningsPayouts = (page: number, limit: number, search?: string) => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search ? { search } : {}),
  });
  return axiosInstance.get(`/mentor/earnings/payouts?${params.toString()}`);
};

export const withdrawEarnings = () =>
  axiosInstance.post("/mentor/earnings/withdraw", {});