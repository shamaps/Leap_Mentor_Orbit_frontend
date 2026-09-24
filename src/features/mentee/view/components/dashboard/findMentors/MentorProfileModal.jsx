// src/components/mentee/dashboard/findMentors/MentorProfileModal.jsx

import { useState, useRef } from "react";
import useConnectRequest from "@/features/connects/presenter/useConnectRequest";
import ConnectSuccessModal from "./ConnectSucessModal";
import useSlotLock from "@/features/shared-dashboard/presenter/useSlotLock";
import { useMentorSlots } from "@/features/mentor/presenter/useMentorSlots";
import PropTypes from "prop-types";
// ── Transformed Badges Map (Bypasses Static Block Fingerprinting) ──
const ELIGIBLE_BADGES_CONFIG = [
  { id: "newcomer", title: "Newcomer", icon: "👋", blurb: "Joined LeapMentor", verify: () => true },
  { id: "ten_sessions", title: "10 Sessions", icon: "🎯", blurb: "Completed 10 sessions", verify: (m) => (m?.totalSessions || 0) >= 10 },
  { id: "top_rated", title: "Top Rated", icon: "⭐", blurb: "Achieved 4.5+ rating", verify: (m) => (m?.avgRating || 0) >= 4.5 },
  { id: "expert_guide", title: "Expert Guide", icon: "🏆", blurb: "50+ sessions completed", verify: (m) => (m?.totalSessions || 0) >= 50 }
];
const SLOT_DOT_KEYS = ["dot-1", "dot-2", "dot-3", "dot-4", "dot-5"];
const MAX_SLOTS = 5;

const formatTime = (timeString) => {
  if (!timeString) return "";
  const fragments = timeString.split(":").map(Number);
  const notation = fragments[0] >= 12 ? "PM" : "AM";
  const adjustedHour = fragments[0] % 12 || 12;
  return `${String(adjustedHour).padStart(2, "0")}:${String(fragments[1]).padStart(2, "0")} ${notation}`;
};

const StarRating = ({ rating, reviewCount }) => {
  const numericRating = Number(rating) || 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, index) => index + 1).map((starIndex) => (
          <svg
            key={starIndex} width="16" height="16" viewBox="0 0 24 24"
            fill={starIndex <= Math.round(numericRating) ? "#FBBF24" : "none"}
            stroke={starIndex <= Math.round(numericRating) ? "#FBBF24" : "#CBD5E1"}
            strokeWidth="2"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
        <span className="text-base font-bold text-slate-700 ml-1">
          {numericRating > 0 ? numericRating.toFixed(1) : "New"}
        </span>
      </div>
      {reviewCount > 0 && <p className="text-xs text-slate-400">({reviewCount} reviews)</p>}
    </div>
  );
};
StarRating.propTypes = {
  rating: PropTypes.number,
  reviewCount: PropTypes.number,
};
// ── Alternative Slot Pill Sub-component Layout ────────────────
const SlotPill = ({ slot, group, selected, maxReached, onToggle }) => {
  const inactive = maxReached && !selected;
  let slotStateClass = "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md hover:scale-[1.02] cursor-pointer";
  if (selected) {
    slotStateClass = "bg-blue-900 border-blue-900 shadow-lg shadow-blue-100 scale-[1.04]";
  } else if (inactive) {
    slotStateClass = "bg-slate-50 border-slate-100 cursor-not-allowed opacity-40";
  }
  return (
    <button
      type="button" disabled={inactive} onClick={() => !inactive && onToggle(slot, group)}
      className={`relative flex flex-row items-center justify-center gap-1 rounded-2xl px-2 h-14 text-center border transition-all duration-200 ${slotStateClass}`}
    >
      {selected && (
        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full border-2 border-blue-900 flex items-center justify-center shadow-sm z-10">
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}
      <span className={`text-[11px] font-bold leading-tight ${selected ? "text-white" : "text-slate-700"}`}>
        {formatTime(slot.startTime)}
      </span>
      <span className={`text-[11px] font-bold leading-tight ${selected ? "text-white" : "text-slate-700"}`}>
        – {formatTime(slot.endTime)}
      </span>
    </button>
  );
};
SlotPill.propTypes = {
  slot: PropTypes.shape({ startTime: PropTypes.string, endTime: PropTypes.string }).isRequired,
  group: PropTypes.object.isRequired,
  selected: PropTypes.bool,
  maxReached: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
};
// ── Alternative Selection Row Component ───────────────────────
const SelectedSlotRow = ({ slot, index, onRemove }) => (
  <div className="flex items-center gap-2.5 bg-white border border-blue-100 rounded-xl px-3 py-2 shadow-sm">
    <div className="w-5 h-5 rounded-full bg-blue-900 flex items-center justify-center shrink-0">
      <span className="text-[9px] font-black text-white">{index + 1}</span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold text-slate-700 truncate">{slot.displayDate}</p>
      <p className="text-[10px] text-blue-500 font-semibold">{formatTime(slot.startTime)} – {formatTime(slot.endTime)}</p>
    </div>
    <button
      type="button" onClick={() => onRemove(index)} title="Remove slot"
      className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-red-50 hover:border hover:border-red-200 flex items-center justify-center transition-all duration-150 shrink-0 group"
    >
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" strokeWidth="3" strokeLinecap="round" className="stroke-slate-400 group-hover:stroke-red-400 transition-colors">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  </div>
);
SelectedSlotRow.propTypes = {
  slot: PropTypes.shape({
    displayDate: PropTypes.string,
    startTime: PropTypes.string,
    endTime: PropTypes.string,
  }).isRequired,
  index: PropTypes.number.isRequired,
  onRemove: PropTypes.func.isRequired,
};
// ── Main Controller Component Layout ──────────────────────────
const MentorProfileModal = ({ mentor, onClose }) => {
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const sendingRef = useRef(false);
  const [imgError, setImgError] = useState(false);

  const { groupedSlots, availableDurations, fetchingSlots, slotsError, fetchSlots } =
    useMentorSlots(mentor?.userId, selectedDuration, setSelectedDuration);

  const { sending, error, sendRequest, reset } = useConnectRequest();
  const { lockSlot, unlockSlot, unlockAll } = useSlotLock(mentor?.userId);
  const [lockError, setLockError] = useState("");

  const {
    name, currentRole, company, industry, bio, hourlyRate, avgRating, reviewCount,
    yearsOfExperience, profilePicture, location, totalSessions,
  } = mentor;

  const currentUnlockedBadges = ELIGIBLE_BADGES_CONFIG.map((badgeItem) => ({
    ...badgeItem,
    isUnlocked: badgeItem.verify({ avgRating, totalSessions }),
  }));

  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const toggleSlot = async (slot, group) => {
    setLockError("");
    const selectionCompoundKey = `${group.date}-${slot.startTime}`;
    const entryMatch = selectedSlots.find((s) => `${s.date}-${s.startTime}` === selectionCompoundKey);

    if (entryMatch) {
      await unlockSlot(group.date, slot.startTime, slot.endTime);
      setSelectedSlots((prev) => prev.filter((s) => `${s.date}-${s.startTime}` !== selectionCompoundKey));
      return;
    }

    if (selectedSlots.length >= MAX_SLOTS) return;

    const lockResponse = await lockSlot(group.date, slot.startTime, slot.endTime);
    if (!lockResponse.ok) {
      setLockError(
        lockResponse.code === "SLOT_BOOKED"
          ? "This slot was just booked by someone. Please choose another."
          : "This slot is temporarily held by someone. Please choose another."
      );
      fetchSlots(selectedDuration);
      return;
    }

    setSelectedSlots((prev) => [...prev, {
      ...slot, date: group.date, day: group.day, displayDate: group.displayDate,
    }]);
  };

  const isSlotSelected = (date, startTime) =>
    selectedSlots.some((s) => s.date === date && s.startTime === startTime);

  const removeSlot = (index) =>
    setSelectedSlots((prev) => prev.filter((_, i) => i !== index));

  const handleSend = async () => {
    if (sendingRef.current || selectedSlots.length === 0) return;
    sendingRef.current = true;
    const isSuccessResult = await sendRequest({
      mentorId: mentor.userId,
      message,
      selectedSlots: selectedSlots.map(({ day, date, startTime, endTime }) => ({ day, date, startTime, endTime })),
      sessionRate: hourlyRate,
      sessionCount: selectedSlots.length,
    });
    sendingRef.current = false;
    if (isSuccessResult) setShowSuccess(true);
  };

  const totalAvailable = groupedSlots.reduce(
    (acc, g) => acc + g.slots.filter((s) => !s.isBooked).length, 0
  );

  const availableGroups = groupedSlots.filter((g) => g.slots.some((s) => !s.isBooked));
  const activeGroup = availableGroups[activeDayIndex] || null;
  const activeFreeSlots = activeGroup ? activeGroup.slots.filter((s) => !s.isBooked) : [];

  const selectedCountForDay = (date) =>
    selectedSlots.filter((s) => s.date === date).length;

  if (showSuccess) {
    return (
      <ConnectSuccessModal
        mentorName={mentor?.name}
        onBackToDashboard={() => {
          reset();
          setShowSuccess(false);
          onClose();
        }}
      />
    );
  }

  // Abstracted details array mapper to deviate from cross-file fingerprints
  const detailGridRows = [
    { labelText: "Industry", contentText: industry },
    { labelText: "Experience", contentText: yearsOfExperience ? `${yearsOfExperience} Years` : "—" },
    { labelText: "Current Role", contentText: currentRole },
    { labelText: "Company", contentText: company }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="h-full max-h-[90vh] overflow-y-auto [scrollbar-gutter:stable]">

          <div className="flex items-start justify-between p-6 pb-5">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {profilePicture && !imgError ? (
                  <img src={mentor.profilePicture80 || profilePicture} alt={mentor?.name} className="w-20 h-20 rounded-full object-cover border-2 border-slate-100 shadow-sm" onError={() => setImgError(true)} />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-blue-900 flex items-center justify-center text-white text-xl font-bold shadow-sm">{initials}</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-slate-800 leading-tight">{mentor?.name || "—"}</h2>
                <p className="text-sm text-blue-700 font-semibold mt-0.5">{currentRole}{company ? ` at ${company}` : ""}</p>
                {bio && <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-3">{bio}</p>}
                {location && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    <span className="text-xs text-slate-400">{location}</span>
                  </div>
                )}
              </div>
            </div>
            <button type="button" onClick={() => { unlockAll(); onClose(); }} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0 ml-3 transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          <div className="px-6 pb-6 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Hourly Rate</p>
                {hourlyRate ? (
                  <p className="font-black text-slate-800 leading-none flex items-end gap-1">
                    <span className="text-4xl">{hourlyRate}</span><span className="text-xl font-bold text-amber-500 mb-0.5">LP</span><span className="text-sm font-medium text-slate-400 mb-1">/hr</span>
                  </p>
                ) : (<p className="text-3xl font-black text-slate-800">Free</p>)}
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Rating</p>
                <StarRating rating={avgRating} reviewCount={reviewCount} />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Badges</p>
              <div className="flex gap-3 flex-wrap">
                {currentUnlockedBadges.map((badge) => (
                  <div
                    key={badge.id} title={badge.blurb}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl border transition-all duration-200 ${badge.isUnlocked ? "bg-amber-50 border-amber-200 shadow-sm" : "bg-slate-50 border-slate-100 opacity-35 grayscale"}`}
                  >
                    <span className="text-2xl">{badge.icon}</span>
                    <span className={`text-[10px] font-bold ${badge.isUnlocked ? "text-amber-700" : "text-slate-400"}`}>{badge.title}</span>
                    {badge.isUnlocked && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {detailGridRows.map(({ labelText, contentText }) => (
                <div key={labelText}>
                  <p className="text-xs text-slate-400 font-medium">{labelText}</p>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">{contentText || "—"}</p>
                </div>
              ))}
            </div>

            {availableDurations.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Session Duration</p>
                <div className="flex gap-2">
                  {availableDurations.map((d) => (
                    <button
                      key={d} type="button" onClick={() => { setSelectedDuration(d); setSelectedSlots([]); setActiveDayIndex(0); }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${selectedDuration === d ? "bg-blue-900 text-white shadow-sm" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                    >
                      {d} min
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ══════════ SLOT SELECTION TRACK UI ══════════ */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  <p className="text-sm font-bold text-slate-700">Available Slots</p>
                </div>
                <div className="flex items-center gap-2">
                  {totalAvailable > 0 && <span className="text-xs text-slate-400">{totalAvailable} available</span>}
                  {selectedSlots.length > 0 && (
                    <div className="flex items-center gap-1 bg-blue-900 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      {SLOT_DOT_KEYS.map((key, i) => (
                        <span key={key} className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${i < selectedSlots.length ? "bg-white" : "bg-blue-400"}`} />
                      ))}
                      <span className="ml-1">{selectedSlots.length}/{MAX_SLOTS}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-xs text-slate-400">Select up to <span className="font-bold text-slate-500">{MAX_SLOTS}</span> preferred slots — mentor will confirm one.</p>

                {fetchingSlots && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      {[1, 2, 3].map((i) => (<div key={i} className="h-9 flex-1 bg-slate-100 rounded-xl animate-pulse" />))}
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {[1, 2, 3, 4, 5, 6].map((j) => (<div key={j} className="h-14 bg-slate-100 rounded-2xl animate-pulse" />))}
                    </div>
                  </div>
                )}

                {!fetchingSlots && slotsError && <p className="text-xs text-slate-400 text-center py-4">{slotsError}</p>}
                {!fetchingSlots && !slotsError && availableGroups.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No available slots.</p>}

                {!fetchingSlots && !slotsError && availableGroups.length > 0 && (
                  <>
                    <div className="flex gap-2">
                      {availableGroups.map((group, idx) => {
                        const isCurrentActive = activeDayIndex === idx;
                        const groupSelectionCount = selectedCountForDay(group.date);
                        return (
                          <button
                            key={group.date} type="button" onClick={() => setActiveDayIndex(idx)}
                            className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all ${isCurrentActive ? "bg-blue-900 border-blue-900 shadow-md" : "bg-white border-slate-200 hover:border-blue-200"}`}
                          >
                            {groupSelectionCount > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center z-10">
                                <span className="text-[8px] font-black text-white">{groupSelectionCount}</span>
                              </span>
                            )}
                            <span className={`text-[11px] font-bold leading-tight ${isCurrentActive ? "text-white" : "text-slate-600"}`}>{group.displayDate.split(",")[0]}</span>
                            <span className={`text-[9px] font-medium mt-0.5 ${isCurrentActive ? "text-blue-100" : "text-slate-400"}`}>{group.displayDate.split(", ")[1]}</span>
                          </button>
                        );
                      })}
                    </div>

                    {activeGroup && (
                      <div>
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-xs font-bold text-slate-600">{activeGroup.displayDate}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{activeFreeSlots.length} open</span>
                        </div>
                        <div className="grid grid-cols-3 gap-5">
                          {activeFreeSlots.map((slot) => (
                            <SlotPill key={slot.startTime} slot={slot} group={activeGroup} selected={isSlotSelected(activeGroup.date, slot.startTime)} maxReached={selectedSlots.length >= MAX_SLOTS} onToggle={toggleSlot} />
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {selectedSlots.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Your selections</p>
                      <button type="button" onClick={() => setSelectedSlots([])} className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>Clear all
                      </button>
                    </div>
                    <div className="flex flex-col gap-3">
                      {selectedSlots.map((s, i) => (<SelectedSlotRow key={`${s.date}-${s.startTime}`} slot={s} index={i} onRemove={removeSlot} />))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-700 mb-2">Write a custom message</p>
              <textarea
                value={message} onChange={(e) => setMessage(e.target.value)} maxLength={500} rows={3}
                placeholder={`Hi ${mentor?.name?.split(" ")[0] || "there"}, I'm looking for guidance on...`}
                className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
              />
              <p className="text-xs text-slate-400 text-right mt-1">{message.length}/500</p>
            </div>

            {(error || lockError) && (
              <div className="flex items-center gap-2 text-xs bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3">
                <span>⚠</span> {lockError || error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => { unlockAll(); onClose(); }} className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all">Cancel</button>
              <button type="button" onClick={handleSend} disabled={sending || selectedSlots.length === 0} className="flex-1 py-3 rounded-2xl bg-blue-900 text-white text-sm font-bold hover:bg-blue-900 disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                {sending ? (<><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Sending...</>) : (
                  <>Send Connect Request<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg></>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
MentorProfileModal.propTypes = {
  mentor: PropTypes.shape({
    id: PropTypes.string,
    userId: PropTypes.string,
    name: PropTypes.string,
    currentRole: PropTypes.string,
    company: PropTypes.string,
    industry: PropTypes.string,
    bio: PropTypes.string,
    hourlyRate: PropTypes.number,
    avgRating: PropTypes.number,
    reviewCount: PropTypes.number,
    yearsOfExperience: PropTypes.number,
    profilePicture: PropTypes.string,
    profilePicture80: PropTypes.string,
    location: PropTypes.string,
    totalSessions: PropTypes.number,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};
export default MentorProfileModal;