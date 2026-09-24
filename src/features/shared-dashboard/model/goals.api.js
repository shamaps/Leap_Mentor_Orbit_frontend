// src/api/goals.api.js
import axiosInstance from "@/shared/utils/axiosInstance";
export const getGoal = async (connectRequestId) => {
    const res = await axiosInstance.get(`/goals/${connectRequestId}`);
    return res.data;
};

export const createGoal = async ({ connectRequestId, title, description, startDate, endDate }) => {
    const res = await axiosInstance.post("/goals", {
        connectRequestId,
        title,
        description,
        startDate,
        endDate,
    });
    return res.data;
};

export const updateGoal = async (goalId, fields) => {
    const res = await axiosInstance.patch(`/goals/${goalId}`, fields);
    return res.data;
};

export const addMilestone = async (goalId, { title, dueDate }) => {
    const res = await axiosInstance.post(`/goals/${goalId}/milestones`, { title, dueDate });
    return res.data;
};

export const toggleMilestone = async (milestoneId, isCompleted) => {
    const res = await axiosInstance.patch(`/goals/milestones/${milestoneId}`, {
        isCompleted,
        socketId: globalThis.__leapSocket?.id,
    });
    return res.data;
};
export const deleteMilestone = async (milestoneId) => {
    await axiosInstance.delete(`/goals/milestones/${milestoneId}`);
};