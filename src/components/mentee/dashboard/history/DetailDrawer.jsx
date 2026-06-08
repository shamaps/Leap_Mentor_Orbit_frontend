import { useState } from "react";
import axiosInstance from "../../../../utils/axiosInstance";
import { STATUS_STYLES, STATUS_LABELS, formatDate, formatTime, getInitials } from "./constants";
import StatusBadge from "../../../atoms/StatusBadge";
import EscrowPaymentModal from "./EscrowPaymentModal";
import MentorProfileModal from "../findMentors/MentorProfileModal";

// ── Slot row ────────────────────────────────────────────────
const SlotRow = ({ slot, isConfirmed }) => (
  <div className={`flex items-center justify-between rounded-xl px-3 py-2 border ${
    isConfirmed ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-100"
  }`}>
    <span className={`text-xs font-semibold ${isConfirmed ? "text-emerald-700" : "text-slate-600"}`}>
      {slot.day}, {new Date(slot.date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
    </span>
    <span className={`text-xs font-bold ${isConfirmed ? "text-emerald-600" : "text-blue-500"}`}>
      {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
    </span>
  </div>
);

// ── Pending content ─────────────────────────────────────────
const PendingContent = ({ request, onDelete }) => {
  const { selectedSlots = [], message, requestedAt } = request;

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400">Sent on {formatDate(requestedAt)}</p>

      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Proposed Times</p>
        <div className="space-y-1.5">
          {selectedSlots.map((slot, i) => (
            <SlotRow key={i} slot={slot} isConfirmed={false} />
          ))}
        </div>
      </div>

      {message && (
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Your Message</p>
          <p className="text-xs text-slate-600 italic">"{message}"</p>
        </div>
      )}

      <button type="button" onClick={onDelete}
        className="w-full py-2.5 rounded-xl border-2 border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition-all">
        Cancel Request
      </button>
    </div>
  );
};

// ── Accepted content ────────────────────────────────────────
const AcceptedContent = ({ request, onClose, onPayClick }) => {
  const { confirmedSlot, selectedSlots = [], message } = request;

  return (
    <div className="space-y-4">
     {/* ✅ All selected slots are confirmed — show all as green */}
<div>
  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
    Confirmed Sessions ({selectedSlots.length})
  </p>
  <div className="space-y-1.5">
    {selectedSlots.map((slot, i) => (
      <SlotRow key={i} slot={slot} isConfirmed={true} />
    ))}
  </div>
</div>

      
      {message && (
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Your Message</p>
          <p className="text-xs text-slate-600 italic">"{message}"</p>
        </div>
      )}

      <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#D97706"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
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
        className="w-full py-2.5 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-700 transition-all">
        Make Payment
      </button>

      <button type="button" onClick={onClose}
        className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all">
        Close
      </button>
    </div>
  );
};

// ── Ongoing content ─────────────────────────────────────────
const OngoingContent = ({ request, onClose }) => {
  const { confirmedSlot, sessionRate, sessionCount, totalAmount, paidAt } = request;

  // ✅ NEW
  const [downloading, setDownloading] = useState(false);

  // NEW
  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await axiosInstance.get(`/invoices/${request._id}`, {
        responseType: "arraybuffer",
      });

      const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice-${request._id.slice(-6).toUpperCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to download invoice. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563EB"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <p className="text-xs text-blue-700 font-medium">
          {totalAmount} tokens secured in escrow
        </p>
      </div>

      {confirmedSlot && (
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Session</p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2.5">
            <p className="text-xs font-semibold text-emerald-700">
              {confirmedSlot.day}, {new Date(confirmedSlot.date + "T00:00:00").toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric"
              })}
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

      {paidAt && (
        <p className="text-[10px] text-slate-400 text-center">
          Paid on {formatDate(paidAt)}
        </p>
      )}

      {/* ✅ NEW — Download Invoice button */}
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {downloading ? (
          <>
            <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" />
            Downloading...
          </>
        ) : (
          <>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download Invoice
          </>
        )}
      </button>

      <button type="button" onClick={onClose}
        className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-all">
        Close
      </button>
    </div>
  );
};

// ── Completed content ───────────────────────────────────────
const CompletedContent = ({ request, onClose }) => {
  const { confirmedSlot, totalAmount, completedAt } = request;

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center text-center py-2 space-y-2">
        <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200
          flex items-center justify-center text-emerald-500">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">Session Completed</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {totalAmount} tokens released to mentor
          </p>
        </div>
      </div>

      {confirmedSlot && (
        <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
          <p className="text-xs font-semibold text-slate-700">
            {confirmedSlot.day}, {new Date(confirmedSlot.date + "T00:00:00").toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric"
            })}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {formatTime(confirmedSlot.startTime)} – {formatTime(confirmedSlot.endTime)}
          </p>
        </div>
      )}

      {completedAt && (
        <p className="text-[10px] text-slate-400 text-center">
          Completed on {formatDate(completedAt)}
        </p>
      )}

      <button type="button" onClick={onClose}
        className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 transition-all">
        Close
      </button>
    </div>
  );
};

// ── Referred content ────────────────────────────────────────
const ReferredContent = ({ request, onDelete }) => {
  const { mentor, referredTo, referredToProfile, selectedSlots = [], message } = request;

  const [showReferredProfile, setShowReferredProfile] = useState(false);

  const referredMentorForModal = referredTo
    ? {
        user:              { _id: referredTo._id, name: referredTo.name, email: referredTo.email },
        currentRole:       referredToProfile?.currentRole       || "",
        company:           referredToProfile?.company           || "",
        industry:          referredToProfile?.industry          || "",
        bio:               referredToProfile?.bio               || "",
        hourlyRate:        referredToProfile?.hourlyRate        || null,
        avgRating:         referredToProfile?.avgRating         || 0,
        yearsOfExperience: referredToProfile?.yearsOfExperience || null,
        profilePicture:    referredToProfile?.profilePicture    || null,
        skills:            referredToProfile?.skills            || [],
      }
    : null;

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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AED"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>
            </svg>
            <div className="flex-1 bg-white border border-violet-200 rounded-lg px-3 py-2">
              <p className="text-[10px] text-slate-400 font-medium">Referred To</p>
              <p className="text-xs font-bold text-slate-700 truncate">{referredTo?.name || "—"}</p>
              {referredToProfile?.currentRole && (
                <p className="text-[10px] text-slate-400 truncate">{referredToProfile.currentRole}</p>
              )}
            </div>
          </div>
        </div>

        {referredMentorForModal && (
          <button
            type="button"
            onClick={() => setShowReferredProfile(true)}
            className="w-full py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 transition-all flex items-center justify-center gap-2"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            View Referred Mentor Profile
          </button>
        )}

        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Proposed Times</p>
          <div className="space-y-1.5">
            {selectedSlots.map((slot, i) => <SlotRow key={i} slot={slot} isConfirmed={false} />)}
          </div>
        </div>

        {message && (
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Your Message</p>
            <p className="text-xs text-slate-600 italic">"{message}"</p>
          </div>
        )}

        <button type="button" onClick={onDelete}
          className="w-full py-2.5 rounded-xl border-2 border-red-200 text-red-500 text-xs font-semibold hover:bg-red-50 transition-all">
          Delete Request
        </button>
      </div>

      {showReferredProfile && referredMentorForModal && (
        <MentorProfileModal
          mentor={referredMentorForModal}
          onClose={() => setShowReferredProfile(false)}
        />
      )}
    </>
  );
};

// ── Rejected content ────────────────────────────────────────
const RejectedContent = ({ request, onClose }) => {
  const { selectedSlots = [], message, respondedAt } = request;

  return (
    <div className="space-y-4">
      {respondedAt && (
        <p className="text-xs text-slate-400">Declined on {formatDate(respondedAt)}</p>
      )}
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Proposed Times</p>
        <div className="space-y-1.5">
          {selectedSlots.map((slot, i) => <SlotRow key={i} slot={slot} isConfirmed={false} />)}
        </div>
      </div>
      {message && (
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Your Message</p>
          <p className="text-xs text-slate-600 italic">"{message}"</p>
        </div>
      )}
      <button type="button" onClick={onClose}
        className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 transition-all">
        Close
      </button>
    </div>
  );
};

// ── Main Drawer ─────────────────────────────────────────────
const DetailDrawer = ({ request, onClose, onDelete, onUpdateRequest }) => {
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  if (!request) return null;

  const { mentor, status, requestedAt, respondedAt } = request;
  const initials = getInitials(mentor?.name);

  const handlePaymentSuccess = (patch) => {
    onUpdateRequest(request._id, patch);
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/10" onClick={onClose} />
      <div className="fixed right-0 top-14 bottom-0 w-80 z-50 bg-white border-l border-slate-100 shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">Request Details</h3>
          <button type="button" onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Mentor info */}
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

        {/* Status banner */}
        <div className={`mx-5 mt-4 rounded-xl px-3 py-2.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
          {STATUS_LABELS[status]}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {status === "pending" && (
            <PendingContent
              request={request}
              onDelete={() => { onDelete(request._id); onClose(); }}
            />
          )}
          {status === "accepted" && (
            <AcceptedContent
              request={request}
              onClose={onClose}
              onPayClick={() => setShowPaymentModal(true)}
            />
          )}
          {status === "ongoing" && (
            <OngoingContent request={request} onClose={onClose} />
          )}
          {status === "completed" && (
            <CompletedContent request={request} onClose={onClose} />
          )}
          {status === "referred" && (
            <ReferredContent
              request={request}
              onDelete={() => { onDelete(request._id); onClose(); }}
            />
          )}
          {status === "rejected" && (
            <RejectedContent request={request} onClose={onClose} />
          )}
        </div>

        {/* Footer dates */}
        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">Sent {formatDate(requestedAt)}</span>
          {respondedAt && (
            <span className="text-[10px] text-slate-400">Responded {formatDate(respondedAt)}</span>
          )}
        </div>
      </div>

      {/* ✅ Escrow Payment Modal */}
      {showPaymentModal && (
        <EscrowPaymentModal
          request={request}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
};

export default DetailDrawer;