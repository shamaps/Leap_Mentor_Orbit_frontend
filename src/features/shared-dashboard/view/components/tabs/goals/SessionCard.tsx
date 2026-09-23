// src/components/shared-dashboard/tabs/goals/SessionCard.jsx
import { useState } from "react";
import StatusBadge from "@/shared/components/StatusBadge";
import Spinner from "@/shared/components/Spinner";
// Spinner is still a plain JS component (migrates in Phase 3.5); its inferred
// prop types mark every prop as required. Cast locally to avoid coupling
// this migration to that one.

const SpinnerAny = Spinner as any;
import { useRescheduleAvailability } from "@/features/mentor/presenter/useRescheduleAvailability";

import {
  type Slot,
  type AvailabilityGroup,
  type NewSlotSelection,
  formatSlotDate,
  formatTime,
  formatTimeShort,
  isMoreThan12HrsAway,
  getSessionStatus,
  isActive,
  isValidMeetingLink,
} from "./sessionCard.utils";

// ── Cancel Confirm Modal ──────────────────────────────────────
const CancelModal = ({
  slot,
  slotIndex,
  onConfirm,
  onClose,
  saving,
}: {
  slot?: Slot | null;
  slotIndex: number;
  onConfirm: (idx: number, reason: string) => void;
  onClose: () => void;
  saving?: boolean;
}) => {
  const [reason, setReason] = useState("");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div>
            <p className="text-base font-bold text-slate-800">
              Cancel this session?
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {formatSlotDate(slot)} &bull; {formatTime(slot?.startTime)} –{" "}
              {formatTime(slot?.endTime)}
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          This session slot will be permanently cancelled. The other party will
          be notified immediately.
        </p>

        <div>
          <label htmlFor="cancel-reason" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
            Reason <span className="font-normal normal-case">(optional)</span>
          </label>
          <textarea
            id="cancel-reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Schedule conflict, emergency..."
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700
              bg-white outline-none focus:border-red-300 transition-colors placeholder:text-slate-400
              resize-none"
          />
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-sm
              font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Keep Session
          </button>
          <button
            onClick={() => onConfirm(slotIndex, reason)}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-bold
              hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            {saving ? <><SpinnerAny size="sm" light />Cancelling...</>
              : (
                "Yes, Cancel It"
              )}
          </button>
        </div>
      </div>
    </div>
  );
};

const getSlotPillClass = (selected: boolean, booked: boolean): string => {
  if (selected) return "bg-blue-900 border-blue-900 shadow-lg shadow-blue-100 scale-[1.02]";
  if (booked) return "bg-slate-50 border-slate-100 cursor-not-allowed opacity-40";
  return "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md cursor-pointer";
};
// ── Slot Pill ─────────────────────────────────────────────────
const SlotPill = ({
  slot,
  group,
  selected,
  onSelect,
  booked,
}: {
  slot: Slot;
  group: AvailabilityGroup;
  selected: boolean;
  onSelect: (slot: NewSlotSelection) => void;
  booked: boolean;
}) => (
  <button
    type="button"
    disabled={booked}
    onClick={() =>
      !booked &&
      onSelect({
        day: group.day,
        date: group.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })
    }
    className={`
  relative flex items-center justify-center
  rounded-2xl px-3 h-12 text-center border w-full
  transition-all duration-200
  ${getSlotPillClass(selected, booked)}
`}
  >
    {selected && (
      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full border-2 border-blue-900 flex items-center justify-center shadow-sm z-10">
        <svg
          width="8"
          height="8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2563EB"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </span>
    )}
    <span
      className={`text-[11px] font-semibold whitespace-nowrap ${selected ? "text-white" : "text-slate-700"}`}
    >
      {formatTimeShort(slot.startTime)} – {formatTimeShort(slot.endTime)}
    </span>
  </button>
);

// ── Slot Tab Picker ───────────────────────────────────────────
const SlotTabPicker = ({
  availability,
  selectedSlot,
  onSelect,
  bookedSlots,
}: {
  availability: AvailabilityGroup[];
  selectedSlot: NewSlotSelection | null;
  onSelect: (slot: NewSlotSelection) => void;
  bookedSlots: { date?: string; startTime?: string; endTime?: string }[];
}) => {
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  const activeGroup = availability[activeDayIndex] || null;

  const isBooked = (group: AvailabilityGroup, slot: Slot): boolean =>
    bookedSlots.some(
      (b) =>
        b.date === group.date &&
        b.startTime === slot.startTime &&
        b.endTime === slot.endTime,
    );

  const freeSlots = activeGroup
    ? activeGroup.slots.filter((s) => !isBooked(activeGroup, s))
    : [];

  const totalAvailable = availability.reduce(
    (acc: number, g) => acc + g.slots.filter((s) => !isBooked(g, s)).length,
    0,
  );

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          <p className="text-sm font-bold text-slate-700">Available Slots</p>
        </div>
        {totalAvailable > 0 && (
          <span className="text-xs text-slate-400">
            {totalAvailable} available
          </span>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Day tabs */}
        <div className="flex gap-2">
          {availability.map((group, idx) => {
            const isActiveTab = activeDayIndex === idx;
            const date = new Date(group.date + "T00:00:00");
            const dayLabel = date.toLocaleDateString("en-US", {
              weekday: "short",
            });
            const dateLabel = date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            });
            const freeCnt = group.slots.filter(
              (s) => !isBooked(group, s),
            ).length;
            let dayTabStateClass = "bg-white border-slate-200 hover:border-blue-200 hover:bg-blue-50";
            if (isActiveTab) {
              dayTabStateClass = "bg-blue-900 border-blue-900 shadow-md";
            } else if (freeCnt === 0) {
              dayTabStateClass = "bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed";
            }
            return (
              <button
                key={group.date}
                type="button"
                onClick={() => setActiveDayIndex(idx)}
                className={`
                  flex-1 flex flex-col items-center justify-center
                  py-2 px-1 rounded-xl border text-center transition-all duration-200
                  ${dayTabStateClass}
                `}
                disabled={freeCnt === 0}
              >
                <span
                  className={`text-[11px] font-bold leading-tight ${isActiveTab ? "text-white" : "text-slate-600"}`}
                >
                  {dayLabel}
                </span>
                <span
                  className={`text-[9px] font-medium mt-0.5 ${isActiveTab ? "text-blue-100" : "text-slate-400"}`}
                >
                  {dateLabel}
                </span>
              </button>
            );
          })}
        </div>

        {/* Slot pills */}
        {activeGroup && (
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-600">
                {new Date(activeGroup.date + "T00:00:00").toLocaleDateString(
                  "en-US",
                  { weekday: "long", month: "short", day: "numeric" },
                )}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {freeSlots.length} open
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {freeSlots.map((slot) => (
                <SlotPill
                  key={slot.startTime}
                  slot={slot}
                  group={activeGroup}
                  selected={
                    selectedSlot?.date === activeGroup.date &&
                    selectedSlot?.startTime === slot.startTime
                  }
                  onSelect={onSelect}
                  booked={isBooked(activeGroup, slot)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Reschedule Modal ──────────────────────────────────────────
const RescheduleModal = ({
  slotIndex,
  connectRequestId,
  existingSlots,
  onConfirm,
  onClose,
  saving,
}: {
  slotIndex: number;
  connectRequestId: string;
  existingSlots: Slot[];
  onConfirm: (idx: number, newSlot: NewSlotSelection) => void;
  onClose: () => void;
  saving?: boolean;
}) => {
  const [duration, setDuration] = useState(60);
  const [selectedNewSlot, setSelectedNewSlot] = useState<NewSlotSelection | null>(null);

  const { availability, sessionDurations, availLoading, availError } =
    useRescheduleAvailability(connectRequestId, duration);

  const bookedSlots = existingSlots
    .filter((s: Slot, i: number) => i !== slotIndex && isActive(s))
    .map((s: Slot) => ({ date: s.date, startTime: s.startTime, endTime: s.endTime }));

  let availabilityContent;
  if (availLoading) {
    availabilityContent = (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-2xl bg-slate-100 animate-pulse"
          />
        ))}
      </div>
    );
  } else if (availError) {
    availabilityContent = (
      <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
        {availError}
      </div>
    );
  } else if (availability.length === 0) {
    availabilityContent = (
      <div className="flex flex-col items-center gap-3 py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#94a3b8"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <p className="text-sm font-semibold text-slate-600">
          No slots available
        </p>
        <p className="text-xs text-slate-400 max-w-xs">
          Your mentor hasn&apos;t set availability for {duration}-min
          sessions yet.
        </p>
      </div>
    );
  } else {
    availabilityContent = (
      <SlotTabPicker
        availability={availability}
        selectedSlot={selectedNewSlot}
        onSelect={setSelectedNewSlot}
        bookedSlots={bookedSlots}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                Reschedule Session
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
          <div className="flex items-start gap-2.5 px-3.5 py-3 bg-blue-50 border border-blue-100 rounded-xl">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 mt-0.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-xs text-blue-900 font-medium leading-relaxed">
              The current slot will be cancelled and replaced with the new one
              you pick below. Your mentor will be notified immediately.
            </p>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Session Duration
            </p>
            <div className="flex gap-2 flex-wrap">
              {sessionDurations.map((dur) => (
                <button
                  key={dur}
                  type="button"
                  onClick={() => {
                    setDuration(dur);
                    setSelectedNewSlot(null);
                  }}
                  className={`px-5 py-2 rounded-xl text-xs font-bold transition-all
                    ${duration === dur
                      ? "bg-blue-900 text-white shadow-md"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                >
                  {dur} min
                </button>
              ))}
            </div>
          </div>

          <div>
            {availabilityContent}
          </div>
        </div>

        {selectedNewSlot && (
          <div className="border-t border-slate-100 px-6 py-4 shrink-0">
            <div className="flex items-center justify-between gap-3 mb-3 px-3.5 py-3 border border-slate-200 rounded-xl">
              <div>
                <p className="text-[10px] font-bold text-blue-900 uppercase tracking-widest">
                  New Slot
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  {new Date(
                    selectedNewSlot.date + "T00:00:00",
                  ).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-xs font-semibold text-slate-900">
                  {formatTime(selectedNewSlot.startTime)} –{" "}
                  {formatTime(selectedNewSlot.endTime)}
                </p>
              </div>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={onClose}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-sm
                  font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => onConfirm(slotIndex, selectedNewSlot)}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold
                  transition-all disabled:opacity-50 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2 bg-blue-900"
              >
                {saving ? <><SpinnerAny size="sm" light />Rescheduling...</>
                  : (
                    <>
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
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Confirm Reschedule
                    </>
                  )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Meeting Link Section ──────────────────────────────────────
const MeetingLinkSection = ({
  slot,
  viewerRole,
  onSetLink,
  saving,
}: {
  slot?: Slot | null;
  viewerRole: string;
  onSetLink: (link: string) => Promise<{ success?: boolean } | undefined>;
  saving?: boolean;
}) => {
  const [editing, setEditing] = useState(false);
  const [linkVal, setLinkVal] = useState(slot?.meetingLink || "");
  const [linkErr, setLinkErr] = useState("");
  const isMentor = viewerRole === "mentor";

  const handleSave = async () => {
    if (!linkVal.trim()) {
      setLinkErr("Link cannot be empty");
      return;
    }
    if (!isValidMeetingLink(linkVal.trim())) {
      setLinkErr("Only HTTPS links from Google Meet, Zoom etc are allowed.");
      return;
    }
    setLinkErr("");
    const result = await onSetLink(linkVal.trim());
    if (result?.success) setEditing(false);
  };

  let meetingLinkSectionContent;
  if (editing) {
    meetingLinkSectionContent = (
      <div className="flex flex-col gap-2">
        <input
          autoFocus
          value={linkVal}
          onChange={(e) => {
            setLinkVal(e.target.value);
            setLinkErr("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="https://meet.google.com/..."
          className={`w-full px-3 py-2 border rounded-xl text-sm text-slate-700
            bg-white outline-none transition-colors placeholder:text-slate-400
            ${linkErr ? "border-red-300 focus:border-red-400" : "border-slate-200 focus:border-blue-300"}`}
        />
        {linkErr && (
          <div className="flex items-start gap-1.5 px-3 py-2 bg-red-50 border border-red-100 rounded-xl">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 mt-0.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-xs text-red-600 leading-relaxed">{linkErr}</p>
          </div>
        )}
        {/* Helper hint */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditing(false);
              setLinkErr("");
              setLinkVal(slot?.meetingLink || "");
            }}
            className="flex-1 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !linkVal.trim()}
            className="flex-1 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold
              hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    );
  } else if (slot?.meetingLink) {
    meetingLinkSectionContent = (
      <div className="flex items-center gap-2">
        <a
          href={slot.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100
          rounded-xl text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors truncate"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <span className="truncate">{slot.meetingLink}</span>
        </a>
        {isMentor && (
          <button
            onClick={() => {
              setLinkVal(slot.meetingLink || "");
              setEditing(true);
            }}
            className="shrink-0 px-2.5 py-2 rounded-xl border border-slate-200 bg-white
              text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Edit
          </button>
        )}
      </div>
    );
  } else if (isMentor) {
    meetingLinkSectionContent = (
      <button
        onClick={() => setEditing(true)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-dashed
          border-slate-200 bg-slate-50 text-xs font-semibold text-slate-500
          hover:border-blue-300 hover:text-blue-600 transition-colors"
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
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Meeting Link
      </button>
    );
  } else {
    meetingLinkSectionContent = (
      <p className="text-xs text-slate-400 italic">
        No meeting link added yet.
      </p>
    );
  }

  return (
    <div className="border-t border-slate-100 pt-3">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
        Meeting Link
      </p>
      {meetingLinkSectionContent}
    </div>
  );
};

// ── Completion Section ────────────────────────────────────────
const CompletionSection = ({
  slot,
  viewerRole,
  otherName,
  slotIndex,
  onMarkComplete,
  onSessionComplete,
}: {
  slot?: Slot | null;
  viewerRole: string;
  otherName: string;
  slotIndex: number;
  onMarkComplete: (idx: number) => Promise<{ success?: boolean } | undefined>;
  onSessionComplete?: (idx: number) => void;
}) => {
  const [localSaving, setLocalSaving] = useState(false);

  const isMentee = viewerRole === "mentee";
  const iMenteeMarked = slot?.menteeMarked || false;
  const iMentorMarked = slot?.mentorMarked || false;
  const myMark = isMentee ? iMenteeMarked : iMentorMarked;
  const otherMark = isMentee ? iMentorMarked : iMenteeMarked;
  const bothDone = iMenteeMarked && iMentorMarked;

  const handleClick = async () => {
    setLocalSaving(true);
    const result = await onMarkComplete(slotIndex);
    setLocalSaving(false);
    if (result?.success && onSessionComplete) onSessionComplete(slotIndex);
  };

  return (
    <div className="border-t border-slate-100 pt-3">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
        Completion
      </p>
      <div className="flex flex-col gap-1.5 mb-3">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold
          ${myMark ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-500"}`}
        >
          <span>{myMark ? "✓" : "○"}</span>
          <span>
            {myMark
              ? "You marked this session complete"
              : "You haven't marked this session complete yet"}
          </span>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold
          ${otherMark ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}
        >
          <span>{otherMark ? "✓" : "○"}</span>
          <span>
            {otherMark
              ? `${otherName} marked this session complete`
              : `Waiting for ${otherName} to confirm`}
          </span>
        </div>
      </div>

      {(!myMark || localSaving) && !bothDone && (
        <button
          onClick={handleClick}
          disabled={localSaving}
          className="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold
            hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed
            flex items-center justify-center gap-2"
        >
          {localSaving ? <><SpinnerAny size="sm" light />Marking Complete...</>
            : (
              <>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Mark Session Complete
              </>
            )}
        </button>
      )}

      {bothDone && (
        <div
          className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
          bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold"
        >
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
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          Session Completed by Both Parties
        </div>
      )}
    </div>
  );
};

// ── Main SessionCard ──────────────────────────────────────────
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
  allSlots: Slot[];
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

  const handleCancel = async (idx: number, reason: string) => {
    const result = await onCancelSlot(idx, reason);
    if (result?.success) setShowCancelModal(false);
  };

  const handleReschedule = async (idx: number, newSlot: NewSlotSelection) => {
    const result = await onRescheduleSlot(idx, newSlot);
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
                slot={slot}
                viewerRole={viewerRole}
                onSetLink={(link) => onSetLink(slotIndex, link)}
                saving={saving}
              />
            )}

            <CompletionSection
              slot={slot}
              viewerRole={viewerRole}
              otherName={otherName}
              slotIndex={slotIndex}
              onMarkComplete={onMarkComplete}
              onSessionComplete={onSessionComplete}
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
          slotIndex={slotIndex}
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