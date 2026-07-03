// src/escrow.api.js
import axiosInstance from "../utils/axiosInstance";

// ─────────────────────────────────────────────────────────────
// POST /escrow/pay
// Mentee locks tokens into escrow
// ─────────────────────────────────────────────────────────────
export const payEscrow = async ({
  connectRequestId,
  sessionRate,
  sessionCount,
}) => {
  const res = await axiosInstance.post("/escrow/pay", {
    connectRequestId,
    sessionRate,
    sessionCount,
  });
  return res.data;
};

// ─────────────────────────────────────────────────────────────
// POST /escrow/release/:requestId
// Mentee confirms session complete — tokens go to mentor
// ─────────────────────────────────────────────────────────────
export const releaseEscrow = async (requestId) => {
  const res = await axiosInstance.patch(`/escrow/${requestId}`, {
    action: "release",
  });
  return res.data;
};

// ─────────────────────────────────────────────────────────────
// POST /escrow/refund/:requestId
// Either party cancels — tokens return to mentee
// ─────────────────────────────────────────────────────────────
export const refundEscrow = async (requestId) => {
  const res = await axiosInstance.patch(`/escrow/${requestId}`, {
    action: "refund",
  });
  return res.data;
};

// ─────────────────────────────────────────────────────────────
// GET /escrow/status/:requestId
// Get payment + wallet snapshot for a connect request
// ─────────────────────────────────────────────────────────────
export const getEscrowStatus = async (requestId) => {
  const res = await axiosInstance.get(`/escrow/status/${requestId}`);
  return res.data;
};

// ─────────────────────────────────────────────────────────────
// POST /escrow/pay-additional
// Mentee locks tokens for a single additional session slot
// ─────────────────────────────────────────────────────────────
export const payAdditionalEscrow = async ({
  connectRequestId,
  sessionRate,
  slotId,
}) => {
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
