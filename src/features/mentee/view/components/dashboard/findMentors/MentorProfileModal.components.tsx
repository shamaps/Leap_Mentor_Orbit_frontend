// src/features/mentee/view/components/dashboard/findMentors/MentorProfileModal.components.tsx
//
// SOLID / SRP refactor note: badge config, slot-formatting helpers, and the
// pure presentational sub-components (StarRating, SlotPill, SelectedSlotRow)
// used to live inline inside MentorProfileModal.tsx. Extracted here because
// none of them depend on the modal's own state/hooks (useMentorSlots,
// useConnectRequest, useSlotLock) — they're pure functions of their props.

import type { PublicTimeSlot, PublicSpecificDate } from "@/features/mentor/model/availability.types";

type MentorProfile = Record<string, any>;

interface SelectedSlot extends PublicTimeSlot {
    date: string;
    day?: string;
    displayDate?: string;
}

export const ELIGIBLE_BADGES_CONFIG = [
    { id: "newcomer", title: "Newcomer", icon: "👋", blurb: "Joined LeapMentor", verify: () => true },
    { id: "ten_sessions", title: "10 Sessions", icon: "🎯", blurb: "Completed 10 sessions", verify: (m: MentorProfile) => (m?.totalSessions || 0) >= 10 },
    { id: "top_rated", title: "Top Rated", icon: "⭐", blurb: "Achieved 4.5+ rating", verify: (m: MentorProfile) => (m?.avgRating || 0) >= 4.5 },
    { id: "expert_guide", title: "Expert Guide", icon: "🏆", blurb: "50+ sessions completed", verify: (m: MentorProfile) => (m?.totalSessions || 0) >= 50 }
];
export const SLOT_DOT_KEYS = ["dot-1", "dot-2", "dot-3", "dot-4", "dot-5"];
export const MAX_SLOTS = 5;

export const formatTime = (timeString?: string) => {
    if (!timeString) return "";
    const fragments = timeString.split(":").map(Number);
    const notation = fragments[0] >= 12 ? "PM" : "AM";
    const adjustedHour = fragments[0] % 12 || 12;
    return `${String(adjustedHour).padStart(2, "0")}:${String(fragments[1]).padStart(2, "0")} ${notation}`;
};

export const StarRating = ({ rating, reviewCount }: { rating?: number | string; reviewCount?: number }) => {
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
            {(reviewCount ?? 0) > 0 && <p className="text-xs text-slate-400">({reviewCount} reviews)</p>}
        </div>
    );
};

// ── Alternative Slot Pill Sub-component Layout ────────────────
export const SlotPill = ({
    slot,
    group,
    selected,
    maxReached,
    onToggle,
}: {
    slot: PublicTimeSlot;
    group: PublicSpecificDate;
    selected: boolean;
    maxReached: boolean;
    onToggle: (slot: PublicTimeSlot, group: PublicSpecificDate) => void;
}) => {
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

// ── Alternative Selection Row Component ───────────────────────
export const SelectedSlotRow = ({
    slot,
    index,
    onRemove,
}: {
    slot: SelectedSlot;
    index: number;
    onRemove: (index: number) => void;
}) => (
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
