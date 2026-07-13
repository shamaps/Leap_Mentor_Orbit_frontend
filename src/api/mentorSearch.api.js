// src/api/mentorSearch.api.js
import axiosInstance from "../utils/axiosInstance";
import { mapMentorSearchResponse } from "../mappers/mentorMapper";

export const searchMentors = async (params) => {
    const res = await axiosInstance.get("/mentors/search", { params });
    return mapMentorSearchResponse(res.data);
};