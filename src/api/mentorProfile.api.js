// src/api/mentorProfile.api.js
import axiosInstance from "../utils/axiosInstance";

export const getMentorProfile = async () => {
    const res = await axiosInstance.get("/mentor-profile/me");
    return res.data;
};

export const updateMentorProfile = async (payload) => {
    const res = await axiosInstance.patch("/mentor-profile/me", payload);
    return res.data;
};