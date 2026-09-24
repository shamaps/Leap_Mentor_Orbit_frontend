// src/features/admin/view/pages/AdminWalletRequests.jsx
import { useMenteeHistoryModal } from "../../presenter/useMenteeHistoryModal";
import { useAdminWalletRequests } from "../../presenter/useAdminWalletRequests";
import EmptyState from "@/shared/components/EmptyState";
import PropTypes from "prop-types";
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
  AVATAR_COLORS[name.codePointAt(0) % AVATAR_COLORS.length];

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
StatusBadge.propTypes = {
  status: PropTypes.string,
};
// ── Mentee History Modal ──────────────────────────────────────
const MenteeHistoryModal = ({ mentee, onClose }) => {
  const { engagements, loading, expandedId, toggleExpand } = useMenteeHistoryModal(mentee);

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
          {(() => {
            if (loading) {
              return (
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
              );
            }

            if (engagements.length === 0) {
              return (
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
              );
            }

            return (
              <>
                {engagements.map((eng) => {
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
                                <tr key={`${slot.date}-${slot.startTime}`} className="border-t border-slate-100 bg-white hover:bg-slate-50">
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
            })}
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
};
MenteeHistoryModal.propTypes = {
  mentee: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
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
RequestRow.propTypes = {
  req: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    mentee: PropTypes.shape({
      name: PropTypes.string,
      email: PropTypes.string,
      profilePicture: PropTypes.string,
    }),
    currentBalance: PropTypes.number,
    createdAt: PropTypes.string,
    status: PropTypes.string,
  }).isRequired,
  onApprove: PropTypes.func.isRequired,
  onReject: PropTypes.func.isRequired,
  actionLoading: PropTypes.string,
  onViewHistory: PropTypes.func.isRequired,
};
const LoadingSpinner = () => (
  <div className="py-20 flex flex-col items-center gap-3">
    <svg className="animate-spin w-7 h-7 text-blue-600" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#dbeafe" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" />
    </svg>
    <p className="text-xs text-slate-400 font-medium">Loading requests…</p>
  </div>
);
// ── Main Page ─────────────────────────────────────────────────
const AdminWalletRequests = () => {
  const {
    requests,
    loading,
    actionLoading,
    activeTab,
    setActiveTab,
    search,
    setSearch,
    historyMentee,
    setHistoryMentee,
    handleApprove,
    handleReject,
    filtered,
    counts,
  } = useAdminWalletRequests();

  const getEmptyRequestsLabel = (search, activeTab) => {
    if (search) return `No results for "${search}"`;
    if (activeTab === "pending") return "No pending requests 🎉";
    return `No ${activeTab} requests yet`;
  };
  let content;
  if (loading) {
    content = <LoadingSpinner />;
  } else if (filtered.length === 0) {
    content = <EmptyState label={getEmptyRequestsLabel(search, activeTab)} />;
  } else {
    content = (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              {["Mentee", "Current Balance", "Requested On", "Status", "History", "Actions"].map((col) => (
                <th key={col} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-slate-400">
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
    );
  }
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
          {content}
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
