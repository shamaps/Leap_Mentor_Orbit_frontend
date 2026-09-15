// src/api/availability.api.ts
import axiosInstance from "@/shared/utils/axiosInstance";
import type {
    AvailabilityPayload,
    AvailabilityResponse,
    BusySlot,
    CalendarEvent,
    GoogleCalendarStatus,
    PublicSpecificDate,
} from "./availability.types";

// ── Mentor availability settings ────────────────────────────────

export const getMyAvailability = async (): Promise<AvailabilityResponse> => {
    const res = await axiosInstance.get<AvailabilityResponse>("/availability/me");
    return res.data;
};

export const saveMyAvailability = async ({ timezone, sessionDurations, specificDates }: AvailabilityPayload): Promise<void> => {
    await axiosInstance.patch("/availability/me", {
        timezone,
        sessionDurations,
        specificDates,
    });
};

interface RescheduleAvailabilityResponse {
    sessionDurations?: AvailabilityPayload["sessionDurations"];
    slots?: PublicSpecificDate[];
}

export const getMentorAvailabilityForReschedule = async (
    connectRequestId: string,
    duration: number,
): Promise<RescheduleAvailabilityResponse> => {
    const res = await axiosInstance.get<RescheduleAvailabilityResponse>(
        `/sessions/${connectRequestId}/mentor-availability`,
        { params: { duration } },
    );
    return res.data;
};

interface MentorSlotsResponse {
    sessionDurations?: AvailabilityPayload["sessionDurations"];
    slots?: PublicSpecificDate[];
}

// ── Fetches a mentor's public available slots for a given duration
// (used when a mentee views a mentor's profile / books a session) ──
export const getMentorSlots = async (mentorUserId: string, duration: number): Promise<MentorSlotsResponse> => {
    const res = await axiosInstance.get<MentorSlotsResponse>(`/availability/${mentorUserId}/slots?duration=${duration}`);
    return res.data;
};

// ── Google Calendar integration ─────────────────────────────────

export const getGoogleCalendarAuthUrl = async (): Promise<{ url: string }> => {
    const res = await axiosInstance.get<{ url: string }>("/google-calendar/auth-url");
    return res.data;
};

export const getGoogleCalendarStatus = async (): Promise<GoogleCalendarStatus> => {
    const res = await axiosInstance.get<GoogleCalendarStatus>("/google-calendar/status");
    return res.data;
};

export const disconnectGoogleCalendar = async (): Promise<void> => {
    await axiosInstance.delete("/google-calendar/connection");
};

export const getGoogleCalendarBusySlots = async (params: Record<string, unknown>): Promise<{ busy: BusySlot[] }> => {
    const res = await axiosInstance.get<{ busy: BusySlot[] }>("/google-calendar/busy", { params });
    return res.data;
};

export const getGoogleCalendarEvents = async (params: Record<string, unknown>): Promise<{ events: CalendarEvent[] }> => {
    const res = await axiosInstance.get<{ events: CalendarEvent[] }>("/google-calendar/events", { params });
    return res.data;
};