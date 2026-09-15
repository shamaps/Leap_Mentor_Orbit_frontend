// src/features/mentee/model/menteeEngagement.api.ts
import type { AxiosRequestConfig } from "axios";
import axiosInstance from "@/shared/utils/axiosInstance";

// axiosInstance's response interceptor reads this custom flag to suppress
// the default error log for expected 404s (see shared/utils/axiosInstance.ts).
interface RequestConfigWithSuppressLog extends AxiosRequestConfig {
    suppressNotFoundLog?: boolean;
}

// ── Escrow status (used to show wallet balance / commission for a connect) ──
export const getEscrowStatusForConnect = (connectId: string) =>
    axiosInstance.get(`/escrow/status/${connectId}`);

// ── Mentee's connect-request history ─────────────────────────────────────
export const getMyConnectRequests = () =>
    axiosInstance.get("/connect-requests/my-requests");

export const deleteConnectRequest = (id: string) =>
    axiosInstance.delete(`/connect-requests/${id}`);

// ── Leap points (wallet) upgrade requests ────────────────────────────────
export const getMyLeapRequest = () =>
    axiosInstance.get("/leap-requests/my-request", { suppressNotFoundLog: true } as RequestConfigWithSuppressLog);

export const createLeapRequest = () =>
    axiosInstance.post("/leap-requests", { reason: "balance_refill" });