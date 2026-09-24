// src/features/shared-dashboard/view/components/tabs/goals/sessionCard.utils.ts
//
// Pure formatting/validation helpers extracted from SessionCard.tsx.
// SRP: no React state or rendering here — plain data transforms shared
// across SessionCard's sub-components (SlotPill, RescheduleModal, etc).

export interface Slot {
    date?: string;
    startTime?: string;
    endTime?: string;
    meetingLink?: string;
    status?: string;
    menteeMarked?: boolean;
    mentorMarked?: boolean;
    cancellationReason?: string;
    cancelledBy?: string;
    isRescheduled?: boolean;
}

export interface AvailabilityGroup {
    day?: string;
    date: string;
    slots: Slot[];
}

export interface NewSlotSelection {
    day?: string;
    date: string;
    startTime?: string;
    endTime?: string;
}

export const formatSlotDate = (slot?: Slot | null): string => {
    if (!slot?.date) return "";
    return new Date(slot.date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

export const formatTime = (t?: string | null): string => {
    if (!t) return "";
    const [h, m] = t.split(":");
    const hour = Number.parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    return `${hour % 12 || 12}:${m} ${ampm}`;
};
export const formatTimeShort = formatTime;
export const isMoreThan12HrsAway = (slot?: Slot | null): boolean => {
    if (!slot?.date || !slot?.startTime) return false;
    const sessionDateTime = new Date(`${slot.date}T${slot.startTime}`);
    const diffMs = sessionDateTime.getTime() - Date.now();
    return diffMs > 12 * 60 * 60 * 1000;
};

export const getSessionStatus = (cancelled: boolean, bothDone: boolean | undefined, slot?: Slot | null): string => {
    if (cancelled) return "cancelled";
    if (bothDone) return "completed";
    if (slot?.menteeMarked || slot?.mentorMarked) return "in_progress";
    return "pending";
};
export const isActive = (slot?: Slot | null): boolean => !slot?.status || slot?.status !== "cancelled";
// ── Meeting link validator ─────────────────────────────────────
export const ALLOWED_MEETING_DOMAINS = [
    "meet.google.com",
    "zoom.us",
    "teams.microsoft.com",
    "whereby.com",
    "meet.jit.si",
    "webex.com",
];

export const isValidMeetingLink = (rawUrl: string): boolean => {
    try {
        const url = new URL(rawUrl);
        if (url.protocol !== "https:") return false;
        const host = url.hostname.toLowerCase();
        return ALLOWED_MEETING_DOMAINS.some(
            (d) => host === d || host.endsWith(`.${d}`),
        );
    } catch {
        return false;
    }
};