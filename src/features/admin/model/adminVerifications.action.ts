// src/features/admin/model/adminVerifications.action.ts

import { verifyMentor } from "./admin.api";

export const adminVerificationsAction = async ({ request }: { request: Request }) => {
    const formData = await request.formData();
    const mentorProfileId = formData.get("mentorProfileId") as string;

    if (!mentorProfileId) {
        return { success: false, error: "Missing mentor profile id." };
    }

    try {
        await verifyMentor(mentorProfileId);
        return { success: true, mentorProfileId };
    } catch (err: any) {
        return {
            success: false,
            error: err?.response?.data?.message || "Verification failed.",
        };
    }
};
