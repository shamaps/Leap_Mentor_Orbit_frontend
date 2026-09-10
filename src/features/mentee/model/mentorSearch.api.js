// src/api/mentorSearch.api.js
import axiosInstance from "@/shared/utils/axiosInstance";
import { mapMentorSearchResponse } from "@/features/mentor/model/mentorMapper";

export const searchMentors = async (params) => {
    const res = await axiosInstance.get("/mentors/search", { params });
    return mapMentorSearchResponse(res.data);
};