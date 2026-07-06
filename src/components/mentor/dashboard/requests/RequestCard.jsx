// src/components/mentor/dashboard/requests/RequestCard.jsx
import { useState } from "react";
import ReferredByProfileModal from "./ReferredByProfileModal";
import PropTypes from "prop-types";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = dateStr.includes("T")
    ? new Date(dateStr)
    : new Date(dateStr + "T00:00:00");
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const formatTime = (time) => {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
};

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    badge: "bg-blue-100   text-blue-800   border-blue-300",
    dot: "bg-blue-500",
  },
  accepted: {
    label: "Accepted",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
    dot: "bg-emerald-500",
  },
  ongoing: {
    label: "Ongoing",
    badge: "bg-indigo-100 text-indigo-800  border-indigo-300",
    dot: "bg-indigo-500",
  },
  rejected: {
    label: "Rejected",
    badge: "bg-red-100    text-red-700     border-red-300",
    dot: "bg-red-500",
  },
  referred: {
    label: "Referred",
    badge: "bg-violet-100 text-violet-800  border-violet-300",
    dot: "bg-violet-500",
  },
  completed: {
    label: "Completed",
    badge: "bg-slate-100  text-slate-700   border-slate-300",
    dot: "bg-slate-500",
  },
};

const getCfg = (s) => STATUS_CONFIG[s] || STATUS_CONFIG.pending;

const slotShape = PropTypes.shape({
  day: PropTypes.string,
  date: PropTypes.string,
  startTime: PropTypes.string,
  endTime: PropTypes.string,
});

const requestShape = PropTypes.shape({
  mentee: PropTypes.shape({ name: PropTypes.string, email: PropTypes.string }),
  message: PropTypes.string,
  selectedSlots: PropTypes.arrayOf(slotShape),
  confirmedSlot: slotShape,
  status: PropTypes.string,
  requestedAt: PropTypes.string,
  referredBy: PropTypes.shape({ name: PropTypes.string, email: PropTypes.string }),
  referredByProfile: PropTypes.object,
});
// ── Slots Detail Modal ────────────────────────────────────────
const SlotsModal = ({ request, onClose }) => {
  const {
    mentee,
    selectedSlots = [],
    confirmedSlot,
    status,
    message,
    requestedAt,
  } = request;
  const cfg = getCfg(status);
  const initials = mentee?.name
    ? mentee.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Top strip */}
        <div className="bg-blue-50 border-b border-blue-100 rounded-t-3xl px-6 pt-6 pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center text-blue-700 text-base font-bold shrink-0">
                {initials}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  {mentee?.name || "—"}
                </h2>
                {/* <p className="text-sm text-slate-500">{mentee?.email}</p> */}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0 transition-colors"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#475569"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 pb-6 pt-5 space-y-4">
          {/* Message */}
          {message && (
            <div className="bg-slate-50 border-l-4 border-blue-400 rounded-r-xl px-4 py-3">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1">
                Message
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                "{message}"
              </p>
            </div>
          )}

          {/* Referral info */}
          {request.referredBy && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-300 flex items-center justify-center text-amber-900 text-xs font-bold shrink-0">
                {request.referredBy?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || "?"}
              </div>
              <div>
                <p className="text-sm font-bold text-amber-800">
                  Referred by {request.referredBy?.name}
                </p>
                {request.referredBy?.email && (
                  <p className="text-xs text-amber-600">
                    {request.referredBy.email}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Confirmed slot */}
          {status === "accepted" && confirmedSlot && (
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Confirmed Session
              </p>
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <span className="text-sm font-semibold text-emerald-800">
                  {confirmedSlot.day}, {formatDate(confirmedSlot.date)}
                </span>
                <span className="text-sm font-bold text-emerald-700">
                  {formatTime(confirmedSlot.startTime)} –{" "}
                  {formatTime(confirmedSlot.endTime)}
                </span>
              </div>
            </div>
          )}

          {/* All proposed slots */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Proposed Slots
              <span className="ml-1.5 text-blue-600 normal-case font-semibold">
                ({selectedSlots.length})
              </span>
            </p>
            <div className="space-y-2">
              {selectedSlots.map((slot, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-700">
                      {slot.day}, {formatDate(slot.date)}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-blue-700">
                    {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center">
            Requested on {formatDate(requestedAt)}
          </p>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
SlotsModal.propTypes = {
  request: requestShape.isRequired,
  onClose: PropTypes.func.isRequired,
};
// ── Main Request Card ─────────────────────────────────────────
const RequestCard = ({ request, onViewProfile }) => {
  const [showSlots, setShowSlots] = useState(false);
  const [showReferredByProfile, setShowReferredByProfile] = useState(false);

  const {
    mentee,
    message,
    selectedSlots = [],
    confirmedSlot,
    status,
    requestedAt,
  } = request;

  const cfg = getCfg(status);
  const isPending = status === "pending";

  const initials = mentee?.name
    ? mentee.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const displaySlot = isPending
    ? selectedSlots[0]
    : confirmedSlot || selectedSlots[0];

  const extraSlots = selectedSlots.length - 1;

  const referredByMentor = request.referredBy
    ? {
        name: request.referredBy.name || "",
        email: request.referredBy.email || "",
        currentRole: request.referredByProfile?.currentRole || "",
        company: request.referredByProfile?.company || "",
        industry: request.referredByProfile?.industry || "",
        bio: request.referredByProfile?.bio || "",
        hourlyRate: request.referredByProfile?.hourlyRate || null,
        avgRating: request.referredByProfile?.avgRating || 0,
        yearsOfExperience: request.referredByProfile?.yearsOfExperience || null,
        profilePicture: request.referredByProfile?.profilePicture || null,
        skills: request.referredByProfile?.skills || [],
      }
    : null;

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col">
        {/* ── Soft blue header ── */}
        <div className="bg-blue-50 border-b border-blue-100 px-5 pt-5 pb-4">
          <div className="flex items-center justify-between gap-2">
            {/* Avatar + Name + Email */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center text-blue-700 text-sm font-bold shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-slate-800 truncate leading-snug">
                  {mentee?.name || "—"}
                </p>
                {/* <p className="text-sm text-slate-500 truncate mt-0.5">
                  {mentee?.email || "—"}
                </p> */}
              </div>
            </div>

            {/* Status badge */}
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${cfg.badge}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
              {cfg.label}
            </span>
          </div>
        </div>

        {/* ── Card body ── */}
        <div className="px-5 pt-4 pb-5 flex flex-col gap-3 flex-1">
          {/* ── Slot: stacked date + time in one unified chip ── */}
          {displaySlot && (
            <div className="flex items-center gap-2">
              {/* Date + time block */}
              <div className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 flex flex-col gap-1">
                {/* Date row */}
                <div className="flex items-center gap-1.5">
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#64748b"
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
                  <p className="text-xs font-medium text-slate-900 truncate">
                    {displaySlot.day}, {formatDate(displaySlot.date)}
                  </p>
                </div>
                {/* Time row */}
                <div className="flex items-center gap-1.5">
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <p className="text-xs font-bold text-blue-700">
                    {formatTime(displaySlot.startTime)}
                    <span className="mx-1 font-normal text-slate-400">–</span>
                    {formatTime(displaySlot.endTime)}
                  </p>
                </div>
              </div>

              {/* +N more slots button */}
              {extraSlots > 0 && isPending && (
                <button
                  type="button"
                  onClick={() => setShowSlots(true)}
                  className="shrink-0 h-full px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors leading-none"
                >
                  +{extraSlots}
                  <br />
                  <span className="text-[9px] font-semibold text-blue-500">
                    more
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Referred by banner */}
          {request.referredBy && (
            <button
              type="button"
              onClick={() => setShowReferredByProfile(true)}
              className="w-full flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 hover:bg-amber-100 transition-colors text-left"
            >
              <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                {request.referredBy?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || "?"}
              </div>
              <p className="text-sm text-amber-800 font-semibold flex-1 truncate">
                Referred by{" "}
                <span className="font-bold">{request.referredBy?.name}</span>
              </p>
              <svg
                width="9"
                height="9"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#92400e"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="shrink-0"
              >
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Referred out */}
          {status === "referred" && (
            <div className="flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-lg px-3 py-2.5">
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6d28d9"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 1l4 4-4 4" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <path d="M7 23l-4-4 4-4" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
              <p className="text-sm text-violet-700 font-semibold">
                Referred to another mentor
              </p>
            </div>
          )}

          {/* Message preview */}
          {message && (
            <div className="border-l-2 border-slate-200 pl-3">
              <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                "{message}"
              </p>
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <p className="text-sm text-slate-500 font-semibold shrink-0">
              {formatDate(requestedAt)}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowSlots(true)}
                className="px-1 py-1.5 rounded-lg bg-blue-100 border-2 border-blue-200 text-blue-700 text-sm font-semibold hover:bg-blue-200 transition-all whitespace-nowrap"
              >
                View Details
              </button>
              {isPending && (
                <button
                  type="button"
                  onClick={() => onViewProfile(request)}
                  className="px-4 py-2  rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-sm whitespace-nowrap"
                >
                  Respond
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSlots && (
        <SlotsModal request={request} onClose={() => setShowSlots(false)} />
      )}

      {showReferredByProfile && referredByMentor && (
        <ReferredByProfileModal
          mentor={referredByMentor}
          onClose={() => setShowReferredByProfile(false)}
        />
      )}
    </>
  );
};
RequestCard.propTypes = {
  request: requestShape.isRequired,
  onViewProfile: PropTypes.func.isRequired,
};
export default RequestCard;
