// src/pages/admin/AdminReports.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import adminAxiosInstance from "../../utils/adminAxiosInstance";
import AdminLayout from "../../components/admin/AdminLayout";
import StatCard from "@/components/atoms/StatCard";

const FONT = "'DM Sans', sans-serif";
const MONO = "'DM Mono', monospace";

// ── Toast ─────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null;
  return (
    <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg text-sm"
      style={{
        fontWeight: 600, fontFamily: FONT,
        background: toast.type === "success" ? "#f0fdf4" : "#fef2f2",
        border: `1px solid ${toast.type === "success" ? "#bbf7d0" : "#fecaca"}`,
        color: toast.type === "success" ? "#15803d" : "#dc2626",
      }}>
      {toast.msg}
    </div>
  );
};

// ── Status Badge ───────────────────────────────────────────────
const STATUS_CONFIG = {
  open: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca", dot: "#ef4444", label: "Pending" },
  under_review: { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe", dot: "#3b82f6", label: "Under Review" },
  resolved: { bg: "#f0fdf4", color: "#059669", border: "#bbf7d0", dot: "#22c55e", label: "Resolved" },
  dismissed: { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0", dot: "#94a3b8", label: "Dismissed" },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-700 uppercase tracking-wide"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontWeight: 700, letterSpacing: "0.06em", fontFamily: FONT }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
};

// ── Category Badge ─────────────────────────────────────────────
const CAT_CONFIG = {
  vulgar_chat: { bg: "#fef2f2", color: "#dc2626", label: "Vulgar Chat" },
  harassment: { bg: "#fef2f2", color: "#dc2626", label: "Harassment" },
  refund: { bg: "#fffbeb", color: "#d97706", label: "Refund" },
  other: { bg: "#f8fafc", color: "#64748b", label: "Other" },
};

const CategoryBadge = ({ category }) => {
  const cfg = CAT_CONFIG[category] || CAT_CONFIG.other;
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-700 uppercase tracking-wide"
      style={{ background: cfg.bg, color: cfg.color, fontWeight: 700, letterSpacing: "0.06em", fontFamily: FONT }}>
      {cfg.label}
    </span>
  );
};

// ── Confirm Dialog ─────────────────────────────────────────────
const ConfirmDialog = ({ title, message, confirmLabel, confirmColor, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 px-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4" style={{ fontFamily: FONT }}>
      <div>
        <p className="text-sm font-700 text-slate-800" style={{ fontWeight: 700 }}>{title}</p>
        <p className="text-xs text-slate-500 mt-1 leading-relaxed">{message}</p>
      </div>
      <div className="flex gap-3">
        <button onClick={onCancel} disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-xs font-600 transition-all"
          style={{ background: "#f1f5f9", color: "#475569", fontWeight: 600, border: "1px solid #e2e8f0" }}>
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="flex-1 py-2.5 rounded-xl text-xs font-600 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: confirmColor, fontWeight: 600 }}>
          {loading && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
          {loading ? "Processing..." : confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

// ── Handle Modal ───────────────────────────────────────────────
const HandleModal = ({ report, onClose, onSave, onRefund, onDeleteSession }) => {
  const [selectedStatus, setSelectedStatus] = useState(
    ["resolved", "dismissed"].includes(report.status) ? report.status : ""
  );
  const [adminNote, setAdminNote] = useState(report.adminNote || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmRefund, setConfirmRefund] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isRefundReport = report.category === "refund";
  const hasSession = !!report.connectRequestId;
  const alreadyRefunded = report.refundProcessed;

  const STATUSES = [
    { key: "resolved", label: "Resolved", color: "#059669" },
    { key: "dismissed", label: "Dismissed", color: "#64748b" },
  ];

  const handleSave = async () => {
    if (!selectedStatus) return setError("Please select a status.");
    try {
      setSaving(true);
      setError("");
      const res = await adminAxiosInstance.patch(
        `/admin/reports/${report.id}`,
        { status: selectedStatus, adminNote }
      );
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
      await adminAxiosInstance.post(
        `/admin/reports/${report.id}/refund`,
        { adminNote }
      );
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
      await adminAxiosInstance.delete(
        `/admin/reports/${report.id}/session`
      );
      onDeleteSession(report.id);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to delete session.");
      setConfirmDelete(false);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col"
          style={{ fontFamily: FONT, maxHeight: "90vh" }}>

          {/* Fixed Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b flex-shrink-0"
            style={{ borderColor: "#e8eaf0" }}>
            <div>
              <p className="text-sm font-600 text-slate-800" style={{ fontWeight: 700 }}>Handle Report</p>
              <p className="text-xs text-slate-600 mt-0.5">Update status and take action</p>
            </div>
            <button type="button" onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
              style={{ background: "#f1f5f9" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#e2e8f0"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#f1f5f9"}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

            {/* Report summary */}
            <div className="p-4 rounded-2xl space-y-3" style={{ background: "#f8fafc", border: "1px solid #e8eaf0" }}>
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-700 uppercase tracking-widest text-slate-400"
                  style={{ fontWeight: 700, letterSpacing: "0.1em" }}>Report Summary</p>
                <CategoryBadge category={report.category} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Mentee", value: report.mentee },
                  { label: "Mentor", value: report.mentor },
                  { label: "Reported By", value: report.reportedBy },
                  { label: "Date", value: report.date },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[9px] font-700 uppercase tracking-widest text-slate-400" style={{ fontWeight: 700 }}>{label}</p>
                    <p className="text-xs font-600 text-slate-700 mt-0.5" style={{ fontWeight: 600 }}>{value || "—"}</p>
                  </div>
                ))}
              </div>
              {report.totalAmount > 0 && (
                <div className="pt-2 border-t" style={{ borderColor: "#e8eaf0" }}>
                  <p className="text-[9px] font-700 uppercase tracking-widest text-slate-400" style={{ fontWeight: 700 }}>Session Amount</p>
                  <p className="text-sm font-700 text-slate-800 mt-0.5" style={{ fontWeight: 700, fontFamily: MONO }}>
                    {report.totalAmount} tokens
                  </p>
                </div>
              )}
              {report.description && (
                <div className="pt-2 border-t" style={{ borderColor: "#e8eaf0" }}>
                  <p className="text-[9px] font-700 uppercase tracking-widest text-slate-400 mb-1" style={{ fontWeight: 700 }}>Description</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{report.description}</p>
                </div>
              )}
              {report.screenshotUrl && (
                <div className="pt-2">
                  <a href={report.screenshotUrl} target="_blank" rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    View Screenshot
                  </a>
                </div>
              )}
            </div>

            {/* ✅ Refund Action — only shown for refund-type reports */}
            {isRefundReport && (
              <div className="p-4 rounded-2xl space-y-3"
                style={{ background: alreadyRefunded ? "#f0fdf4" : "#fffbeb", border: `1px solid ${alreadyRefunded ? "#bbf7d0" : "#fde68a"}` }}>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 13, fontWeight: 800, fontFamily: MONO, color: "currentColor", letterSpacing: "-0.02em" }}>
                    LP
                  </span>
                  <p className="text-xs font-700" style={{ fontWeight: 700, color: alreadyRefunded ? "#059669" : "#d97706" }}>
                    {alreadyRefunded ? "Refund Already Processed ✅" : "Refund Request"}
                  </p>
                </div>
                {!alreadyRefunded && (
                  <>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      This will refund <strong>{report.totalAmount} tokens</strong> from escrow back to the mentee's wallet and close the session.
                    </p>
                    <button
                      type="button"
                      onClick={() => setConfirmRefund(true)}
                      disabled={!hasSession || report.paymentStatus !== "paid"}
                      className="w-full py-2.5 rounded-xl text-xs font-600 text-white transition-all disabled:opacity-40"
                      style={{ background: "#d97706", fontWeight: 600 }}>
                      Process Refund — {report.totalAmount} tokens
                    </button>
                    {report.paymentStatus !== "paid" && (
                      <p className="text-[10px] text-slate-400">No payment found for this session.</p>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ✅ Delete Session Action */}
            {hasSession && (
              <div className="p-4 rounded-2xl space-y-3"
                style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                <div className="flex items-center gap-2">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" /><path d="M14 11v6" />
                  </svg>
                  <p className="text-xs font-700 text-red-600" style={{ fontWeight: 700 }}>Delete Session</p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Permanently deletes this connect request. Both mentee and mentor will be notified.
                </p>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="w-full py-2.5 rounded-xl text-xs font-600 text-white transition-all"
                  style={{ background: "#dc2626", fontWeight: 600 }}>
                  Delete This Session
                </button>
              </div>
            )}

            {/* Status selector */}
            <div>
              <p className="text-xs font-600 text-slate-500 mb-2" style={{ fontWeight: 600 }}>
                Update Status <span className="text-slate-400 font-400">(select one)</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                {STATUSES.map((s) => {
                  const isSelected = selectedStatus === s.key;
                  return (
                    <button key={s.key} type="button" onClick={() => setSelectedStatus(s.key)}
                      className="py-3 rounded-xl text-sm font-600 transition-all flex items-center justify-center gap-2"
                      style={{
                        fontWeight: 600,
                        background: isSelected ? s.color : "#f8fafc",
                        color: isSelected ? "white" : "#64748b",
                        border: isSelected ? `2px solid ${s.color}` : "2px solid #e2e8f0",
                      }}>
                      {isSelected && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                      {s.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl"
                style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-[10px] text-blue-700 leading-relaxed">
                  The reporter will receive a notification when you save changes.
                </p>
              </div>
            </div>

            {/* Admin note */}
            <div>
              <label className="text-xs font-600 text-slate-500 block mb-1.5" style={{ fontWeight: 600 }}>
                Admin Note <span className="text-slate-400 font-400">(optional)</span>
              </label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add a note about how this was resolved or any action taken..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all resize-none"
                style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#334155", fontFamily: FONT }}
                onFocus={(e) => e.target.style.borderColor = "#93c5fd"}
                onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
              />
            </div>

            {error && <p className="text-xs text-red-500 font-600" style={{ fontWeight: 600 }}>{error}</p>}
          </div>

          {/* Fixed Footer */}
          <div className="flex gap-3 px-6 py-4 border-t flex-shrink-0" style={{ borderColor: "#e8eaf0" }}>
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-600 transition-all"
              style={{ background: "#f1f5f9", color: "#475569", fontWeight: 600, border: "1px solid #e2e8f0" }}>
              Cancel
            </button>
            <button type="button" onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-xs font-600 text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "#2563eb", fontWeight: 600 }}>
              {saving && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Confirm Refund Dialog ── */}
      {confirmRefund && (
        <ConfirmDialog
          title="Process Refund?"
          message={`This will refund ${report.totalAmount} tokens from escrow back to the mentee's wallet and close the session. This cannot be undone.`}
          confirmLabel="Yes, Process Refund"
          confirmColor="#d97706"
          loading={actionLoading}
          onConfirm={handleRefund}
          onCancel={() => setConfirmRefund(false)}
        />
      )}

      {/* ── Confirm Delete Dialog ── */}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete Session?"
          message="This will permanently delete the connect request. Both mentee and mentor will be notified. This cannot be undone."
          confirmLabel="Yes, Delete Session"
          confirmColor="#dc2626"
          loading={actionLoading}
          onConfirm={handleDeleteSession}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
};

// ══════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════
const AdminReports = () => {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ totalCount: 0, currentPage: 1, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState(null);
  const searchTimer = useRef(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await adminAxiosInstance.get("/admin/reports/stats");
      setStats(res.data);
    } catch { showToast("Failed to load stats.", "error"); }
  }, []);

  const fetchReports = useCallback(async (page = 1, q = search, status = statusFilter) => {
    try {
      setLoading(true);
      const params = { page, limit: 10 };
      if (q) params.search = q;
      if (status) params.status = status;
      const res = await adminAxiosInstance.get("/admin/reports", { params });
      setReports(res.data.reports || []);
      setPagination(res.data.pagination);
    } catch { showToast("Failed to load reports.", "error"); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchStats();
    fetchReports();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchReports(1, val, statusFilter), 400);
  };

  const handleStatusFilter = (s) => {
    setStatusFilter(s);
    fetchReports(1, search, s);
  };

  const handleSave = (id, updated) => {
    setReports((prev) => prev.map((r) => r.id.toString() === id.toString() ? { ...r, ...updated } : r));
    fetchStats();
    showToast("Report updated. Reporter has been notified. ✅");
  };

  const handleRefund = (id) => {
    setReports((prev) => prev.map((r) => r.id.toString() === id.toString()
      ? { ...r, status: "resolved", refundProcessed: true } : r));
    fetchStats();
    showToast("Refund processed. Mentee has been notified. ✅");
  };

  const handleDeleteSession = (id) => {
    setReports((prev) => prev.map((r) => r.id.toString() === id.toString()
      ? { ...r, status: "resolved", connectRequestId: null } : r));
    fetchStats();
    showToast("Session deleted. Both parties notified. ✅");
  };

  const STAT_CARDS = [
    {
      label: "Total Reports", value: stats?.totalReports ?? 0, accent: "#2563eb",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
    },
    {
      label: "Pending Resolution", value: stats?.pendingResolution ?? 0, sub: "Open + Under Review", accent: "#d97706",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    },
    {
      label: "Resolved Today", value: stats?.resolvedToday ?? 0, accent: "#059669",
      icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
    },
  ];

  const STATUS_FILTERS = [
    { key: "", label: "All" },
    { key: "open", label: "Pending" },
    { key: "resolved", label: "Resolved" },
    { key: "dismissed", label: "Dismissed" },
  ];

  return (
    <AdminLayout>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');`}</style>
      <Toast toast={toast} />

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-700 text-slate-800" style={{ fontWeight: 700, fontFamily: FONT }}>
            Reports &amp; Complaints
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">Manage and resolve mentor-mentee disputes efficiently.</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {STAT_CARDS.map((card) => <StatCard key={card.label} {...card} />)}
        </div>

        <div className="rounded-2xl overflow-hidden" style={{ background: "#ffffff", border: "1px solid #e8eaf0" }}>
          <div className="px-6 py-4 border-b space-y-3" style={{ borderColor: "#e8eaf0" }}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-700 text-slate-800" style={{ fontWeight: 700, fontFamily: FONT }}>All Reports</p>
                <p className="text-xs text-slate-400 mt-0.5">{pagination.totalCount} total reports</p>
              </div>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="13" height="13"
                  viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input value={search} onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search mentee or mentor..."
                  className="pl-8 pr-3 py-1.5 rounded-xl text-xs outline-none transition-all"
                  style={{ background: "#f8fafc", border: "1px solid #e2e8f0", width: 220, fontFamily: FONT, color: "#334155" }}
                  onFocus={(e) => e.target.style.borderColor = "#93c5fd"}
                  onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                />
              </div>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {STATUS_FILTERS.map(({ key, label }) => (
                <button key={key} onClick={() => handleStatusFilter(key)}
                  className="px-3 py-1.5 rounded-xl text-xs font-600 transition-all"
                  style={{ fontWeight: 600, fontFamily: FONT, background: statusFilter === key ? "#2563eb" : "#f1f5f9", color: statusFilter === key ? "white" : "#475569" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontFamily: FONT }}>
              <thead>
                <tr style={{ background: "#f1f5f9", borderBottom: "2px solid #e2e8f0" }}>
                  {["MENTEE", "MENTOR", "CATEGORY", "DATE", "STATUS", "ACTIONS"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-[10px] uppercase tracking-widest"
                      style={{ color: "#334155", fontWeight: 800, letterSpacing: "0.12em" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {[...Array(6)].map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-4 rounded-lg animate-pulse" style={{ background: "#f1f5f9", width: j === 5 ? 60 : 100 }} />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : reports.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-16 text-sm text-slate-400">No reports found.</td></tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report.id} className="transition-colors"
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "#fafbfc"}
                      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <td className="px-5 py-4">
                        <p className="text-xs font-600 text-slate-800" style={{ fontWeight: 600 }}>{report.mentee || "—"}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5" style={{ fontFamily: MONO }}>{report.menteeEmail}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs font-600 text-slate-800" style={{ fontWeight: 600 }}>{report.mentor || "—"}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5" style={{ fontFamily: MONO }}>{report.mentorEmail}</p>
                      </td>
                      <td className="px-5 py-4"><CategoryBadge category={report.category} /></td>
                      <td className="px-5 py-4"><span className="text-xs text-slate-800" style={{ fontFamily: MONO }}>{report.date}</span></td>
                      <td className="px-5 py-4"><StatusBadge status={report.status} /></td>
                      <td className="px-5 py-4">
                        <button type="button" onClick={() => setSelected(report)}
                          className="px-3 py-1.5 rounded-xl text-xs font-600 transition-all"
                          style={{ background: "#eff6ff", color: "#2563eb", fontWeight: 600, border: "1px solid #bfdbfe" }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = "#2563eb"; e.currentTarget.style.color = "white"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "#eff6ff"; e.currentTarget.style.color = "#2563eb"; }}>
                          Handle
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: "#e8eaf0" }}>
            <p className="text-xs text-slate-400" style={{ fontFamily: MONO }}>
              Showing {reports.length} of {pagination.totalCount} reports
            </p>
            <div className="flex items-center gap-2">
              <button onClick={() => fetchReports(pagination.currentPage - 1)}
                disabled={pagination.currentPage <= 1}
                className="px-3 py-1.5 rounded-xl text-xs font-600 transition-all disabled:opacity-30"
                style={{ background: "#f1f5f9", color: "#475569", fontWeight: 600 }}>Previous</button>
              <span className="text-xs text-slate-400" style={{ fontFamily: MONO }}>
                {pagination.currentPage} / {pagination.totalPages || 1}
              </span>
              <button onClick={() => fetchReports(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages}
                className="px-3 py-1.5 rounded-xl text-xs font-600 transition-all disabled:opacity-30"
                style={{ background: "#2563eb", color: "white", fontWeight: 600 }}>Next</button>
            </div>
          </div>
        </div>
      </div>

      {selected && (
        <HandleModal
          report={selected}
          onClose={() => setSelected(null)}
          onSave={handleSave}
          onRefund={handleRefund}
          onDeleteSession={handleDeleteSession}
        />
      )}
    </AdminLayout>
  );
};

export default AdminReports;