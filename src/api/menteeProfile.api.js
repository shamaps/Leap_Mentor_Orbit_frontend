// src/api/menteeProfile.api.js
import axiosInstance from "../utils/axiosInstance";

export const getMenteeProfile = async () => {
    const res = await axiosInstance.get("/mentee-profile/me");
    return res.data;
};

export const updateMenteeProfile = async (payload) => {
    const res = await axiosInstance.patch("/mentee-profile/me", payload);
    return res.data;
};