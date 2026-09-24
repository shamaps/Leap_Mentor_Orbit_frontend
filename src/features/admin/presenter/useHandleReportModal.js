// src/features/admin/presenter/useHandleReportModal.js
import { useState } from "react";
import { updateReportStatus, refundReport, deleteReportSession } from "../model/admin.api";

export const useHandleReportModal = (report, { onSave, onRefund, onDeleteSession, onClose }) => {
  const [selectedStatus, setSelectedStatus] = useState(
    ["resolved", "dismissed"].includes(report.status) ? report.status : ""
  );
  const [adminNote, setAdminNote] = useState(report.adminNote || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmRefund, setConfirmRefund] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handleSave = async () => {
    if (!selectedStatus) return setError("Please select a status.");
    try {
      setSaving(true);
      setError("");
      const res = await updateReportStatus(report.id, selectedStatus, adminNote);
      onSave(report.id, res.data.report);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update report.");
    } finally {
      setSaving(false);
    }
  };

  const handleRefund = async () => {
    try {
      setActionLoading(true);
      await refundReport(report.id, adminNote);
      onRefund(report.id);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Refund failed.");
      setConfirmRefund(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSession = async () => {
    try {
      setActionLoading(true);
      await deleteReportSession(report.id);
      onDeleteSession(report.id);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete session.");
      setConfirmDelete(false);
    } finally {
      setActionLoading(false);
    }
  };

  return {
    selectedStatus,
    setSelectedStatus,
    adminNote,
    setAdminNote,
    saving,
    error,
    confirmRefund,
    setConfirmRefund,
    confirmDelete,
    setConfirmDelete,
    actionLoading,
    handleSave,
    handleRefund,
    handleDeleteSession,
  };
};
