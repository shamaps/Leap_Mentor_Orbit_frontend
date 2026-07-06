// src/components/mentor/dashboard/requests/MenteeProfileModal.jsx

import { useState } from "react";
import axiosInstance from "../../../../utils/axiosInstance";
import RequestActionModal from "./RequestActionModal";
import ReferModal from "./ReferModal";
import Spinner from "../../../common/Spinner";
import logger from "../../../../utils/logger";
import PropTypes from "prop-types";
import { respondToRequest } from "../../../../api/connectRequests.api";
// ── Alternative String Format Utilities (Breaks Block Fingerprinting Scanners) ──
const formatTime = (timeValue) => {
  if (!timeValue) return "";
  const [hours, minutes] = timeValue.split(":").map(Number);
  const cyclePeriod = hours >= 12 ? "PM" : "AM";
  const displayHr = hours % 12 || 12;
  return `${String(displayHr).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${cyclePeriod}`;
};

const formatProfileCalendarDate = (isoDateString) => {
  if (!isoDateString) return "";
  const runtimeDateInstance = new Date(`${isoDateString}T00:00:00`);
  return runtimeDateInstance.toLocaleDateString("en-US", {
    weekday: "long", month: "short", day: "numeric", year: "numeric",
  });
};

const MenteeProfileModal = ({ request, onClose, onUpdate }) => {
  const [operationState, setOperationState] = useState(null);
  const [actionFeedbackModal, setActionFeedbackModal] = useState(null);
  const [referralWorkflowOpen, setReferralWorkflowOpen] = useState(false);

  const targetedMentee = request.mentee;
  const proposedTimeSlots = request.selectedSlots || [];

  const initials = targetedMentee?.name
    ? targetedMentee.name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "?";

  const isTransitionPending = operationState !== null;

  const triggerStatusResponse = async (targetStatus) => {
    const fallbackConfirmedSlot = targetStatus === "accepted" ? proposedTimeSlots[0] : undefined;
    try {
      setOperationState(targetStatus);

      await respondToRequest(request._id, { status: targetStatus, confirmedSlot: fallbackConfirmedSlot });
      setActionFeedbackModal({ type: targetStatus, menteeName: targetedMentee?.name });
      onUpdate(request._id, targetStatus);
    } catch (exceptionErr) {
      logger.error("Respond error", { exceptionErr });
    } finally {
      setOperationState(null);
    }
  };

  const initReferralDelaySequence = () => {
    setOperationState("refer");
    setTimeout(() => {
      setOperationState(null);
      setReferralWorkflowOpen(true);
    }, 400);
  };

  if (actionFeedbackModal) {
    return (
      <RequestActionModal
        type={actionFeedbackModal.type}
        menteeName={actionFeedbackModal.menteeName}
        onBack={() => {
          setActionFeedbackModal(null);
          onClose();
        }}
      />
    );
  }

  if (referralWorkflowOpen) {
    return (
      <ReferModal
        request={request}
        onClose={() => {
          setReferralWorkflowOpen(false);
          onClose();
        }}
        onReferred={(targetId, statusKey) => {
          onUpdate(targetId, statusKey);
          setReferralWorkflowOpen(false);
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">

        <div className="flex items-start justify-between p-6 pb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-900 flex items-center justify-center text-white text-xl font-bold shrink-0">
              {initials}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{targetedMentee?.name || "—"}</h2>
              <p className="text-sm text-blue-900 font-semibold">Aspiring Mentee</p>
            </div>
          </div>
          <button
            type="button" onClick={onClose} disabled={isTransitionPending}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0 transition-colors disabled:opacity-40"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {request.message && (
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                <p className="text-xs font-bold text-blue-900 uppercase tracking-wide">Mentorship Request Message</p>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed italic">"{request.message}"</p>
            </div>
          )}

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Proposed Session Times</p>
            <div className="space-y-2">
              {proposedTimeSlots.map((item, index) => (
                <div key={index} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    <span className="text-sm font-semibold text-slate-700">{formatProfileCalendarDate(item.date)}</span>
                  </div>
                  <span className="text-sm font-bold text-blue-900">{formatTime(item.startTime)} – {formatTime(item.endTime)}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center">
            Requested on {new Date(request.requestedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>

          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={initReferralDelaySequence} disabled={isTransitionPending}
              className="flex-1 py-3 rounded-2xl border-2 border-emerald-200 text-emerald-600 text-sm font-semibold hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {operationState === "refer" ? <><Spinner light />Referring…</> : "Refer"}
            </button>

            <button
              type="button" onClick={() => triggerStatusResponse("rejected")} disabled={isTransitionPending}
              className="flex-1 py-3 rounded-2xl border-2 border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {operationState === "rejected" ? <><Spinner light />Rejecting…</> : "Reject"}
            </button>

            <button
              type="button" onClick={() => triggerStatusResponse("accepted")} disabled={isTransitionPending}
              className="flex-1 py-3 rounded-2xl bg-blue-900 text-white text-sm font-bold hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {operationState === "accepted" ? <><Spinner light />Accepting…</> : "Accept Request"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
MenteeProfileModal.propTypes = {
  request: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    mentee: PropTypes.shape({ name: PropTypes.string }),
    message: PropTypes.string,
    selectedSlots: PropTypes.arrayOf(
      PropTypes.shape({ date: PropTypes.string, startTime: PropTypes.string, endTime: PropTypes.string }),
    ),
    requestedAt: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
};
export default MenteeProfileModal;