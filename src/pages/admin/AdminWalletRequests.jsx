// src/pages/admin/AdminWalletRequests.jsx
import { useState, useEffect, useCallback } from "react";
import adminAxiosInstance from "../../utils/adminAxiosInstance";
import { useToast } from "../../context/ToastContext";
import EmptyState from "../../components/common/EmptyState";
import logger from "../../utils/logger";
const getInitials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const AVATAR_COLORS = [
  { bg: "#fee2e2", text: "#b91c1c" },
  { bg: "#dbeafe", text: "#1e3a8a" },
  { bg: "#ede9fe", text: "#6d28d9" },
  { bg: "#d1fae5", text: "#065f46" },
  { bg: "#fef3c7", text: "#92400e" },
];
const getAvatarColor = (name = "") =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const formatDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const StatusBadge = ({ status }) => {
  const styles = {
    pending: {
      bg: "#fef3c7",
      text: "#92400e",
      border: "#fde68a",
      label: "Pending",
    },
    approved: {
      bg: "#d1fae5",
      text: "#065f46",
      border: "#a7f3d0",
      label: "Approved",
    },
    rejected: {
      bg: "#fee2e2",
      text: "#b91c1c",
      border: "#fecaca",
      label: "Rejected",
    },
    completed: {
      bg: "#dbeafe",
      text: "#1e3a8a",
      border: "#bfdbfe",
      label: "Completed",
    },
    accepted: {
      bg: "#d1fae5",
      text: "#065f46",
      border: "#a7f3d0",
      label: "Accepted",
    },
    cancelled: {
      bg: "#f1f5f9",
      text: "#64748b",
      border: "#e2e8f0",
      label: "Cancelled",
    },
    paid: { bg: "#d1fae5", text: "#065f46", border: "#a7f3d0", label: "Paid" },
    unpaid: {
      bg: "#fef3c7",
      text: "#92400e",
      border: "#fde68a",
      label: "Unpaid",
    },
  };
  const s = styles[status] || styles.pending;
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{
        background: s.bg,
        color: s.text,
        border: `1px solid ${s.border}`,
      }}
    >
      {s.label}
    </span>
  );
};

// ── Mentee History Modal ──────────────────────────────────────
const MenteeHistoryModal = ({ mentee, onClose }) => {
  const [engagements, setEngagements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchEngagements = async () => {
      try {
        setLoading(true);
        const res = await adminAxiosInstance.get("/admin/engagements", {
          params: { search: mentee.name, limit: 50 },
        });
        const all = res.data.engagements || res.data || res.data || [];
        // Filter to only this mentee's engagements
        const filtered = all.filter(
          (e) =>
            e.mentee?._id === mentee._id || e.mentee?.email === mentee.email,
        );
        setEngagements(filtered);
      } catch (err) {
        logger.error("Failed to fetch engagements", { message: err.message });
      } finally {
        setLoading(false);
      }
    };
    if (mentee) fetchEngagements();
  }, [mentee]);

  const toggleExpand = (engId) => {
    setExpandedId((prev) => (prev === engId ? null : engId));
  };

  const { bg, text } = getAvatarColor(mentee.name);
  const totalCompleted = engagements.reduce(
    (acc, e) =>
      acc +
      (e.selectedSlots?.filter((s) => s.status === "completed").length || 0),
    0,
  );
  const totalSlots = engagements.reduce(
    (acc, e) => acc + (e.selectedSlots?.length || 0),
    0,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(2px)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ background: bg, color: text }}
            >
              {getInitials(mentee.name)}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                {mentee.name}
              </h2>
              <p className="text-[11px] text-slate-400">{mentee.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#64748b"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Summary Stats */}
        <div className="flex gap-3 px-6 py-3 border-b border-slate-100 bg-slate-50">
          {[
            {
              label: "Engagements",
              value: engagements.length,
              color: "#2563eb",
              bg: "#dbeafe",
            },
            {
              label: "Total Sessions",
              value: totalSlots,
              color: "#7c3aed",
              bg: "#ede9fe",
            },
            {
              label: "Completed",
              value: totalCompleted,
              color: "#065f46",
              bg: "#d1fae5",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="flex-1 rounded-xl px-3 py-2 text-center"
              style={{ background: s.bg }}
            >
              <p className="text-lg font-bold" style={{ color: s.color }}>
                {s.value}
              </p>
              <p
                className="text-[10px] font-semibold"
                style={{ color: s.color }}
              >
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Engagements List */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <svg
                className="animate-spin w-6 h-6 text-blue-600"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="#dbeafe"
                  strokeWidth="3"
                />
                <path
                  d="M12 2a10 10 0 0 1 10 10"
                  stroke="#2563eb"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              <p className="text-xs text-slate-400">
                Loading engagement history…
              </p>
            </div>
          ) : engagements.length === 0 ? (
              <EmptyState
                compact
                icon={
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.6" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                }
                message="No engagements found"
                subMessage="This mentee has no session history yet."
              />
          ) : (
            engagements.map((eng) => {
              const isOpen = expandedId === eng._id;
              const engSlots = eng.selectedSlots || [];
              const completed = engSlots.filter(
                (s) => s.status === "completed",
              ).length;
              return (
                <div
                  key={eng._id}
                  className="rounded-xl border border-slate-100 overflow-hidden"
                >
                  {/* Engagement Row */}
                  <button
                    onClick={() => toggleExpand(eng._id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Mentor avatar */}
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{
                          ...getAvatarColor(eng.mentor?.name || "M"),
                          background: getAvatarColor(eng.mentor?.name || "M")
                            .bg,
                          color: getAvatarColor(eng.mentor?.name || "M").text,
                        }}
                      >
                        {getInitials(eng.mentor?.name || "M")}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">
                          Mentor: {eng.mentor?.name || "—"}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {formatDate(eng.requestedAt)} · {engSlots.length}{" "}
                          sessions · {completed} completed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        style={{
                          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                          transition: "transform 0.2s",
                        }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded Slots */}
                  {isOpen && (
                    <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
                      {/* Engagement meta */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {[
                          {
                            label: "Payment",
                            value: (
                              <StatusBadge
                                status={eng.paymentStatus || "unpaid"}
                              />
                            ),
                          },
                          {
                            label: "Rate/Session",
                            value: eng.sessionRate
                              ? `₹${eng.sessionRate}`
                              : "—",
                          },
                          {
                            label: "Responded",
                            value: formatDate(eng.respondedAt),
                          },
                          {
                            label: "Completed At",
                            value: formatDate(eng.completedAt),
                          },
                        ].map((m) => (
                          <div
                            key={m.label}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-100"
                          >
                            <span className="text-[10px] text-slate-400 font-medium">
                              {m.label}:
                            </span>
                            <span className="text-[10px] font-semibold text-slate-700">
                              {m.value}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Slots Table */}
                      {engSlots.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-3">
                          No slots found.
                        </p>
                      ) : (
                        <div className="rounded-xl overflow-hidden border border-slate-100">
                          <table className="w-full text-[11px]">
                            <thead>
                              <tr style={{ background: "#f1f5f9" }}>
                                {["#", "Date", "Time"].map((h) => (
                                  <th
                                    key={h}
                                    className="px-3 py-2 text-left font-bold text-slate-400 uppercase tracking-wider text-[9px]"
                                  >
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {engSlots.map((slot, i) => (
                                <tr
                                  key={i}
                                  className="border-t border-slate-100 bg-white hover:bg-slate-50"
                                >
                                  <td className="px-3 py-2 font-bold text-slate-400">
                                    {i + 1}
                                  </td>
                                  <td className="px-3 py-2 text-slate-700">
                                    {formatDate(slot.date)}
                                  </td>
                                  <td className="px-3 py-2 text-slate-600">
                                    {slot.startTime && slot.endTime
                                      ? `${slot.startTime} – ${slot.endTime}`
                                      : "—"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// ── Request Row ───────────────────────────────────────────────
const RequestRow = ({
  req,
  onApprove,
  onReject,
  actionLoading,
  onViewHistory,
}) => {
  const name = req.mentee?.name || "Unknown";
  const email = req.mentee?.email || "—";
  const { bg, text } = getAvatarColor(name);
  const isLoading = actionLoading === req._id;

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          {req.mentee?.profilePicture ? (
            <img
              src={req.mentee.profilePicture}
              alt={name}
              className="w-8 h-8 rounded-full object-cover shrink-0"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: bg, color: text }}
            >
              {getInitials(name)}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">
              {name}
            </p>
            <p className="text-[10px] text-slate-400 truncate">{email}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#F59E0B" />
            <text
              x="12"
              y="16"
              textAnchor="middle"
              fontSize="7"
              fontWeight="bold"
              fill="#92400E"
              fontFamily="serif"
            >
              LP
            </text>
          </svg>
          <span className="text-xs font-bold text-slate-700">
            {(req.currentBalance ?? 0).toLocaleString()} LP
          </span>
        </div>
      </td>
      <td className="px-5 py-3">
        <span className="text-xs text-slate-500">
          {formatDate(req.createdAt)}
        </span>
      </td>
      <td className="px-5 py-3">
        <StatusBadge status={req.status} />
      </td>
      {/* View History button */}
      <td className="px-5 py-3">
        <button
          onClick={() => onViewHistory(req.mentee)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          History
        </button>
      </td>
      <td className="px-5 py-3">
        {req.status === "pending" ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onApprove(req._id)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: isLoading ? "#6b7280" : "#16a34a" }}
            >
              {isLoading ? "Processing…" : "Approve +500 LP"}
            </button>
            <button
              onClick={() => onReject(req._id)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-white transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "#dc2626" }}
            >
              Reject
            </button>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400 font-medium italic">
            {req.status === "approved" ? "500 LP added ✓" : "Request rejected"}
          </span>
        )}
      </td>
    </tr>
  );
};

const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

// ── Main Page ─────────────────────────────────────────────────
const AdminWalletRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [historyMentee, setHistoryMentee] = useState(null);
  const { showToast } = useToast();

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminAxiosInstance.get("/admin/leap-requests");
      setRequests(res.data.requests || res.data || []);
    } catch (err) {
      showToast({ message: "Failed to load requests.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (reqId) => {
    try {
      setActionLoading(reqId);
      await adminAxiosInstance.patch(
        `/admin/leap-requests/${reqId}/approve`,
        {},
      );
      setRequests((prev) =>
        prev.map((r) => (r._id === reqId ? { ...r, status: "approved" } : r)),
      );
      showToast({ message: "500 LP added to mentee's wallet successfully!", type: "success" });
    } catch (err) {
      showToast({ essage: err.response?.data?.message || "Approval failed.", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (reqId) => {
    try {
      setActionLoading(reqId);
      await adminAxiosInstance.patch(
        `/admin/leap-requests/${reqId}/reject`,
        {},
      );
      setRequests((prev) =>
        prev.map((r) => (r._id === reqId ? { ...r, status: "rejected" } : r)),
      );
      showToast({ message: "Request rejected.", type: "error" });
    } catch (err) {
      showToast({ message: err.response?.data?.message || "Rejection failed.", type: "error" });
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = requests.filter((r) => {
    const matchTab = activeTab === "all" || r.status === activeTab;
    const name = r.mentee?.name?.toLowerCase() || "";
    const email = r.mentee?.email?.toLowerCase() || "";
    const matchSearch =
      name.includes(search.toLowerCase()) ||
      email.includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = {
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
    all: requests.length,
  };

  return (
  <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Wallet Requests
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and approve mentee Leap Points refill requests
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{
                background: "#fef3c7",
                color: "#92400e",
                border: "1px solid #fde68a",
              }}
            >
              {counts.pending} Pending
            </div>
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{
                background: "#d1fae5",
                color: "#065f46",
                border: "1px solid #a7f3d0",
              }}
            >
              {counts.approved} Approved
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Tabs + Search */}
          <div className="flex items-center justify-between gap-4 px-5 pt-4 pb-0 flex-wrap border-b border-slate-100">
            <div className="flex items-center gap-1">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2"
                  style={{
                    borderBottomColor:
                      activeTab === tab.key ? "#2563eb" : "transparent",
                    color: activeTab === tab.key ? "#2563eb" : "#64748b",
                    background: "transparent",
                  }}
                >
                  {tab.label}
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                    style={{
                      background: activeTab === tab.key ? "#dbeafe" : "#f1f5f9",
                      color: activeTab === tab.key ? "#1e40af" : "#94a3b8",
                    }}
                  >
                    {counts[tab.key]}
                  </span>
                </button>
              ))}
            </div>
            <div className="relative mb-2">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2"
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100"
                style={{ width: 200 }}
              />
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-3">
              <svg
                className="animate-spin w-7 h-7 text-blue-600"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="#dbeafe"
                  strokeWidth="3"
                />
                <path
                  d="M12 2a10 10 0 0 1 10 10"
                  stroke="#2563eb"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              <p className="text-xs text-slate-400 font-medium">
                Loading requests…
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              label={
                search
                  ? `No results for "${search}"`
                  : activeTab === "pending"
                    ? "No pending requests 🎉"
                    : `No ${activeTab} requests yet`
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr
                    style={{
                      background: "#f8fafc",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    {[
                      "Mentee",
                      "Current Balance",
                      "Requested On",
                      "Status",
                      "History",
                      "Actions",
                    ].map((col) => (
                      <th
                        key={col}
                        className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((req) => (
                    <RequestRow
                      key={req._id}
                      req={req}
                      onApprove={handleApprove}
                      onReject={handleReject}
                      actionLoading={actionLoading}
                      onViewHistory={setHistoryMentee}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
      </div>

      {/* History Modal */}
      {historyMentee && (
        <MenteeHistoryModal
          mentee={historyMentee}
          onClose={() => setHistoryMentee(null)}
        />
      )}
  </>
  );
};

export default AdminWalletRequests;
