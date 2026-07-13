import { useState } from "react";
import { useInvoiceDownload } from "../../../../hooks/useInvoiceDownload";
import {
  STATUS_STYLES,
  STATUS_LABELS,
  formatDate,
  formatTime,
  getInitials,
} from "./constants";
import StatusBadge from "../../../common/StatusBadge";
import EscrowPaymentModal from "./EscrowPaymentModal";
import PropTypes from "prop-types";
import MentorProfileModal from "../findMentors/MentorProfileModal";
import { mapReferredMentor } from "../../../../mappers/connectRequestMapper";
// ── Slot row ────────────────────────────────────────────────
const SlotRow = ({ slot, isConfirmed }) => (
  <div
    className={`flex items-center justify-between rounded-xl px-3 py-2 border ${isConfirmed
        ? "bg-emerald-50 border-emerald-200"
        : "bg-slate-50 border-slate-100"
      }`}
  >
    <span className={`text-xs font-semibold ${isConfirmed ? "text-emerald-700" : "text-slate-600"}`}>
      {slot.day},{" "}
      {new Date(slot.date + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })}
    </span>
    <span className={`text-xs font-bold ${isConfirmed ? "text-emerald-600" : "text-blue-500"}`}>
      {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
    </span>
  </div>
);
SlotRow.propTypes = {
  slot: PropTypes.object.isRequired,
  isConfirmed: PropTypes.bool,
};
// ── Shared Content Sections (Fixes SonarQube Duplications) ──
const SlotsSection = ({ slots = [], heading, isConfirmed = false }) => (
  <div>
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
      {heading}
    </p>
    <div className="space-y-1.5">
      {slots.map((slot) => (
        <SlotRow key={`${slot.date}-${slot.startTime}`} slot={slot} isConfirmed={isConfirmed} />
      ))}
    </div>
  </div>
);
SlotsSection.propTypes = {
  slots: PropTypes.array,
  heading: PropTypes.string.isRequired,
  isConfirmed: PropTypes.bool,
};
const UserMessage = ({ content }) => {
  if (!content) return null;
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">
        Your Message
      </p>
      <p className="text-xs text-slate-600 italic">"{content}"</p>
    </div>
  );
};
UserMessage.propTypes = {
  content: PropTypes.string,
};

// ── Pending content ─────────────────────────────────────────
const PendingContent = ({ request, onDelete }) => {
  const { selectedSlots = [], message, requestedAt } = request;

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400">Sent on {formatDate(requestedAt)}</p>
      <SlotsSection slots={selectedSlots} heading="Proposed Times" isConfirmed={false} />
      <UserMessage content={message} />
      <button
        type="button"
        onClick={onDelete}
        className="w-full py-2.5 rounded-xl border-2 border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition-all"
      >
        Cancel Request
      </button>
    </div>
  );
};
PendingContent.propTypes = {
  request: PropTypes.shape({
    selectedSlots: PropTypes.array,
    message: PropTypes.string,
    requestedAt: PropTypes.string,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
};
// ── Accepted content ────────────────────────────────────────
const AcceptedContent = ({ request, onClose, onPayClick }) => {
  const { selectedSlots = [], message } = request;

  return (
    <div className="space-y-4">
      <SlotsSection slots={selectedSlots} heading={`Confirmed Sessions (${selectedSlots.length})`} isConfirmed={true} />
      <UserMessage content={message} />
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <p className="text-xs text-amber-700">
          Complete payment to confirm your session. Tokens are held securely until the session is done.
        </p>
      </div>
      <button
        type="button"
        onClick={onPayClick}
        className="w-full py-2.5 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-700 transition-all"
      >
        Make Payment
      </button>
      <button
        type="button"
        onClick={onClose}
        className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all"
      >
        Close
      </button>
    </div>
  );
};
AcceptedContent.propTypes = {
  request: PropTypes.shape({
    selectedSlots: PropTypes.array,
    message: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onPayClick: PropTypes.func.isRequired,
};
// ── Ongoing content ─────────────────────────────────────────
const OngoingContent = ({ request, onClose }) => {
  const { confirmedSlot, sessionRate, sessionCount, totalAmount, paidAt } = request;
  const { downloading, error: downloadError, downloadInvoice } = useInvoiceDownload();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
        <svg
          width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <p className="text-xs text-blue-700 font-medium">{totalAmount} tokens secured in escrow</p>
      </div>

      {confirmedSlot && (
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Session</p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
            <p className="text-xs font-semibold text-emerald-700">
              {confirmedSlot.day}, {new Date(confirmedSlot.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
            <p className="text-xs font-bold text-emerald-600 mt-0.5">
              {formatTime(confirmedSlot.startTime)} – {formatTime(confirmedSlot.endTime)}
            </p>
          </div>
        </div>
      )}

      {(sessionRate || sessionCount) && (
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Payment Summary</p>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Rate per session</span>
            <span className="font-semibold text-slate-700">{sessionRate} tokens</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Sessions</span>
            <span className="font-semibold text-slate-700">× {sessionCount}</span>
          </div>
          <div className="flex justify-between text-xs pt-1.5 border-t border-slate-200">
            <span className="font-bold text-slate-700">Total locked</span>
            <span className="font-bold text-blue-900">{totalAmount} tokens</span>
          </div>
        </div>
      )}

      {paidAt && <p className="text-[10px] text-slate-400 text-center">Paid on {formatDate(paidAt)}</p>}

      <button
        type="button"
        onClick={() => downloadInvoice(request._id)}
        disabled={downloading}
        className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {downloading ? (
          <>
            <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" />
            <span>Downloading...</span>
          </>
        ) : (
          <>
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Invoice
          </>
        )}
      </button>
      {downloadError && <p className="text-xs text-red-500 text-center -mt-2">{downloadError}</p>}
      <button
        type="button"
        onClick={onClose}
        className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all"
      >
        Close
      </button>
    </div>
  );
};
OngoingContent.propTypes = {
  request: PropTypes.shape({
    _id: PropTypes.string,
    confirmedSlot: PropTypes.object,
    sessionRate: PropTypes.number,
    sessionCount: PropTypes.number,
    totalAmount: PropTypes.number,
    paidAt: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};
// ── Completed content ───────────────────────────────────────
const CompletedContent = ({ request, onClose }) => {
  const { confirmedSlot, totalAmount, completedAt } = request;

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center text-center py-2 space-y-2">
        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-500">
          <svg
            width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">Session Completed</p>
          <p className="text-xs text-slate-400 mt-0.5">{totalAmount} tokens released to mentor</p>
        </div>
      </div>

      {confirmedSlot && (
        <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
          <p className="text-xs font-semibold text-slate-700">
            {confirmedSlot.day}, {new Date(confirmedSlot.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{formatTime(confirmedSlot.startTime)} – {formatTime(confirmedSlot.endTime)}</p>
        </div>
      )}

      {completedAt && <p className="text-[10px] text-slate-400 text-center">Completed on {formatDate(completedAt)}</p>}
      <button
        type="button"
        onClick={onClose}
        className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 transition-all"
      >
        Close
      </button>
    </div>
  );
};
CompletedContent.propTypes = {
  request: PropTypes.shape({
    confirmedSlot: PropTypes.object,
    totalAmount: PropTypes.number,
    completedAt: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};
// ── Referred content ────────────────────────────────────────
const ReferredContent = ({ request, onDelete }) => {
  const { mentor, referredTo, referredToProfile, selectedSlots = [], message } = request;
  const [showReferredProfile, setShowReferredProfile] = useState(false);

  const referredMentorForModal = mapReferredMentor(referredTo, referredToProfile);

  return (
    <>
      <div className="space-y-4">
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 space-y-2">
          <p className="text-[10px] font-bold text-violet-400 uppercase tracking-wide">Referral Path</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white border border-violet-200 rounded-lg px-3 py-2">
              <p className="text-[10px] text-slate-400 font-medium">Original Mentor</p>
              <p className="text-xs font-bold text-slate-700 truncate">{mentor?.name || "—"}</p>
            </div>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M5 12h14" /><path d="M12 5l7 7-7 7" />
            </svg>
            <div className="flex-1 bg-white border border-violet-200 rounded-lg px-3 py-2">
              <p className="text-[10px] text-slate-400 font-medium">Referred To</p>
              <p className="text-xs font-bold text-slate-700 truncate">{referredTo?.name || "—"}</p>
              {referredToProfile?.currentRole && <p className="text-[10px] text-slate-400 truncate">{referredToProfile.currentRole}</p>}
            </div>
          </div>
        </div>

        {referredMentorForModal && (
          <button
            type="button"
            onClick={() => setShowReferredProfile(true)}
            className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-all flex items-center justify-center gap-2"
          >
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            View Referred Mentor Profile
          </button>
        )}

        <SlotsSection slots={selectedSlots} heading="Proposed Times" isConfirmed={false} />
        <UserMessage content={message} />
        <button
          type="button"
          onClick={onDelete}
          className="w-full py-2.5 rounded-xl border-2 border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition-all"
        >
          Delete Request
        </button>
      </div>

      {showReferredProfile && referredMentorForModal && (
        <MentorProfileModal mentor={referredMentorForModal} onClose={() => setShowReferredProfile(false)} />
      )}
    </>
  );
};
ReferredContent.propTypes = {
  request: PropTypes.shape({
    mentor: PropTypes.shape({ name: PropTypes.string }),
    referredTo: PropTypes.shape({ _id: PropTypes.string, name: PropTypes.string, email: PropTypes.string }),
    referredToProfile: PropTypes.object,
    selectedSlots: PropTypes.array,
    message: PropTypes.string,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
};
// ── Rejected content ────────────────────────────────────────
const RejectedContent = ({ request, onClose }) => {
  const { selectedSlots = [], message, respondedAt } = request;

  return (
    <div className="space-y-4">
      {respondedAt && <p className="text-xs text-slate-400">Declined on {formatDate(respondedAt)}</p>}
      <SlotsSection slots={selectedSlots} heading="Proposed Times" isConfirmed={false} />
      <UserMessage content={message} />
      <button
        type="button"
        onClick={onClose}
        className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 transition-all"
      >
        Close
      </button>
    </div>
  );
};
RejectedContent.propTypes = {
  request: PropTypes.shape({
    selectedSlots: PropTypes.array,
    message: PropTypes.string,
    respondedAt: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};
// ── Main Drawer ─────────────────────────────────────────────
const DetailDrawer = ({ request, onClose, onDelete, onUpdateRequest }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (!request) return null;

  const { mentor, status, requestedAt, respondedAt } = request;
  const initials = getInitials(mentor?.name);

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/10 border-none p-0 cursor-default"
        onClick={onClose}
        aria-label="Close details"
      />
      <div className="fixed right-0 top-14 bottom-0 w-80 z-50 bg-white border-l border-slate-100 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Request Details</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-50">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-800 text-sm truncate">{mentor?.name}</p>
            <p className="text-xs text-slate-400 truncate">{mentor?.email}</p>
          </div>
          <StatusBadge status={status} variant="history" />
        </div>

        <div className={`mx-5 mt-4 rounded-xl px-3 py-2.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
          {STATUS_LABELS[status]}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {status === "pending" && (
            <PendingContent request={request} onDelete={() => { onDelete(request._id); onClose(); }} />
          )}
          {status === "accepted" && (
            <AcceptedContent request={request} onClose={onClose} onPayClick={() => setShowPaymentModal(true)} />
          )}
          {status === "ongoing" && <OngoingContent request={request} onClose={onClose} />}
          {status === "completed" && <CompletedContent request={request} onClose={onClose} />}
          {status === "referred" && (
            <ReferredContent request={request} onDelete={() => { onDelete(request._id); onClose(); }} />
          )}
          {status === "rejected" && <RejectedContent request={request} onClose={onClose} />}
        </div>

        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">Sent {formatDate(requestedAt)}</span>
          {respondedAt && <span className="text-[10px] text-slate-400">Responded {formatDate(respondedAt)}</span>}
        </div>
      </div>

      {showPaymentModal && (
        <EscrowPaymentModal
          request={request}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={(patch) => onUpdateRequest(request._id, patch)}
        />
      )}
    </>
  );
};
DetailDrawer.propTypes = {
  request: PropTypes.shape({
    _id: PropTypes.string,
    mentor: PropTypes.shape({ name: PropTypes.string, email: PropTypes.string }),
    status: PropTypes.string,
    requestedAt: PropTypes.string,
    respondedAt: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onUpdateRequest: PropTypes.func.isRequired,
};
export default DetailDrawer;