// src/components/mentee/dashboard/history/HistoryTable.jsx
import StatusBadge from "../../../common/StatusBadge";
import { formatDate, getInitials } from "./constants";
import EmptyState from "../../../common/EmptyState";
const DeleteIcon = ({ onClick, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className="flex items-center justify-center w-7 h-7 rounded-lg border border-red-300 text-red-400 bg-red-50 hover:border-red-400 hover:text-red-500 hover:bg-red-100 transition-all"
  >
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  </button>
);

const ViewButton = ({ onClick, isSelected }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
      isSelected
        ? "bg-slate-100 text-slate-600 border-slate-200"
        : "bg-blue-900 text-white border-blue-900 hover:bg-blue-700"
    }`}
  >
    {isSelected ? "Close" : "View"}
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
    </svg>
  </button>
);

// Avatar color based on name
const AVATAR_GRADIENTS = [
  "from-blue-500 to-blue-700",
  "from-violet-500 to-violet-700",
  "from-emerald-500 to-emerald-700",
  "from-rose-500 to-rose-700",
  "from-amber-500 to-amber-700",
];
const getGradient = (name = "") =>
  AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];

const HistoryTable = ({ requests, selected, onSelect, onDelete }) => {
  if (requests.length === 0) {
    return (
      <EmptyState
        icon={
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        }
        message="No requests found"
        subMessage="Try a different filter or send a new request."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Column header */}
      <div className="grid grid-cols-[2.5fr_1.5fr_1.2fr_1fr_1fr] gap-4 px-5 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
        {["Mentor", "Skill / Role", "Date Sent", "Status", "Actions"].map(
          (col) => (
            <p
              key={col}
              className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest"
            >
              {col}
            </p>
          ),
        )}
      </div>

      {/* Cards */}
      {requests.map((request) => {
        const mentor = request.mentor;
        const role = request.mentorProfile?.currentRole || "—";
        const mentorName = mentor?.name || "—";
        const initials = getInitials(mentorName);
        const status = request.status;
        const isSelected = selected?._id === request._id;
        const gradient = getGradient(mentorName);

        return (
          <div
            key={request._id}
            className={`bg-white rounded-2xl border shadow-sm px-5 py-4 grid grid-cols-[2.5fr_1.5fr_1.2fr_1fr_1fr] gap-4 items-center transition-all ${
              isSelected
                ? "border-blue-200 shadow-blue-50 bg-blue-50/30"
                : "border-slate-100 hover:border-slate-200 hover:shadow-md"
            }`}
          >
            {/* Mentor avatar + name */}
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm`}
              >
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {mentorName}
                </p>
              </div>
            </div>

            {/* Role */}
            <div className="min-w-0">
              <p className="text-sm text-slate-600 truncate font-medium">
                {role}
              </p>
            </div>

            {/* Date */}
            <div>
              <p className="text-sm text-slate-800">
                {formatDate(request.requestedAt)}
              </p>
            </div>

            {/* Status */}
            <div>
              <StatusBadge status={status} variant="history" />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <ViewButton
                onClick={() => onSelect(isSelected ? null : request)}
                isSelected={isSelected}
              />
              <DeleteIcon
                onClick={() => onDelete(request._id)}
                title="Delete request"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default HistoryTable;
