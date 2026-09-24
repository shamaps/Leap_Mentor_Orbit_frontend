// src/features/admin/model/adminSettings.loader.ts
import { getCommissionSettings } from "./admin.api";

export const adminSettingsLoader = async () => {
    try {
        const { data } = await getCommissionSettings();
        return { commissionRate: data.commissionRate, error: null };
    } catch {
        return { commissionRate: null, error: "Failed to load settings." };
    }
};
