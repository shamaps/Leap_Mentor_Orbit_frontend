// src/api/sessions.api.js
import axiosInstance from "../utils/axiosInstance";

// ── Session slots ──────────────────────────────────────────────

export const getSlots = async (connectRequestId) => {
    const res = await axiosInstance.get(`/sessions/${connectRequestId}/slots`);
    return res.data;
};

export const setSlotMeetingLink = async (connectRequestId, slotIndex, meetingLink) => {
    const res = await axiosInstance.patch(
        `/sessions/${connectRequestId}/slots/${slotIndex}/meeting-link`,
        { meetingLink },
    );
    return res.data;
};

export const markSlotComplete = async (connectRequestId, slotIndex) => {
    const res = await axiosInstance.patch(
        `/sessions/${connectRequestId}/slots/${slotIndex}/status`,
        { action: "complete" },
    );
    return res.data;
};

export const addSlot = async (connectRequestId, { day, date, startTime, endTime }) => {
    const res = await axiosInstance.post(`/sessions/${connectRequestId}/slots`, {
        day,
        date,
        startTime,
        endTime,
    });
    return res.data;
};

export const cancelSlot = async (connectRequestId, slotIndex, reason = "") => {
    const res = await axiosInstance.patch(
        `/sessions/${connectRequestId}/slots/${slotIndex}/status`,
        { action: "cancel", reason },
    );
    return res.data;
};

export const rescheduleSlot = async (connectRequestId, slotIndex, { date, startTime, endTime }) => {
    const res = await axiosInstance.patch(
        `/sessions/${connectRequestId}/slots/${slotIndex}/status`,
        { action: "reschedule", date, startTime, endTime },
    );
    return res.data;
};

// ── Slot locks (temporary holds while a mentee is picking a slot) ──

export const lockSlot = async ({ mentorId, date, startTime, endTime }) => {
    const res = await axiosInstance.post("/slot-locks/lock", {
        mentorId,
        date,
        startTime,
        endTime,
    });
    return res.data;
};

export const unlockSlot = async ({ mentorId, date, startTime, endTime }) => {
    await axiosInstance.delete("/slot-locks/lock", {
        data: { mentorId, date, startTime, endTime },
    });
};

export const unlockAllSlots = async (mentorId) => {
    await axiosInstance.delete("/slot-locks/locks", { data: { mentorId } });
};