// src/features/admin/model/adminVerifications.loader.ts
import { getMentorVerifications } from "./admin.api";

export const adminVerificationsLoader = async () => {
    try {
        const { data } = await getMentorVerifications();
        return { mentors: data.mentors || data, error: null };
    } catch {
        return { mentors: [], error: "Failed to load verifications." };
    }
};
