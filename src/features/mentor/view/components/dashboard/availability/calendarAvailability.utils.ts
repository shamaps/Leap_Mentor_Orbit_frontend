// src/features/mentor/view/components/dashboard/availability/calendarAvailability.utils.ts

import type { BusySlot, SpecificDate, TimeSlot } from "@/features/mentor/model/availability.types";

export interface CalendarEventItem {
    id: string;
    summary?: string;
    start?: string; // ISO datetime, or "YYYY-MM-DD" when allDay
    end?: string;
    allDay?: boolean;
}

export type Meridian = "AM" | "PM";

export interface TimeParts {
    hour12: number;
    minute: number;
    period: Meridian;
}

export interface DayCell {
    blank: true;
    key: string;
}

export const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];
export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const getTodayLocal = (): string => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

export const toDateStr = (year: number, month: number, day: number): string =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

export const GRID_7: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
};

export const getOverlappingBusy = (dateStr: string, slot: TimeSlot, busySlots: BusySlot[]): BusySlot[] => {
    if (!busySlots?.length) return [];
    const slotStart = new Date(`${dateStr}T${slot.startTime}:00`);
    const slotEnd = new Date(`${dateStr}T${slot.endTime}:00`);
    return busySlots.filter((busy) => {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);
        return slotStart < busyEnd && slotEnd > busyStart;
    });
};

export const formatTime = (isoStr?: string): string => {
    if (!isoStr?.includes("T")) return "";
    const d = new Date(isoStr);
    return d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
};

export const removeSlotById = (day: SpecificDate, slotId: string): SpecificDate => ({
    ...day,
    slots: day.slots.filter((s) => s.id !== slotId),
});

export const updateSlotById = (
    day: SpecificDate,
    slotId: string,
    field: "startTime" | "endTime",
    value: string,
): SpecificDate => ({
    ...day,
    slots: day.slots.map((s) => (s.id === slotId ? { ...s, [field]: value } : s)),
});

export const timeToMins = (t?: string): number => {
    if (!t) return 0;
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
};

// null = valid, otherwise returns an error string
export const getSlotError = (startTime: string, endTime: string, minDuration: number): string | null => {
    if (!startTime || !endTime) return null;
    const diff = timeToMins(endTime) - timeToMins(startTime);
    if (diff === 0) return "Start and end time cannot be the same";
    if (diff < 0) return "End time must be after start time";
    if (minDuration && diff < minDuration)
        return `Minimum slot duration is ${minDuration} min`;
    return null;
};

export const getEventsForDate = (dateStr: string, events: CalendarEventItem[]): CalendarEventItem[] => {
    if (!events?.length) return [];
    return events.filter((e) => {
        if (!e.start) return false;
        if (e.allDay) return e.start === dateStr;
        const localDate = new Date(e.start).toLocaleDateString("en-CA", {
            timeZone: "Asia/Kolkata",
        });
        return localDate === dateStr;
    });
};

// ─── Parse / format "HH:MM" (24h) ────────────────────────────────────────────

/** "14:30" → { hour12: 2, minute: 30, period: "PM" } */
export const parse24 = (timeStr?: string): TimeParts => {
    if (!timeStr) return { hour12: 9, minute: 0, period: "AM" };
    const [h, m] = timeStr.split(":").map(Number);
    const period: Meridian = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return { hour12, minute: m, period };
};

/** { hour12, minute, period } → "14:30" */
export const format24 = ({ hour12, minute, period }: TimeParts): string => {
    let h = hour12 % 12;
    if (period === "PM") h += 12;
    return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

export const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
export const MINUTES = [0, 15, 30, 45]; // quarter-hours only

export const parseTyped = (raw: string): string | null => {
    const s = raw.trim();
    const match = s.match(/^(\d{1,2})[:.]?(\d{2})?\s*(am|pm)?$/i);
    if (!match) return null;
    let hh = Number.parseInt(match[1], 10);
    let mm = match[2] ? Number.parseInt(match[2], 10) : 0;
    const meridian = match[3]?.toLowerCase();

    if (hh > 23 || mm > 59) return null;

    if (meridian === "pm" && hh < 12) hh += 12;
    if (meridian === "am" && hh === 12) hh = 0;

    mm = Math.round(mm / 15) * 15;
    if (mm === 60) {
        mm = 0;
        hh = Math.min(hh + 1, 23);
    }

    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};