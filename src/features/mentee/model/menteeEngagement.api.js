// src/features/mentee/model/menteeEngagement.api.js
import axiosInstance from "@/shared/utils/axiosInstance";
// ── Escrow status (used to show wallet balance / commission for a connect) ──
export const getEscrowStatusForConnect = (connectId) =>
    axiosInstance.get(`/escrow/status/${connectId}`);

// ── Mentee's connect-request history ─────────────────────────────────────
export const getMyConnectRequests = () =>
    axiosInstance.get("/connect-requests/my-requests");

export const deleteConnectRequest = (id) =>
    axiosInstance.delete(`/connect-requests/${id}`);

// ── Leap points (wallet) upgrade requests ────────────────────────────────
export const getMyLeapRequest = () =>
    axiosInstance.get("/leap-requests/my-request", { suppressNotFoundLog: true });

export const createLeapRequest = () =>
    axiosInstance.post("/leap-requests", { reason: "balance_refill" });
