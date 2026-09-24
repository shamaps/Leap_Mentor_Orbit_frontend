// src/features/shared-dashboard/model/types.ts

import type { Socket } from "socket.io-client";

export type LeapSocket = Socket;

declare global {
    interface Window {
        __leapSocket?: LeapSocket;
    }
}

export interface ChatUser {
    _id?: string;
    name?: string;
    picture?: string;
}

export interface ChatMessage {
    _id: string;
    connectRequestId?: string;
    sender?: ChatUser | string;
    content: string;
    createdAt: string;
    readAt?: string | null;
}

export interface Milestone {
    _id: string;
    title: string;
    dueDate?: string;
    isCompleted: boolean;
}

export interface Goal {
    _id: string;
    connectRequestId: string;
    title: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
}

export interface SharedNote {
    _id: string;
    connectRequestId: string;
    title?: string;
    fileName?: string;
    fileUrl?: string;
    fileSize?: number;
    fileType?: string;
    uploadedBy?: ChatUser | string;
    createdAt: string;
}

export interface PrivateNote {
    _id: string;
    connectRequestId: string;
    title: string;
    content: string;
    createdAt: string;
    updatedAt?: string;
}

export interface SessionSlot {
    _id?: string;
    day?: string;
    date: string;
    startTime: string;
    endTime: string;
    status?: string;
    meetingLink?: string;
    cancelReason?: string;
}

export interface NewSlotDraft {
    slot?: SessionSlot;
    slotId?: string;
}

export interface SharedConnect {
    _id: string;
    viewerRole?: string;
    mentor?: ChatUser;
    mentee?: ChatUser;
    mentorProfile?: { profilePicture?: string };
    menteeProfile?: { profilePicture?: string };
    [key: string]: unknown;
}

export interface ActionResult {
    success: boolean;
    error?: string;
    [key: string]: unknown;
}

export interface ApiErrorLike {
    response?: {
        data?: {
            message?: string;
        };
    };
    message?: string;
}

export const getErrorMessage = (err: unknown, fallback: string): string => {
    const apiErr = err as ApiErrorLike;
    return apiErr?.response?.data?.message || apiErr?.message || fallback;
};