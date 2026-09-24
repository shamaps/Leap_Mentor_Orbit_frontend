// src/api/availability.api.js
import axiosInstance from "@/shared/utils/axiosInstance";
// ── Mentor availability settings ────────────────────────────────

export const getMyAvailability = async () => {
    const res = await axiosInstance.get("/availability/me");
    return res.data;
};

export const saveMyAvailability = async ({ timezone, sessionDurations, specificDates }) => {
    await axiosInstance.patch("/availability/me", {
        timezone,
        sessionDurations,
        specificDates,
    });
};

export const getMentorAvailabilityForReschedule = async (connectRequestId, duration) => {
    const res = await axiosInstance.get(
        `/sessions/${connectRequestId}/mentor-availability`,
        { params: { duration } },
    );
    return res.data;
};

// ── Fetches a mentor's public available slots for a given duration
// (used when a mentee views a mentor's profile / books a session) ──
export const getMentorSlots = async (mentorUserId, duration) => {
    const res = await axiosInstance.get(`/availability/${mentorUserId}/slots?duration=${duration}`);
    return res.data;
};

// ── Google Calendar integration ─────────────────────────────────

export const getGoogleCalendarAuthUrl = async () => {
    const res = await axiosInstance.get("/google-calendar/auth-url");
    return res.data;
};

export const getGoogleCalendarStatus = async () => {
    const res = await axiosInstance.get("/google-calendar/status");
    return res.data;
};

export const disconnectGoogleCalendar = async () => {
    await axiosInstance.delete("/google-calendar/connection");
};

export const getGoogleCalendarBusySlots = async (params) => {
    const res = await axiosInstance.get("/google-calendar/busy", { params });
    return res.data;
};

export const getGoogleCalendarEvents = async (params) => {
    const res = await axiosInstance.get("/google-calendar/events", { params });
    return res.data;
};