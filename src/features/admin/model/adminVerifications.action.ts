// src/features/admin/model/adminVerifications.action.ts

import { verifyMentor } from "./admin.api";
import { requireAdminAuth } from "./requireAdminAuth";
import { getApiResponseMessage } from "@/shared/utils/getErrorMessage";

export const adminVerificationsAction = async ({ request }: { request: Request }) => {
    await requireAdminAuth();
    const formData = await request.formData();
    const mentorProfileId = formData.get("mentorProfileId") as string;

    if (!mentorProfileId) {
        return { success: false, error: "Missing mentor profile id." };
    }

    try {
        await verifyMentor(mentorProfileId);
        return { success: true, mentorProfileId };
    } catch (err: unknown) {
        return {
            success: false,
            error: getApiResponseMessage(err, "Verification failed."),
        };
    }
};