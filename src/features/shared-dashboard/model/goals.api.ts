// src/api/goals.api.ts
import axiosInstance from "@/shared/utils/axiosInstance";

export const getGoal = async (connectRequestId: string) => {
    const res = await axiosInstance.get(`/goals/${connectRequestId}`);
    return res.data;
};

interface CreateGoalPayload {
    connectRequestId: string;
    title: string;
    description?: string;
    startDate?: string;
    endDate?: string;
}

export const createGoal = async ({ connectRequestId, title, description, startDate, endDate }: CreateGoalPayload) => {
    const res = await axiosInstance.post("/goals", {
        connectRequestId,
        title,
        description,
        startDate,
        endDate,
    });
    return res.data;
};

export const updateGoal = async (goalId: string, fields: Record<string, unknown>) => {
    const res = await axiosInstance.patch(`/goals/${goalId}`, fields);
    return res.data;
};

export const addMilestone = async (goalId: string, { title, dueDate }: { title: string; dueDate?: string }) => {
    const res = await axiosInstance.post(`/goals/${goalId}/milestones`, { title, dueDate });
    return res.data;
};

export const toggleMilestone = async (milestoneId: string, isCompleted: boolean) => {
    const res = await axiosInstance.patch(`/goals/milestones/${milestoneId}`, {
        isCompleted,
        socketId: globalThis.__leapSocket?.id,
    });
    return res.data;
};

export const deleteMilestone = async (milestoneId: string): Promise<void> => {
    await axiosInstance.delete(`/goals/milestones/${milestoneId}`);
};