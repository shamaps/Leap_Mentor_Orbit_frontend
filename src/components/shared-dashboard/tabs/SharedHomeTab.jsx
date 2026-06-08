// src/components/shared-dashboard/tabs/SharedHomeTab.jsx
import { useState } from "react";
import ReportModal from "./ReportModal";
import ReportSuccessModal from "./ReportSuccessModal";

const getInitials = (name = "") =>
  name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

const GRADIENTS = [
  "linear-gradient(135deg, #3b82f6, #1d4ed8)",
  "linear-gradient(135deg, #8b5cf6, #6d28d9)",
  "linear-gradient(135deg, #10b981, #047857)",
  "linear-gradient(135deg, #f59e0b, #b45309)",
  "linear-gradient(135deg, #ef4444, #b91c1c)",
];

const getGradient = (name = "") =>
  GRADIENTS[name.charCodeAt(0) % GRADIENTS.length];

const formatSlot = (slot) => {
  if (!slot) return null;
  const date = new Date(slot.date + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
  const fmt = (t) => {
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    return `${hour % 12 || 12}:${m} ${ampm}`;
  };
  return `${date} · ${fmt(slot.startTime)} – ${fmt(slot.endTime)}`;
};

const formatDate = (d) => d
  ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  : null;

// ── Person Card ───────────────────────────────────────────────
const PersonCard = ({ name, profile, roleLabel }) => {
  const picture = profile?.profilePicture || "";
  const role = profile?.currentRole || "";
  const company = profile?.company || "";
  const skills = profile?.skills?.slice(0, 3) || [];

  return (
    <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-3">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {roleLabel}
      </p>
      <div className="flex items-center gap-3">
        {picture ? (
          <img src={picture} alt={name}
            className="w-12 h-12 rounded-[14px] object-cover border-2 border-slate-100 shrink-0" />
        ) : (
          <div
            className="w-12 h-12 rounded-[14px] shrink-0 flex items-center justify-center text-white font-bold text-base"
            style={{ background: getGradient(name) }}
            role="img" aria-label={name}
          >
            {getInitials(name)}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{name}</p>
          {(role || company) && (
            <p className="text-[11px] text-blue-900 mt-0.5 truncate">
              {role}{role && company ? " @ " : ""}{company}
            </p>
          )}
        </div>
      </div>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {skills.map((s, i) => (
            <span key={i}
              className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-600">
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Info Row ──────────────────────────────────────────────────
const InfoRow = ({ icon, label, value, accent }) => (
  <div className="flex items-start gap-2.5">
    <span className="text-slate-400 mt-0.5 shrink-0">{icon}</span>
    <div className="flex-1">
      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{label}</p>
      <p className={`text-[13px] font-semibold mt-0.5 ${accent ? "" : "text-slate-900"}`}
        style={accent ? { color: accent } : undefined}>
        {value}
      </p>
    </div>
  </div>
);

// ── Quick Action Button ───────────────────────────────────────
const QuickAction = ({ icon, label, onClick, color = "#2563eb" }) => (
  <button
    onClick={onClick}
    className="flex-1 flex flex-col items-center gap-1.5 py-3.5 px-2.5 rounded-[14px]
      border border-slate-200 bg-white cursor-pointer transition-colors duration-150 hover:bg-slate-50"
  >
    <span style={{ color }}>{icon}</span>
    <span className="text-[11px] font-semibold text-slate-600">{label}</span>
  </button>
);

// ── Main ──────────────────────────────────────────────────────
const SharedHomeTab = ({ connect, slots = [], onTabChange = () => { } }) => {
  const [showReport, setShowReport] = useState(false);
  const [reportDone, setReportDone] = useState(false);

  // ✅ Null guard — connect is still loading or failed to fetch
  if (!connect) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="flex flex-col items-center gap-3">
          <span className="w-6 h-6 rounded-full border-2 border-blue-200 border-t-blue-900 animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading session details...</p>
        </div>
      </div>
    );
  }

  const {
    mentor, mentee,
    mentorProfile, menteeProfile,
    confirmedSlot, totalAmount, paidAt,
    status,
  } = connect;

  const isCompleted = status === "completed";

  return (
    <>
      <div className="flex flex-col gap-6">

        {/* ── Header ──────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-slate-800">Overview</h1>
            <p className="text-[13px] text-blue-900 mt-1">
              Your active mentorship session details and participants.
            </p>
          </div>
        </div>

        {/* Participants */}
        <div>
          <p className="text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-3">
            Participants
          </p>
          <div className="flex gap-3 flex-wrap">
            <PersonCard name={mentor?.name || "Mentor"} profile={mentorProfile} roleLabel="Mentor" />
            <PersonCard name={mentee?.name || "Mentee"} profile={menteeProfile} roleLabel="Mentee" />
          </div>
        </div>

        {/* Session Details */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">
            Session Details
          </p>
          {slots.length > 0
            ? slots.map((slot, i) => (
              <InfoRow
                key={i}
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                }
                label={`Session ${i + 1}${slot.status === "completed" ? " ✓" : ""}`}
                value={formatSlot(slot)}
              />
            ))
            : confirmedSlot && (
              <InfoRow
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                }
                label="Confirmed Session"
                value={formatSlot(confirmedSlot)}
              />
            )
          }
          {totalAmount != null && (
            <InfoRow
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              }
              label="Tokens in Escrow"
              value={`${totalAmount} tokens secured`}
              accent="#2563eb"
            />
          )}
          {paidAt && (
            <InfoRow
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              }
              label="Session Booked On"
              value={formatDate(paidAt)}
            />
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <p className="text-[11px] font-bold text-slate-800 uppercase tracking-widest mb-3">
            Quick Actions
          </p>
          <div className="flex gap-2.5 flex-wrap">
            <QuickAction
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              }
              label="Open Chat"
              onClick={() => onTabChange("chat")}
              color="#2563eb"
            />
            <QuickAction
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              }
              label="Set Goals"
              onClick={() => onTabChange("goals")}
              color="#7c3aed"
            />
            {!isCompleted && (
              <QuickAction
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                }
                label="Notes"
                onClick={() => onTabChange("notes")}
                color="#059669"
              />
            )}
          </div>
        </div>

        {/* Report link */}
        <div className="text-center pt-2 pb-1">
          <p className="text-[11px] text-slate-600">
            Something wrong with this session?{" "}
            <button
              type="button"
              onClick={() => setShowReport(true)}
              className="text-red-400 font-semibold hover:text-red-600 hover:underline transition-colors"
            >
              Report an issue
            </button>
          </p>
        </div>
      </div>

      {/* Report Modal */}
      {showReport && !reportDone && (
        <ReportModal
          connect={connect}
          onClose={() => setShowReport(false)}
          onSuccess={() => { setShowReport(false); setReportDone(true); }}
        />
      )}

      {/* Success Modal */}
      {reportDone && (
        <ReportSuccessModal onBack={() => setReportDone(false)} />
      )}
    </>
  );
};

export default SharedHomeTab;