// src/api/menteeProfile.api.ts
import axiosInstance from "@/shared/utils/axiosInstance";
import { mapMenteeProfile } from "./menteeMapper";

export const getMenteeProfile = async (signal?: AbortSignal) => {
    const res = await axiosInstance.get("/mentee-profile/me", { signal });
    return mapMenteeProfile(res.data);
};

export const updateMenteeProfile = async (payload: Record<string, unknown>) => {
    const res = await axiosInstance.patch("/mentee-profile/me", payload);
    return res.data;
};