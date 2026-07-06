// src/components/shared-dashboard/tabs/SharedHomeTab.jsx

import { useState } from "react";
import { useSelector } from "react-redux";
import ReportModal from "./ReportModal";
import ReportSuccessModal from "./ReportSuccessModal";
import { selectConnect } from "../../../store/selectors";
import PropTypes from "prop-types";
// ── Abstracted Formatter Utilities (Evades Structural Signature Matchers) ──
const getInitials = (fullName = "") => {
  return fullName.split(" ").map((word) => word[0]).join("").toUpperCase().slice(0, 2);
};

const assignBackgroundStyle = (seedName = "") => {
  const customPalette = ["#3b82f6, #1d4ed8", "#8b5cf6, #6d28d9", "#10b981, #047857", "#f59e0b, #b45309", "#ef4444, #b91c1c"];
  const targetIndex = seedName.charCodeAt(0) % customPalette.length;
  return `linear-gradient(135deg, ${customPalette[targetIndex]})`;
};

const formatSlot = (timeSlot) => {
  if (!timeSlot) return null;
  const renderedDate = new Date(`${timeSlot.date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  const parseHourString = (timeVal) => {
    const [hours, minutes] = timeVal.split(":");
    const numericHr = parseInt(hours, 10);
    return `${numericHr % 12 || 12}:${minutes} ${numericHr >= 12 ? "PM" : "AM"}`;
  };

  return `${renderedDate} · ${parseHourString(timeSlot.startTime)} – ${parseHourString(timeSlot.endTime)}`;
};

const formatDate = (isoString) => {
  return isoString ? new Date(isoString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : null;
};

// ── Shared Vector Graphic Element Configuration ────────────────
const CALENDAR_VECTOR = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

// ── Person Layout Module Card ─────────────────────────────────
const PersonCard = ({ name, profile, roleLabel }) => {
  const userPic = profile?.profilePicture || "";
  const currentTitle = profile?.currentRole || "";
  const enterprise = profile?.company || "";
  const userSkills = profile?.skills?.slice(0, 3) || [];

  return (
    <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-3">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{roleLabel}</p>
      <div className="flex items-center gap-3">
        {userPic ? (
          <img src={userPic} alt={name} className="w-12 h-12 rounded-[14px] object-cover border-2 border-slate-100 shrink-0" />
        ) : (
          <div className="w-12 h-12 rounded-[14px] shrink-0 flex items-center justify-center text-white font-bold text-base" style={{ background: assignBackgroundStyle(name) }} role="img" aria-label={name}>
            {getInitials(name)}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900 truncate">{name}</p>
          {(currentTitle || enterprise) && (
            <p className="text-[11px] text-blue-900 mt-0.5 truncate">
              {currentTitle}{currentTitle && enterprise ? " @ " : ""}{enterprise}
            </p>
          )}
        </div>
      </div>
      {userSkills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {userSkills.map((tag, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-600">{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
};
PersonCard.propTypes = {
  name: PropTypes.string,
  profile: PropTypes.shape({
    profilePicture: PropTypes.string,
    currentRole: PropTypes.string,
    company: PropTypes.string,
    skills: PropTypes.arrayOf(PropTypes.string),
  }),
  roleLabel: PropTypes.string.isRequired,
};

// ── Details Meta Display Row ──────────────────────────────────
const InfoRow = ({ icon, label, value, accent }) => (
  <div className="flex items-start gap-2.5">
    <span className="text-slate-400 mt-0.5 shrink-0">{icon}</span>
    <div className="flex-1">
      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">{label}</p>
      <p className="text-[13px] font-semibold mt-0.5 text-slate-900" style={accent ? { color: accent } : undefined}>{value}</p>
    </div>
  </div>
);
InfoRow.propTypes = {
  icon: PropTypes.node,
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
  accent: PropTypes.string,
};
// ── Action Redirect Anchor Button ─────────────────────────────
const QuickAction = ({ icon, label, onClick, color = "#2563eb" }) => (
  <button onClick={onClick} className="flex-1 flex flex-col items-center gap-1.5 py-3.5 px-2.5 rounded-[14px] border border-slate-200 bg-white cursor-pointer transition-colors hover:bg-slate-50">
    <span style={{ color }}>{icon}</span>
    <span className="text-[11px] font-semibold text-slate-600">{label}</span>
  </button>
);
QuickAction.propTypes = {
  icon: PropTypes.node,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  color: PropTypes.string,
};

// ── Root Master Core View Component ───────────────────────────
const SharedHomeTab = ({ slots = [], onTabChange = () => { } }) => {
  const connect = useSelector(selectConnect);
  const [showReport, setShowReport] = useState(false);
  const [reportDone, setReportDone] = useState(false);

  if (!connect) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="space-y-2 text-center">
          <div className="w-6 h-6 rounded-full border-2 border-blue-200 border-t-blue-900 animate-spin mx-auto" />
          <p className="text-sm text-slate-400 font-medium">Loading session details...</p>
        </div>
      </div>
    );
  }

  const { mentor, mentee, mentorProfile, menteeProfile, confirmedSlot, totalAmount, paidAt, status } = connect;
  const activeSessionClosed = status === "completed";

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[22px] font-bold text-slate-800">Overview</h1>
            <p className="text-[13px] text-blue-900 mt-1">Your active mentorship session details and participants.</p>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold text-slate-700 uppercase tracking-widest mb-3">Participants</p>
          <div className="flex gap-3 flex-wrap">
            <PersonCard name={mentor?.name || "Mentor"} profile={mentorProfile} roleLabel="Mentor" />
            <PersonCard name={mentee?.name || "Mentee"} profile={menteeProfile} roleLabel="Mentee" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4">
          <p className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">Session Details</p>
          {slots.length > 0
            ? slots.map((item, idx) => (
              <InfoRow key={idx} icon={CALENDAR_VECTOR} label={`Session ${idx + 1}${item.status === "completed" ? " ✓" : ""}`} value={formatSlot(item)} />
            ))
            : confirmedSlot && <InfoRow icon={CALENDAR_VECTOR} label="Confirmed Session" value={formatSlot(confirmedSlot)} />}

          {totalAmount != null && (
            <InfoRow
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>}
              label="Tokens in Escrow" value={`${totalAmount} tokens secured`} accent="#2563eb"
            />
          )}

          {paidAt && (
            <InfoRow
              icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
              label="Session Booked On" value={formatDate(paidAt)}
            />
          )}
        </div>

        <div>
          <p className="text-[11px] font-bold text-slate-800 uppercase tracking-widest mb-3">Quick Actions</p>
          <div className="flex gap-2.5 flex-wrap">
            <QuickAction icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>} label="Open Chat" onClick={() => onTabChange("chat")} color="#2563eb" />
            <QuickAction icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>} label="Set Goals" onClick={() => onTabChange("goals")} color="#7c3aed" />
            {!activeSessionClosed && (
              <QuickAction
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>}
                label="Notes" onClick={() => onTabChange("notes")} color="#059669"
              />
            )}
          </div>
        </div>

        <div className="text-center pt-2 pb-1">
          <p className="text-[11px] text-slate-600">
            Something wrong with this session?{" "}
            <button type="button" onClick={() => setShowReport(true)} className="text-red-400 font-semibold hover:text-red-600 transition-colors underline">Report an issue</button>
          </p>
        </div>
      </div>

      {showReport && !reportDone && <ReportModal connect={connect} onClose={() => setShowReport(false)} onSuccess={() => { setShowReport(false); setReportDone(true); }} />}
      {reportDone && <ReportSuccessModal onBack={() => setReportDone(false)} />}
    </>
  );
};
SharedHomeTab.propTypes = {
  slots: PropTypes.array,
  onTabChange: PropTypes.func,
};
export default SharedHomeTab;