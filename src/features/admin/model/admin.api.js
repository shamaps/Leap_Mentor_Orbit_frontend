// src/features/admin/model/admin.api.js
// Model layer for the admin feature

import adminAxiosInstance from "@/shared/utils/axiosInstance";

// ── Auth ────────────────────────────────────────────────────────────────
export const loginAdmin = (email, password) =>
  adminAxiosInstance.post("admin/auth/login", { email, password });

export const logoutAdmin = () => adminAxiosInstance.post("/admin/auth/logout");

export const getCurrentAdmin = () => adminAxiosInstance.get("/admin/auth/me");

// ── Layout / sidebar ────────────────────────────────────────────────────
export const getPendingLeapRequestsCount = () =>
  adminAxiosInstance.get("/admin/leap-requests/pending-count");

// ── Support messages ────────────────────────────────────────────────────
export const getSupportMessages = () =>
  adminAxiosInstance.get("/support/messages");

export const resolveSupportMessage = (id) =>
  adminAxiosInstance.patch(`/support/messages/${id}/resolve`);

// ── Leap requests (LeapRequests.jsx) ───────────────────────────────────
export const getAllLeapRequests = () =>
  adminAxiosInstance.get("/leap-requests/admin/all");

export const approveLeapRequest = (id) =>
  adminAxiosInstance.patch(`/leap-requests/admin/${id}/approve`, {});

export const rejectLeapRequest = (id, note) =>
  adminAxiosInstance.patch(`/leap-requests/admin/${id}/reject`, { note });

// ── Wallet / leap requests (AdminWalletRequests.jsx) ───────────────────
export const getLeapWalletRequests = () =>
  adminAxiosInstance.get("/admin/leap-requests");

export const approveLeapWalletRequest = (reqId) =>
  adminAxiosInstance.patch(`/admin/leap-requests/${reqId}/approve`, {});

export const rejectLeapWalletRequest = (reqId) =>
  adminAxiosInstance.patch(`/admin/leap-requests/${reqId}/reject`, {});

export const getMenteeEngagements = (menteeName) =>
  adminAxiosInstance.get("/admin/engagements", {
    params: { search: menteeName, limit: 50 },
  });

// ── Mentor verifications ────────────────────────────────────────────────
export const getMentorVerifications = () =>
  adminAxiosInstance.get("/admin/mentor-verifications");

export const verifyMentor = (mentorProfileId) =>
  adminAxiosInstance.patch(`/admin/mentor-verifications/${mentorProfileId}/verify`, {
    status: "verified",
  });

// ── Reports ──────────────────────────────────────────────────────────────
export const updateReportStatus = (reportId, status, adminNote) =>
  adminAxiosInstance.patch(`/admin/reports/${reportId}`, {
    status,
    adminNote,
  });

export const refundReport = (reportId, adminNote) =>
  adminAxiosInstance.post(`/admin/reports/${reportId}/refund`, { adminNote });

export const deleteReportSession = (reportId) =>
  adminAxiosInstance.delete(`/admin/reports/${reportId}/session`);

export const getReportStats = () => adminAxiosInstance.get("/admin/reports/stats");

export const getReports = (queryParams) =>
  adminAxiosInstance.get("/admin/reports", { params: queryParams });

// ── Payments ─────────────────────────────────────────────────────────────
export const getPaymentStats = () => adminAxiosInstance.get("/admin/payments/stats");

export const getPaymentChart = () => adminAxiosInstance.get("/admin/payments/chart");

export const getPaymentTransactions = (queryParams) =>
  adminAxiosInstance.get("/admin/payments/transactions", { params: queryParams });

// ── Engagements ──────────────────────────────────────────────────────────
export const getEngagementStats = () =>
  adminAxiosInstance.get("/admin/engagements/stats");

export const getEngagements = (params) =>
  adminAxiosInstance.get("/admin/engagements", { params });

// ── Users ────────────────────────────────────────────────────────────────
export const getUserStats = () => adminAxiosInstance.get("/admin/stats");

export const getUserGrowthData = () => adminAxiosInstance.get("/admin/user-growth");

export const getMentorIndustryStats = () =>
  adminAxiosInstance.get("/admin/stats/mentor-industries");

export const getUsers = (params) =>
  adminAxiosInstance.get("/admin/users", { params });

export const deleteUser = (userId) =>
  adminAxiosInstance.delete(`/admin/users/${userId}`);

export const blockUser = (userId) =>
  adminAxiosInstance.patch(`/admin/users/${userId}/block`, {});

export const unblockUser = (userId) =>
  adminAxiosInstance.patch(`/admin/users/${userId}/unblock`, {});

// ── Settings ─────────────────────────────────────────────────────────────
export const getCommissionSettings = () =>
  adminAxiosInstance.get("/admin/settings/commission");

export const addAdmin = (name, email) =>
  adminAxiosInstance.post("/admin/settings/admins", { name, email });

export const updateCommissionRate = (commissionRate) =>
  adminAxiosInstance.patch("/admin/settings/commission", { commissionRate });