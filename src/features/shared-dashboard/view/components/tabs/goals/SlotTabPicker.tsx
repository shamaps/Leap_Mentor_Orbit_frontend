import { useState } from "react";
import {
    type Slot,
    type AvailabilityGroup,
    type NewSlotSelection,
    formatTimeShort,
} from "./sessionCard.utils";

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


export default SlotTabPicker;