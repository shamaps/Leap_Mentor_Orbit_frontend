// src/api/menteeProfile.api.js
import axiosInstance from "../utils/axiosInstance";
import { mapMenteeProfile } from "../mappers/menteeMapper";

export const getMenteeProfile = async (signal) => {
    const res = await axiosInstance.get("/mentee-profile/me", { signal });
    return mapMenteeProfile(res.data);
};

export const updateMenteeProfile = async (payload) => {
    const res = await axiosInstance.patch("/mentee-profile/me", payload);
    return res.data;
};