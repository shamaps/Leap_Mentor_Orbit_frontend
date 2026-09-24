// src/api/connectRequests.api.ts
import axiosInstance from "@/shared/utils/axiosInstance";
import { mapConnectRequestList } from "./connectRequestMapper";

export const getMyRequests = async () => {
    const res = await axiosInstance.get("/connect-requests/my-requests");
    return { requests: mapConnectRequestList(res.data.requests) };
};

export const getOngoingConnects = async () => {
    const res = await axiosInstance.get("/connect-requests/ongoing");
    return { connects: mapConnectRequestList(res.data.connects) };
};

interface SendConnectRequestPayload {
    mentorId: string;
    message: string;
    selectedSlots: unknown[];
    sessionRate: number;
    sessionCount: number;
}

export const sendConnectRequest = async ({
    mentorId,
    message,
    selectedSlots,
    sessionRate,
    sessionCount,
}: SendConnectRequestPayload): Promise<void> => {
    await axiosInstance.post("/connect-requests", {
        mentorId,
        message,
        selectedSlots,
        sessionRate,
        sessionCount,
    });
};

export const respondToRequest = async (
    requestId: string,
    { status, confirmedSlot }: { status: string; confirmedSlot?: unknown },
): Promise<void> => {
    await axiosInstance.patch(`/connect-requests/${requestId}`, {
        status,
        confirmedSlot,
    });
};

export const referRequest = async (requestId: string, referToMentorId: string): Promise<void> => {
    await axiosInstance.patch(`/connect-requests/${requestId}/refer`, {
        referToMentorId,
    });
};

export const getSimilarMentors = async (requestId: string) => {
    const res = await axiosInstance.get(`/connect-requests/${requestId}/similar-mentors`);
    return res.data;
};