// src/components/admin/LeapRequests.jsx
// Add to AdminLayout NAV_ITEMS and route as /admin/leap-requests

import { useState, useEffect, useCallback } from "react";
import adminAxiosInstance from "../../utils/adminAxiosInstance";
import PropTypes from "prop-types";
import EmptyState from "../common/EmptyState";
import logger from "../../utils/logger";
// ── Helpers ───────────────────────────────────────────────────
const getInitials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const AVATAR_BG = [
  "bg-blue-100 text-blue-800",
  "bg-violet-100 text-violet-800",
  "bg-emerald-100 text-emerald-800",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-800",
];

// avatarColor fix
const avatarColor = (name = "") =>
  AVATAR_BG[(name.codePointAt(0) ?? 0) % AVATAR_BG.length];

// ActivityBar
ActivityBar.propTypes = {
  value: PropTypes.number.isRequired,
  max: PropTypes.number.isRequired,
  color: PropTypes.string.isRequired,
};

// RequestCard
RequestCard.propTypes = {
  request: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    createdAt: PropTypes.string,
    sessionCount: PropTypes.number,
    mentee: PropTypes.shape({
      name: PropTypes.string,
      email: PropTypes.string,
    }),
    liveStats: PropTypes.shape({
      totalSessions: PropTypes.number,
      completedSessions: PropTypes.number,
      ongoingSessions: PropTypes.number,
    }),
  }).isRequired,
  onApprove: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
  processing: PropTypes.bool,
};

// EmptyState
EmptyState.propTypes = {
  tab: PropTypes.string.isRequired,
};
// ── Activity Bar ──────────────────────────────────────────────
const ActivityBar = ({ value, max, color }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${color}`}
        style={{
          width: `${Math.min((value / Math.max(max, 1)) * 100, 100)}%`,
          transition: "width 0.6s ease",
        }}
      />
    </div>
    <span className="text-xs font-bold text-slate-700 w-5 text-right">
      {value}
    </span>
  </div>
);

// ── Request Card ──────────────────────────────────────────────
const RequestCard = ({ request, onApprove, onReject, processing }) => {
  const [showRejectNote, setShowRejectNote] = useState(false);
  const [note, setNote] = useState("");
  const name = request.mentee?.name || "Unknown";
  const email = request.mentee?.email || "";
  const {
    totalSessions = 0,
    completedSessions = 0,
    ongoingSessions = 0,
  } = request.liveStats || {};
  const sessionAtRequest = request.sessionCount ?? 0;
  const maxSessions = Math.max(totalSessions, 10);

  // Activity score: simple heuristic
  let activityScore = "Low";
  if (completedSessions >= 5) {
    activityScore = "High";
  } else if (completedSessions >= 2) {
    activityScore = "Medium";
  }
  const activityConfig = {
    High: {
      color: "text-emerald-600",
      bg: "bg-emerald-50 border-emerald-100",
      dot: "bg-emerald-500",
    },
    Medium: {
      color: "text-amber-600",
      bg: "bg-amber-50 border-amber-100",
      dot: "bg-amber-400",
    },
    Low: {
      color: "text-slate-500",
      bg: "bg-slate-50 border-slate-200",
      dot: "bg-slate-400",
    },
  }[activityScore];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${avatarColor(name)}`}
          >
            {getInitials(name)}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{name}</p>
            <p className="text-[11px] text-slate-400">{email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${activityConfig.bg} ${activityConfig.color}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${activityConfig.dot}`}
            />
            {activityScore} Activity
          </span>
          <span className="text-[10px] text-slate-400">
            {timeAgo(request.createdAt)}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 pb-3 space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
          Session Activity
        </p>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-0.5">
            <span>Total Requests</span>
          </div>
          <ActivityBar
            value={totalSessions}
            max={maxSessions}
            color="bg-blue-400"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 mb-0.5">
            <span>Completed Sessions</span>
          </div>
          <ActivityBar
            value={completedSessions}
            max={maxSessions}
            color="bg-emerald-400"
          />

          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 mb-0.5">
            <span>Ongoing Sessions</span>
          </div>
          <ActivityBar
            value={ongoingSessions}
            max={maxSessions}
            color="bg-violet-400"
          />
        </div>

        {/* Summary chips */}
        <div className="flex flex-wrap gap-2 pt-2">
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
            {totalSessions} total requests
          </span>
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
            {completedSessions} completed
          </span>
          {ongoingSessions > 0 && (
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-100">
              {ongoingSessions} ongoing
            </span>
          )}
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200">
            {sessionAtRequest} sessions at request time
          </span>
        </div>
      </div>

      <div className="border-t border-slate-100 mx-5" />

      {/* Actions */}
      <div className="px-5 py-3">
        {showRejectNote ? (
          <div className="space-y-2">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note for rejection…"
              rows={2}
              className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-red-200 text-slate-700 placeholder:text-slate-400"
            />
            <div className="flex gap-2">
              <button
                onClick={() => onReject(request._id, note)}
                disabled={processing}
                className="flex-1 text-xs font-bold py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
              >
                Confirm Reject
              </button>
              <button
                onClick={() => setShowRejectNote(false)}
                className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => onApprove(request._id)}
              disabled={processing}
              className="flex-1 text-xs font-bold py-2.5 rounded-xl
                bg-blue-900 hover:bg-blue-800 text-white transition-all
                disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {processing ? (
                <svg
                  className="animate-spin w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="white"
                    strokeWidth="3"
                    strokeDasharray="40 20"
                  />
                </svg>
              ) : (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              Approve (+500 LP)
            </button>
            <button
              onClick={() => setShowRejectNote(true)}
              disabled={processing}
              className="text-xs font-bold px-4 py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Skeleton ──────────────────────────────────────────────────
const CardSkeleton = () => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-pulse space-y-4">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-slate-200 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-3 bg-slate-200 rounded w-2/5" />
        <div className="h-2.5 bg-slate-100 rounded w-1/3" />
      </div>
    </div>
    <div className="space-y-2">
      <div className="h-2 bg-slate-100 rounded-full w-full" />
      <div className="h-2 bg-slate-100 rounded-full w-3/4" />
      <div className="h-2 bg-slate-100 rounded-full w-1/2" />
    </div>
    <div className="h-9 bg-slate-200 rounded-xl" />
  </div>
);


// ── Main Page ─────────────────────────────────────────────────
const LeapRequests = () => {
  const [tab, setTab] = useState("pending");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminAxiosInstance.get("/leap-requests/admin/all");
      setRequests(res.data.requests || []);
    } catch (err) {
      logger.error("LeapRequests fetch error", { message: err.message });
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (id) => {
    try {
      setProcessingId(id);
      await adminAxiosInstance.patch(`/leap-requests/admin/${id}/approve`, {});
      showToast({ message: "Approved! 500 LP credited to mentee." });
      fetchRequests();
    } catch (err) {
      showToast({ message: err.response?.data?.message || "Failed to approve.", type: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id, note) => {
    try {
      setProcessingId(id);
      await adminAxiosInstance.patch(`/leap-requests/admin/${id}/reject`, {
        note,
      });
      showToast({ message: "Request rejected." });
      fetchRequests();
    } catch (err) {
      showToast({ message: err.response?.data?.message || "Failed to reject.", type: "error" });
    } finally {
      setProcessingId(null);
    }
  };

  const TABS = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
  ];
}
  let requestsContent;
  if (loading) {
    requestsContent = (
      <>
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </>
    );
  } else if (requests.length === 0) {
    requestsContent = (
      <EmptyState
        fullWidth
        icon={
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="17 11 12 6 7 11" />
            <line x1="12" y1="6" x2="12" y2="18" />
          </svg>
        }
        message={`No ${tab} requests`}
        subMessage={
          tab === "pending"
            ? "When mentees run out of Leap Points and request a refill, they'll appear here."
            : `All ${tab} requests will show up here.`
        }
      />
    );
  } else {
    requestsContent = requests.map((req) => (
      <RequestCard
        key={req._id}
        request={req}
        onApprove={handleApprove}
        onReject={handleReject}
        processing={processingId === req._id}
      />
    ));
  }
  return (
    <div className="max-w-5xl mx-auto">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 transition-all
          ${toast.type === "error" ? "bg-red-500 text-white" : "bg-emerald-500 text-white"}`}
        >
          {toast.type === "error" ? "⚠️" : "✅"} {toast.msg}
        </div>
      )}

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">
          Leap Points Requests
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review mentees who have run out of Leap Points and are requesting a
          refill. Approve based on their session activity.
        </p>
      </div>

      {/* Info banner */}
      <div className="mb-5 flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-100 rounded-2xl">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#d97706"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="shrink-0 mt-0.5"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p className="text-xs text-amber-800 leading-relaxed">
          Each approval credits the mentee with{" "}
          <strong>500 Leap Points ($500 value)</strong>. Review session stats
          carefully — mentees with more completed sessions indicate higher
          platform engagement.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all
              ${
                tab === t.key
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {requestsContent}
      </div>
    </div>
  );

export default LeapRequests;
