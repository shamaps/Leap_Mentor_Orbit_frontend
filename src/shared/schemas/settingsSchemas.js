// src/schemas/settingsSchemas.js

import { z } from "zod";

export const commissionSchema = z.object({
    commission: z
        .string()
        .trim()
        .min(1, "Commission rate is required.")
        .refine((val) => !Number.isNaN(Number.parseFloat(val)), "Enter a valid number.")
        .refine((val) => {
            const rate = Number.parseFloat(val);
            return rate >= 0 && rate <= 100;
        }, "Commission must be between 0 and 100."),
});

export const addAdminSchema = z.object({
    adminName: z.string().trim().min(1, "Name is required."),
    adminEmail: z
        .string()
        .trim()
        .min(1, "Email is required.")
        .email("Please enter a valid email address."),
});