// src/components/ui/connects/ConnectCard.jsx
import PropTypes from "prop-types";
const getInitials = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const AVATAR_GRADIENTS = [
  "from-blue-500 to-blue-700",
  "from-violet-500 to-violet-700",
  "from-emerald-500 to-emerald-700",
  "from-rose-500 to-rose-700",
  "from-amber-500 to-amber-700",
];

const getGradient = (name = "") => {
  const index = name.charCodeAt(0) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
};

const formatSlot = (slot) => {
  if (!slot) return null;
  const date = new Date(slot.date + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const getParts = (t) => {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const display = hour % 12 || 12;
    return { display: `${display}:${m}`, ampm };
  };
  const start = getParts(slot.startTime);
  const end = getParts(slot.endTime);
  // Omit AM/PM from start if same period as end to save space
  const startStr =
    start.ampm === end.ampm ? start.display : `${start.display} ${start.ampm}`;
  return `${slot.day}, ${date} · ${startStr} – ${end.display} ${end.ampm}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const SkillTag = ({ label }) => (
  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold border border-slate-200">
    {label}
  </span>
);
SkillTag.propTypes = {
  label: PropTypes.string.isRequired,
};
const Avatar = ({ name, picture, isCompleted }) => {
  if (picture) {
    return (
      <img
        src={picture}
        alt={name}
        className={`w-14 h-14 rounded-2xl object-cover border-2 shadow-sm shrink-0
          ${isCompleted ? "border-slate-200 opacity-75" : "border-white"}`}
      />
    );
  }
  return (
    <div
      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getGradient(name)}
      flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-sm
      ${isCompleted ? "opacity-60" : ""}`}
    >
      {getInitials(name)}
    </div>
  );
};
Avatar.propTypes = {
  name: PropTypes.string,
  picture: PropTypes.string,
  isCompleted: PropTypes.bool,
};
const ConnectCard = ({
  name,
  person,
  session,
  tokenLabel,
  onDashboardClick,
  isCompleted = false,
}) => {
  const role = person?.currentRole || "";
  const company = person?.company || "";
  const skills = person?.skills?.slice(0, 3) || [];
  const picture = person?.profilePicture || "";

  const slot = session?.confirmedSlot;
  const paidAt = session?.paidAt;
  const completedAt = session?.completedAt;
  const total = session?.totalAmount;

  return (
    <div
      className={`rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200 h-full
      ${
        isCompleted
          ? "bg-slate-50 border border-slate-200 hover:border-slate-300"
          : "bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      {/* ── Top row ── */}
      <div className="flex items-start gap-3">
        <Avatar name={name} picture={picture} isCompleted={isCompleted} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p
                className={`text-sm font-bold truncate
                ${isCompleted ? "text-slate-700" : "text-slate-800"}`}
              >
                {name}
              </p>
              {(role || company) && (
                <p className="text-xs text-blue-900 truncate mt-0.5">
                  {role}
                  {role && company ? " @ " : ""}
                  {company}
                </p>
              )}
            </div>

            {isCompleted ? (
              <span
                className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full
                bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-bold"
              >
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Completed
              </span>
            ) : (
              <span
                className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full
                bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-bold"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            )}
          </div>

          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {skills.map((s, i) => (
                <SkillTag key={i} label={s} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-slate-100" />

      {/* ── Session info — flex-1 pushes button to bottom ── */}
      <div className="flex-1 space-y-2">
        {!isCompleted && total != null && (
          <div className="flex items-center gap-2">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2563EB"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span className="text-xs font-semibold text-blue-900">
              {tokenLabel}
            </span>
          </div>
        )}

        {isCompleted && total != null && (
          <div className="flex items-center gap-2">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#22c55e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span className="text-xs font-semibold text-emerald-600">
              {total} tokens released
            </span>
          </div>
        )}

        {slot && (
          <div className="flex items-center gap-2">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#64748B"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-xs text-slate-700">{formatSlot(slot)}</span>
          </div>
        )}

        {isCompleted && completedAt && (
          <div className="flex items-center gap-2">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#64748B"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-xs text-slate-700">
              Completed {formatDate(completedAt)}
            </span>
          </div>
        )}

        {!isCompleted && paidAt && (
          <div className="flex items-center gap-2">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#64748B"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-xs text-slate-700">
              Started {formatDate(paidAt)}
            </span>
          </div>
        )}
      </div>

      {/* ── CTA button — always at bottom ── */}
      <button
        type="button"
        onClick={onDashboardClick}
        className={`w-full py-2.5 rounded-xl text-xs font-bold
          active:scale-[0.98] transition-all flex items-center justify-center gap-2
          ${
            isCompleted
              ? "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
              : "bg-blue-900 text-white hover:bg-blue-700"
          }`}
      >
        {isCompleted ? "View Session & Notes" : "Go to Shared Dashboard"}
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </div>
  );
};
ConnectCard.propTypes = {
  name: PropTypes.string.isRequired,
  person: PropTypes.shape({
    currentRole: PropTypes.string,
    company: PropTypes.string,
    skills: PropTypes.arrayOf(PropTypes.string),
    profilePicture: PropTypes.string,
  }),
  session: PropTypes.shape({
    confirmedSlot: PropTypes.object,
    paidAt: PropTypes.string,
    completedAt: PropTypes.string,
    totalAmount: PropTypes.number,
  }),
  tokenLabel: PropTypes.node,
  onDashboardClick: PropTypes.func.isRequired,
  isCompleted: PropTypes.bool,
};

export default ConnectCard;
