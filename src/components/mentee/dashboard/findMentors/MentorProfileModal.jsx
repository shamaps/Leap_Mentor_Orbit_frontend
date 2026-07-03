// src/components/mentee/dashboard/findMentors/MentorProfileModal.jsx
import { useState, useEffect, useRef } from "react";
import axiosInstance from "../../../../utils/axiosInstance";
import useConnectRequest from "../../../../hooks/useConnectRequest";
import ConnectSuccessModal from "./ConnectSucessModal";
import useSlotLock from "../../../../hooks/useSlotLock";
import getErrorMessage from "../../../../utils/getErrorMessage";
import { HTTP_STATUS } from "../../../../constants/httpStatus";
const BADGES = [
  {
    key: "newcomer",
    label: "Newcomer",
    icon: "👋",
    desc: "Joined LeapMentor",
    condition: () => true,
  },
  {
    key: "ten_sessions",
    label: "10 Sessions",
    icon: "🎯",
    desc: "Completed 10 sessions",
    condition: (p) => (p?.totalSessions || 0) >= 10,
  },
  {
    key: "top_rated",
    label: "Top Rated",
    icon: "⭐",
    desc: "Achieved 4.5+ rating",
    condition: (p) => (p?.avgRating || 0) >= 4.5,
  },
  {
    key: "expert_guide",
    label: "Expert Guide",
    icon: "🏆",
    desc: "50+ sessions completed",
    condition: (p) => (p?.totalSessions || 0) >= 50,
  },
];
const formatTime = (time) => {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${String(hour).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
};
const StarRating = ({ rating, reviewCount }) => {
  const r = Number(rating) || 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={star <= Math.round(r) ? "#FBBF24" : "none"}
            stroke={star <= Math.round(r) ? "#FBBF24" : "#CBD5E1"}
            strokeWidth="2"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
        <span className="text-base font-bold text-slate-700 ml-1">
          {r > 0 ? r.toFixed(1) : "New"}
        </span>
      </div>
      {reviewCount > 0 && (
        <p className="text-xs text-slate-400">({reviewCount} reviews)</p>
      )}
    </div>
  );
};
const MAX_SLOTS = 5;
// ── Slot Pill ─────────────────────────────────────────────────
const SlotPill = ({ slot, group, selected, maxReached, onToggle }) => {
  const isDisabled = maxReached && !selected;
  return (
    <button
      type="button"
      onClick={() => !isDisabled && onToggle(slot, group)}
      disabled={isDisabled}
      className={`
        relative flex flex-row items-center justify-center gap-1
        rounded-2xl px-2 h-14 text-center border
        transition-all duration-200
        ${
          selected
            ? "bg-blue-900 border-blue-900 shadow-lg shadow-blue-100 scale-[1.04]"
            : isDisabled
              ? "bg-slate-50 border-slate-100 cursor-not-allowed opacity-40"
              : "bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md hover:scale-[1.02] cursor-pointer"
        }
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
        className={`text-[11px] font-bold leading-tight ${selected ? "text-white" : "text-slate-700"}`}
      >
        {formatTime(slot.startTime)}
      </span>
      <span
        className={`text-[11px] font-bold leading-tight ${selected ? "text-white" : "text-slate-700"}`}
      >
        – {formatTime(slot.endTime)}
      </span>
    </button>
  );
};
// ── Selected Slot Row ─────────────────────────────────────────
const SelectedSlotRow = ({ slot, index, onRemove }) => (
  <div className="flex items-center gap-2.5 bg-white border border-blue-100 rounded-xl px-3 py-2 shadow-sm">
    <div className="w-5 h-5 rounded-full bg-blue-900 flex items-center justify-center shrink-0">
      <span className="text-[9px] font-black text-white">{index + 1}</span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-bold text-slate-700 truncate">
        {slot.displayDate}
      </p>
      <p className="text-[10px] text-blue-500 font-semibold">
        {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
      </p>
    </div>
    <button
      type="button"
      onClick={() => onRemove(index)}
      title="Remove slot"
      className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-red-50 hover:border hover:border-red-200 flex items-center justify-center transition-all duration-150 shrink-0 group"
    >
      <svg
        width="8"
        height="8"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        className="stroke-slate-400 group-hover:stroke-red-400 transition-colors"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  </div>
);
// ── Main Modal ────────────────────────────────────────────────
const MentorProfileModal = ({ mentor, onClose }) => {
  const [groupedSlots, setGroupedSlots] = useState([]);
  const [availableDurations, setAvailableDurations] = useState([60]);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [fetchingSlots, setFetchingSlots] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [slotsError, setSlotsError] = useState("");
  const sendingRef = useRef(false); // add near other refs at top of component
  const [imgError, setImgError] = useState(false);
  const { sending, error, sendRequest, reset } = useConnectRequest();
  const { lockSlot, unlockSlot, unlockAll } = useSlotLock(mentor?.user?._id);
  const [lockError, setLockError] = useState("");
  const {
    user,
    currentRole,
    company,
    industry,
    bio,
    hourlyRate,
    avgRating,
    reviewCount,
    yearsOfExperience,
    profilePicture,
    location,
    totalSessions,
  } = mentor;
  const badges = BADGES.map((badge) => ({
    ...badge,
    unlocked: badge.condition({ avgRating, totalSessions }),
  }));
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";
  useEffect(() => {
    if (!mentor?.user?._id) return;
    fetchSlots(selectedDuration);
  }, [mentor, selectedDuration]);
  const fetchSlots = async (duration) => {
    try {
      setFetchingSlots(true);
      setSlotsError("");
      setSelectedSlots([]);
      setActiveDayIndex(0);
      const res = await axiosInstance.get(
        `/availability/${mentor.user._id}/slots?duration=${duration}`,
      );
      setGroupedSlots(res.data.slots || []);
      if (res.data.sessionDurations?.length) {
        setAvailableDurations(res.data.sessionDurations);
        if (!res.data.sessionDurations.includes(selectedDuration)) {
          setSelectedDuration(res.data.sessionDurations[0]);
        }
      }
    } catch (err) {
      setSlotsError(
        err?.response?.status === HTTP_STATUS.NOT_FOUND
          ? "This mentor hasn't set their availability yet."
          : getErrorMessage(err, "Failed to load available slots."),
      );
      setGroupedSlots([]);
    } finally {
      setFetchingSlots(false);
    }
  };
  const toggleSlot = async (slot, group) => {
    setLockError("");
    const key = `${group.date}-${slot.startTime}`;
    const exists = selectedSlots.find(
      (s) => `${s.date}-${s.startTime}` === key,
    );
    if (exists) {
      await unlockSlot(group.date, slot.startTime, slot.endTime);
      setSelectedSlots((prev) =>
        prev.filter((s) => `${s.date}-${s.startTime}` !== key),
      );
      return;
    }
    if (selectedSlots.length >= MAX_SLOTS) return;
    const result = await lockSlot(group.date, slot.startTime, slot.endTime);
    if (!result.ok) {
      setLockError(
        result.code === "SLOT_BOOKED"
          ? "This slot was just booked by someone. Please choose another."
          : "This slot is temporarily held by someone. Please choose another.",
      );
      fetchSlots(selectedDuration);
      return;
    }
    const slotObj = {
      ...slot,
      date: group.date,
      day: group.day,
      displayDate: group.displayDate,
    };
    setSelectedSlots((prev) => [...prev, slotObj]);
  };
  const isSlotSelected = (date, startTime) =>
    selectedSlots.some((s) => s.date === date && s.startTime === startTime);
  const removeSlot = (index) =>
    setSelectedSlots((prev) => prev.filter((_, i) => i !== index));

  const handleSend = async () => {
    if (sendingRef.current || selectedSlots.length === 0) return;
    sendingRef.current = true;
    const ok = await sendRequest({
      mentorId: mentor.user._id,
      message,
      selectedSlots: selectedSlots.map(({ day, date, startTime, endTime }) => ({
        day,
        date,
        startTime,
        endTime,
      })),
      sessionRate: hourlyRate,
      sessionCount: selectedSlots.length,
    });
    sendingRef.current = false;
    if (ok) setShowSuccess(true);
  };
  const totalAvailable = groupedSlots.reduce(
    (acc, g) => acc + g.slots.filter((s) => !s.isBooked).length,
    0,
  );
  const availableGroups = groupedSlots.filter((g) =>
    g.slots.some((s) => !s.isBooked),
  );
  const activeGroup = availableGroups[activeDayIndex] || null;
  const activeFreeSlots = activeGroup
    ? activeGroup.slots.filter((s) => !s.isBooked)
    : [];
  const selectedCountForDay = (date) =>
    selectedSlots.filter((s) => s.date === date).length;
  if (showSuccess) {
    return (
      <ConnectSuccessModal
        mentorName={user?.name}
        onBackToDashboard={() => {
          reset();
          setShowSuccess(false);
          onClose();
        }}
      />
    );
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="h-full max-h-[90vh] overflow-y-auto [scrollbar-gutter:stable]">
          {/* ── Header ── */}
          <div className="flex items-start justify-between p-6 pb-5">
            <div className="flex items-center gap-4">
              {/* Profile picture with green online dot */}
              <div className="relative shrink-0">
                {profilePicture && !imgError ? (
                  <img
                    src={mentor.profilePicture80 || profilePicture}
                    alt={user?.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-slate-100 shadow-sm"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-blue-900 flex items-center justify-center text-white text-xl font-bold shadow-sm">
                    {initials}
                  </div>
                )}
                {/* Online indicator */}
                {/* <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm" /> */}
              </div>
              {/* Name / role / bio / location */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-slate-800 leading-tight">
                  {user?.name || "—"}
                </h2>
                <p className="text-sm text-blue-700 font-semibold mt-0.5">
                  {currentRole}
                  {company ? ` at ${company}` : ""}
                </p>
                {bio && (
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed line-clamp-3">
                    {bio}
                  </p>
                )}
                {location && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <svg
                      width="11"
                      height="11"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#94A3B8"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span className="text-xs text-slate-400">{location}</span>
                  </div>
                )}
              </div>
            </div>
            {/* Close button */}
            <button
              type="button"
              onClick={() => {
                unlockAll();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0 ml-3 transition-colors"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#64748B"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="px-6 pb-6 space-y-5">
            {/* ── Rate + Rating ── */}
            <div className="grid grid-cols-2 gap-3">
              {/* Hourly Rate */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Hourly Rate
                </p>
                {hourlyRate ? (
                  <p className="font-black text-slate-800 leading-none flex items-end gap-1">
                    <span className="text-4xl">{hourlyRate}</span>
                    <span className="text-xl font-bold text-amber-500 mb-0.5">
                      LP
                    </span>
                    <span className="text-sm font-medium text-slate-400 mb-1">
                      /hr
                    </span>
                  </p>
                ) : (
                  <p className="text-3xl font-black text-slate-800">Free</p>
                )}
              </div>
              {/* Rating */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Rating
                </p>
                <StarRating rating={avgRating} reviewCount={reviewCount} />
              </div>
            </div>
            {/* ── Badges ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                Badges
              </p>
              <div className="flex gap-3 flex-wrap">
                {badges.map((badge) => (
                  <div
                    key={badge.key}
                    title={badge.desc}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl border transition-all duration-200
          ${
            badge.unlocked
              ? "bg-amber-50 border-amber-200 shadow-sm"
              : "bg-slate-50 border-slate-100 opacity-35 grayscale"
          }`}
                  >
                    <span className="text-2xl">{badge.icon}</span>
                    <span
                      className={`text-[10px] font-bold ${badge.unlocked ? "text-amber-700" : "text-slate-400"}`}
                    >
                      {badge.label}
                    </span>
                    {badge.unlocked && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* ── Details ── */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4"></div>
            {/* ── Details ── */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                { label: "Industry", value: industry },
                {
                  label: "Experience",
                  value: yearsOfExperience ? `${yearsOfExperience} Years` : "—",
                },
                { label: "Current Role", value: currentRole },
                { label: "Company", value: company },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-slate-400 font-medium">{label}</p>
                  <p className="text-sm font-bold text-slate-700 mt-0.5">
                    {value || "—"}
                  </p>
                </div>
              ))}
            </div>
            {/* ── Duration picker ── */}
            {availableDurations.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Session Duration
                </p>
                <div className="flex gap-2">
                  {availableDurations.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setSelectedDuration(d)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                        selectedDuration === d
                          ? "bg-blue-900 text-white shadow-sm"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      {d} min
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* ══════════ SLOT SELECTION UI ══════════ */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              {/* Top bar */}
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
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <p className="text-sm font-bold text-slate-700">
                    Available Slots
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {totalAvailable > 0 && (
                    <span className="text-xs text-slate-400">
                      {totalAvailable} available
                    </span>
                  )}
                  {selectedSlots.length > 0 && (
                    <div className="flex items-center gap-1 bg-blue-900 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      {Array.from({ length: MAX_SLOTS }).map((_, i) => (
                        <span
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                            i < selectedSlots.length
                              ? "bg-white"
                              : "bg-blue-400"
                          }`}
                        />
                      ))}
                      <span className="ml-1">
                        {selectedSlots.length}/{MAX_SLOTS}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-xs text-slate-400">
                  Select up to{" "}
                  <span className="font-bold text-slate-500">{MAX_SLOTS}</span>{" "}
                  preferred slots — mentor will confirm one.
                </p>
                {/* Loading skeleton */}
                {fetchingSlots && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-9 flex-1 bg-slate-100 rounded-xl animate-pulse"
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      {[1, 2, 3, 4, 5, 6].map((j) => (
                        <div
                          key={j}
                          className="h-14 bg-slate-100 rounded-2xl animate-pulse"
                        />
                      ))}
                    </div>
                  </div>
                )}
                {/* Error */}
                {!fetchingSlots && slotsError && (
                  <p className="text-xs text-slate-400 text-center py-4">
                    {slotsError}
                  </p>
                )}
                {/* Empty */}
                {!fetchingSlots &&
                  !slotsError &&
                  availableGroups.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">
                      No available slots.
                    </p>
                  )}
                {/* Day tab switcher + slots */}
                {!fetchingSlots &&
                  !slotsError &&
                  availableGroups.length > 0 && (
                    <>
                      {/* Day tabs */}
                      <div className="flex gap-2">
                        {availableGroups.map((group, idx) => {
                          const isActive = activeDayIndex === idx;
                          const selCount = selectedCountForDay(group.date);
                          return (
                            <button
                              key={group.date}
                              type="button"
                              onClick={() => setActiveDayIndex(idx)}
                              className={`
                            relative flex-1 flex flex-col items-center justify-center
                            py-2 px-1 rounded-xl border text-center transition-all duration-200
                            ${
                              isActive
                                ? "bg-blue-900 border-blue-900 shadow-md shadow-blue-100"
                                : "bg-white border-slate-200 hover:border-blue-200 hover:bg-blue-50"
                            }
                          `}
                            >
                              {selCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center z-10">
                                  <span className="text-[8px] font-black text-white">
                                    {selCount}
                                  </span>
                                </span>
                              )}
                              <span
                                className={`text-[11px] font-bold leading-tight ${isActive ? "text-white" : "text-slate-600"}`}
                              >
                                {group.displayDate.split(",")[0]}
                              </span>
                              <span
                                className={`text-[9px] font-medium mt-0.5 ${isActive ? "text-blue-100" : "text-slate-400"}`}
                              >
                                {group.displayDate.split(", ")[1]}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      {/* Slot pills for active day */}
                      {activeGroup && (
                        <div>
                          <div className="flex items-center justify-between mb-2.5">
                            <span className="text-xs font-bold text-slate-600">
                              {activeGroup.displayDate}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {activeFreeSlots.length} open
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-5">
                            {activeFreeSlots.map((slot, i) => (
                              <SlotPill
                                key={i}
                                slot={slot}
                                group={activeGroup}
                                selected={isSlotSelected(
                                  activeGroup.date,
                                  slot.startTime,
                                )}
                                maxReached={selectedSlots.length >= MAX_SLOTS}
                                onToggle={toggleSlot}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                {/* Selected slots panel */}
                {selectedSlots.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                        Your selections
                      </p>
                      <button
                        type="button"
                        onClick={() => setSelectedSlots([])}
                        className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors duration-150"
                      >
                        <svg
                          width="9"
                          height="9"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        </svg>
                        Clear all
                      </button>
                    </div>
                    <div className="flex flex-col gap-3">
                      {selectedSlots.map((s, i) => (
                        <SelectedSlotRow
                          key={i}
                          slot={s}
                          index={i}
                          onRemove={removeSlot}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {/* ══════════ END SLOT SELECTION UI ══════════ */}
            {/* ── Message ── */}
            <div>
              <p className="text-sm font-bold text-slate-700 mb-2">
                Write a custom message
              </p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder={`Hi ${user?.name?.split(" ")[0] || "there"}, I'm looking for guidance on...`}
                className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-150 resize-none"
              />
              <p className="text-xs text-slate-400 text-right mt-1">
                {message.length}/500
              </p>
            </div>
            {/* ── Error ── */}
            {(error || lockError) && (
              <div className="flex items-center gap-2 text-xs bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3">
                <span>⚠</span> {lockError || error}
              </div>
            )}
            {/* ── Actions ── */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  unlockAll();
                  onClose();
                }}
                className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all duration-150"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || selectedSlots.length === 0}
                className="flex-1 py-3 rounded-2xl bg-blue-900 text-white text-sm font-bold hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-sm shadow-blue-200 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Connect Request
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
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default MentorProfileModal;
