// src/api/mentorSearch.api.ts
import axiosInstance from "@/shared/utils/axiosInstance";
import { mapMentorSearchResponse } from "@/features/mentor/model/mentorMapper";

export const searchMentors = async (params: Record<string, unknown> | URLSearchParams) => {
    const res = await axiosInstance.get("/mentors/search", { params });
    return mapMentorSearchResponse(res.data);
};