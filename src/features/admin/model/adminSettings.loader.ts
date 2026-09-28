// src/features/admin/model/adminSettings.loader.ts
import { getCommissionSettings } from "./admin.api";
import { requireAdminAuth } from "./requireAdminAuth";

export const adminSettingsLoader = async () => {
    await requireAdminAuth();
    try {
        const { data } = await getCommissionSettings();
        return { commissionRate: data.commissionRate, error: null };
    } catch {
        return { commissionRate: null, error: "Failed to load settings." };
    }
};