// src/features/shared-dashboard/view/components/tabs/goals/SessionCard.tsx
import { useState } from "react";
import StatusBadge from "@/shared/components/StatusBadge";
import CancelModal from "./CancelModal";
import RescheduleModal from "./RescheduleModal";
import MeetingLinkSection from "./MeetingLinkSection";
import CompletionSection from "./CompletionSection";
import {
  type Slot,
  type BookedSlot,
  type NewSlotSelection,
  formatSlotDate,
  formatTime,
  isMoreThan12HrsAway,
  getSessionStatus,
} from "./sessionCard.utils";

// ── Main SessionCard (composer) ───────────────────────────────
const SessionCard = ({
  slot,
  slotIndex,
  viewerRole,
  otherName,
  savingSlots,
  onSetLink,
  onMarkComplete,
  onCancelSlot,
  onRescheduleSlot,
  allSlots,
  connectRequestId,
  onSessionComplete,
}: {
  slot?: Slot | null;
  slotIndex: number;
  viewerRole: string;
  otherName: string;
  savingSlots: Iterable<number>;
  onSetLink: (slotIndex: number, link: string) => Promise<{ success?: boolean } | undefined>;
  onMarkComplete: (idx: number) => Promise<{ success?: boolean } | undefined>;
  onCancelSlot: (idx: number, reason: string) => Promise<{ success?: boolean } | undefined>;
  onRescheduleSlot: (idx: number, newSlot: NewSlotSelection) => Promise<{ success?: boolean } | undefined>;
  allSlots: BookedSlot[];
  connectRequestId: string;
  onSessionComplete?: (idx: number) => void;
}) => {
  const saving = [...savingSlots].includes(slotIndex);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  const cancelled = slot?.status === "cancelled";
  const bothDone = Boolean(slot?.menteeMarked && slot?.mentorMarked);

  const canCancel = !cancelled && !bothDone;
  const canReschedule = !cancelled && !bothDone && isMoreThan12HrsAway(slot);
  const sessionStatus = getSessionStatus(cancelled, bothDone, slot);

  const handleCancel = async (reason: string) => {
    const result = await onCancelSlot(slotIndex, reason);
    if (result?.success) setShowCancelModal(false);
  };

  const handleReschedule = async (newSlot: NewSlotSelection) => {
    const result = await onRescheduleSlot(slotIndex, newSlot);
    if (result?.success) setShowRescheduleModal(false);
  };

  let cardStateClass = "border-slate-200";
  if (cancelled) {
    cardStateClass = "opacity-60 border-red-100";
  } else if (bothDone) {
    cardStateClass = "border-emerald-200";
  }

  return (
    <>
      <div
        className={`bg-white border rounded-2xl p-4 flex flex-col gap-3 transition-opacity
        ${cardStateClass}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Session {slotIndex + 1}
              </p>
              {slot?.isRescheduled && !cancelled && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 uppercase tracking-wide">
                  Rescheduled
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-slate-800">
              {formatSlotDate(slot)}
            </p>
            <p className="text-xs font-semibold text-blue-600 mt-0.5">
              {formatTime(slot?.startTime)} – {formatTime(slot?.endTime)}
            </p>
          </div>
          <StatusBadge status={sessionStatus} />
        </div>

        {cancelled ? (
          <div className="border-t border-red-100 pt-3">
            <div className="flex items-start gap-2.5 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0 mt-0.5"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <div>
                <p className="text-xs font-bold text-red-600">
                  Cancelled by{" "}
                  {slot?.cancelledBy === viewerRole ? "you" : otherName}
                </p>
                {slot?.cancellationReason &&
                  slot.cancellationReason !== "rescheduled" && (
                    <p className="text-xs text-red-500 mt-0.5 italic">
                      &quot;{slot.cancellationReason}&quot;
                    </p>
                  )}
                {slot?.isRescheduled && (
                  <p className="text-xs text-blue-500 mt-0.5 font-medium">
                    ↳ Rescheduled to a new slot
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {!bothDone && (
              <MeetingLinkSection
                meetingLink={slot?.meetingLink}
                viewerRole={viewerRole}
                onSetLink={(link) => onSetLink(slotIndex, link)}
                saving={saving}
              />
            )}

            <CompletionSection
              menteeMarked={slot?.menteeMarked}
              mentorMarked={slot?.mentorMarked}
              viewerRole={viewerRole}
              otherName={otherName}
              onMarkComplete={() => onMarkComplete(slotIndex)}
              onSessionComplete={
                onSessionComplete ? () => onSessionComplete(slotIndex) : undefined
              }
            />
          </>
        )}

        {(canCancel || canReschedule) && (
          <div className="border-t border-slate-100 pt-3 flex gap-2">
            {!cancelled &&
              !bothDone &&
              (isMoreThan12HrsAway(slot) ? (
                <button
                  onClick={() => setShowRescheduleModal(true)}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-blue-200
                    bg-blue-50 text-xs font-bold text-blue-600 hover:bg-blue-100 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M23 4v6h-6" />
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                  </svg>
                  Reschedule
                </button>
              ) : (
                <div
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200
                  bg-slate-50 text-xs font-semibold text-slate-400 cursor-not-allowed"
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Reschedule unavailable (before 12hrs)
                </div>
              ))}
            {canCancel && (
              <button
                onClick={() => setShowCancelModal(true)}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200
                  bg-red-50 text-xs font-bold text-red-500 hover:bg-red-100 transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                Cancel Session
              </button>
            )}
          </div>
        )}
      </div>

      {showCancelModal && (
        <CancelModal
          slot={slot}
          onConfirm={handleCancel}
          onClose={() => setShowCancelModal(false)}
          saving={saving}
        />
      )}

      {showRescheduleModal && (
        <RescheduleModal
          slotIndex={slotIndex}
          connectRequestId={connectRequestId}
          existingSlots={allSlots}
          onConfirm={handleReschedule}
          onClose={() => setShowRescheduleModal(false)}
          saving={saving}
        />
      )}
    </>
  );
};



export default SessionCard;