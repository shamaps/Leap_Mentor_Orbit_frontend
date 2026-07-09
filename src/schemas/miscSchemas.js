// src/schemas/miscSchemas.js
import { z } from "zod";

export const goalSchema = z
    .object({
        title: z.string().trim().min(3, "Goal title must be at least 3 characters"),
        description: z.string().trim().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
    })
    .refine(
        (data) => !data.startDate || !data.endDate || data.endDate >= data.startDate,
        { message: "End date cannot be before start date", path: ["endDate"] }
    );

export const reportSchema = z.object({
    complaintType: z.string().min(1, "Please select a complaint type."),
    description: z.string().trim().min(10, "Description must be at least 10 characters."),
});