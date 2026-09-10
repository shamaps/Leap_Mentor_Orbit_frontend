// src/features/mentor/model/earnings.api.js
import axiosInstance from "@/shared/utils/axiosInstance";

export const getEarningsStats = () => axiosInstance.get("/mentor/earnings");

export const getEarningsChart = (period) =>
  axiosInstance.get(`/mentor/earnings/chart?period=${period}`);

export const getEarningsPayouts = (page, limit, search) => {
  const params = new URLSearchParams({
    page,
    limit,
    ...(search ? { search } : {}),
  });
  return axiosInstance.get(`/mentor/earnings/payouts?${params.toString()}`);
};

export const withdrawEarnings = () =>
  axiosInstance.post("/mentor/earnings/withdraw", {});
