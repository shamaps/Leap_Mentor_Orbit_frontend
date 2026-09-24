// src/api/sessions.api.js
import axiosInstance from "@/shared/utils/axiosInstance";
// ── Session slots ──────────────────────────────────────────────

export const getSlots = async (connectRequestId: string) => {
    const res = await axiosInstance.get(`/sessions/${connectRequestId}/slots`);
    return res.data;
};

export const setSlotMeetingLink = async (connectRequestId: string, slotIndex: number, meetingLink: string) => {
    const res = await axiosInstance.patch(
        `/sessions/${connectRequestId}/slots/${slotIndex}/meeting-link`,
        { meetingLink },
    );
    return res.data;
};

export const markSlotComplete = async (connectRequestId: string, slotIndex: number) => {
    const res = await axiosInstance.patch(
        `/sessions/${connectRequestId}/slots/${slotIndex}/status`,
        { action: "complete" },
    );
    return res.data;
};

interface SlotTiming {
    day: string;
    date: string;
    startTime: string;
    endTime: string;
}

export const addSlot = async (connectRequestId: string, { day, date, startTime, endTime }: SlotTiming) => {
    const res = await axiosInstance.post(`/sessions/${connectRequestId}/slots`, {
        day,
        date,
        startTime,
        endTime,
    });
    return res.data;
};

export const cancelSlot = async (connectRequestId: string, slotIndex: number, reason = "") => {
    const res = await axiosInstance.patch(
        `/sessions/${connectRequestId}/slots/${slotIndex}/status`,
        { action: "cancel", reason },
    );
    return res.data;
};

export const rescheduleSlot = async (
    connectRequestId: string,
    slotIndex: number,
    { date, startTime, endTime }: Omit<SlotTiming, "day">,
) => {
    const res = await axiosInstance.patch(
        `/sessions/${connectRequestId}/slots/${slotIndex}/status`,
        { action: "reschedule", date, startTime, endTime },
    );
    return res.data;
};

// ── Slot locks (temporary holds while a mentee is picking a slot) ──

interface SlotLockPayload {
    mentorId: string;
    date: string;
    startTime: string;
    endTime: string;
}

export const lockSlot = async ({ mentorId, date, startTime, endTime }: SlotLockPayload) => {
    const res = await axiosInstance.post("/slot-locks/lock", {
        mentorId,
        date,
        startTime,
        endTime,
    });
    return res.data;
};

export const unlockSlot = async ({ mentorId, date, startTime, endTime }: SlotLockPayload): Promise<void> => {
    await axiosInstance.delete("/slot-locks/lock", {
        data: { mentorId, date, startTime, endTime },
    });
};

export const unlockAllSlots = async (mentorId: string): Promise<void> => {
    await axiosInstance.delete("/slot-locks/locks", { data: { mentorId } });
};