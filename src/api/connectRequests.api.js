// src/api/connectRequests.api.js
import axiosInstance from "../utils/axiosInstance";

export const getMyRequests = async () => {
    const res = await axiosInstance.get("/connect-requests/my-requests");
    return res.data;
};

export const getOngoingConnects = async () => {
    const res = await axiosInstance.get("/connect-requests/ongoing");
    return res.data;
};

export const sendConnectRequest = async ({
    mentorId,
    message,
    selectedSlots,
    sessionRate,
    sessionCount,
}) => {
    await axiosInstance.post("/connect-requests", {
        mentorId,
        message,
        selectedSlots,
        sessionRate,
        sessionCount,
    });
};

export const respondToRequest = async (requestId, { status, confirmedSlot }) => {
    await axiosInstance.patch(`/connect-requests/${requestId}`, {
        status,
        confirmedSlot,
    });
};

export const referRequest = async (requestId, referToMentorId) => {
    await axiosInstance.patch(`/connect-requests/${requestId}/refer`, {
        referToMentorId,
    });
};
export const getSimilarMentors = async (requestId) => {
    const res = await axiosInstance.get(`/connect-requests/${requestId}/similar-mentors`);
    return res.data;
};