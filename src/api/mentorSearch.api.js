// src/api/mentorSearch.api.js
import axiosInstance from "../utils/axiosInstance";

export const searchMentors = async (params) => {
    const res = await axiosInstance.get("/mentors/search", { params });
    return res.data;
};