//src/features/shared-dashboard/model/escrow.api.ts

import axiosInstance from "@/shared/utils/axiosInstance";
interface PayEscrowPayload {
  connectRequestId: string;
  sessionRate: number;
  sessionCount: number;
}

// POST /escrow/pay — Mentee locks tokens into escrow
export const payEscrow = async ({ connectRequestId, sessionRate, sessionCount }: PayEscrowPayload) => {
  const res = await axiosInstance.post("/escrow/pay", {
    connectRequestId,
    sessionRate,
    sessionCount,
  });
  return res.data;
};

// GET /escrow/status/:requestId
export const getEscrowStatus = async (requestId: string) => {
  const res = await axiosInstance.get(`/escrow/status/${requestId}`);
  return res.data;
};

interface PayAdditionalEscrowPayload {
  connectRequestId: string;
  sessionRate: number;
  slotId: string;
}

// POST /escrow/pay-additional
export const payAdditionalEscrow = async ({ connectRequestId, sessionRate, slotId }: PayAdditionalEscrowPayload) => {
  const res = await axiosInstance.post("/escrow/pay-additional", {
    connectRequestId,
    sessionRate,
    slotId,
  });
  return res.data;
};

// GET /escrow/commission-rate
export const getPlatformCommissionRate = async () => {
  const res = await axiosInstance.get("/escrow/commission-rate");
  return res.data;
};

// GET /escrow/wallet
export const getWallet = async () => {
  const res = await axiosInstance.get("/escrow/wallet");
  return res.data;
};