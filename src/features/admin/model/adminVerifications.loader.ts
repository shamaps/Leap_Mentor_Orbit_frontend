// src/features/admin/model/adminVerifications.loader.ts
import { getMentorVerifications } from "./admin.api";
import { requireAdminAuth } from "./requireAdminAuth";

export const adminVerificationsLoader = async () => {
    await requireAdminAuth();
    try {
        const { data } = await getMentorVerifications();
        return { mentors: data.mentors || data, error: null };
    } catch {
        return { mentors: [], error: "Failed to load verifications." };
    }
};