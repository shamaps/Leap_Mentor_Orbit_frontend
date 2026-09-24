import { describe, it, expect } from "vitest";
import { goalSchema, reportSchema } from "../../shared/schemas/miscSchemas";

describe("goalSchema", () => {
    it("passes with just a valid title (description/dates optional)", () => {
        expect(goalSchema.safeParse({ title: "Learn React" }).success).toBe(true);
    });

    it("fails when title is under 3 characters", () => {
        const result = goalSchema.safeParse({ title: "Hi" });
        expect(result.error.flatten().fieldErrors.title[0]).toBe(
            "Goal title must be at least 3 characters",
        );
    });

    it("passes when both startDate and endDate are provided in order", () => {
        const result = goalSchema.safeParse({
            title: "Learn React",
            startDate: "2026-01-01",
            endDate: "2026-06-01",
        });
        expect(result.success).toBe(true);
    });

    it("passes when startDate and endDate are equal", () => {
        const result = goalSchema.safeParse({
            title: "Learn React",
            startDate: "2026-01-01",
            endDate: "2026-01-01",
        });
        expect(result.success).toBe(true);
    });

    it("fails when endDate is before startDate", () => {
        const result = goalSchema.safeParse({
            title: "Learn React",
            startDate: "2026-06-01",
            endDate: "2026-01-01",
        });
        expect(result.success).toBe(false);
        const flat = result.error.flatten();
        expect(flat.fieldErrors.endDate).toContain("End date cannot be before start date");
    });

    it("passes when only startDate is provided (no endDate to compare)", () => {
        const result = goalSchema.safeParse({ title: "Learn React", startDate: "2026-01-01" });
        expect(result.success).toBe(true);
    });

    it("passes when only endDate is provided (no startDate to compare)", () => {
        const result = goalSchema.safeParse({ title: "Learn React", endDate: "2026-01-01" });
        expect(result.success).toBe(true);
    });

    it("trims whitespace from title", () => {
        const result = goalSchema.safeParse({ title: "  Learn React  " });
        expect(result.success).toBe(true);
        expect(result.data.title).toBe("Learn React");
    });
});

describe("reportSchema", () => {
    it("passes with a valid complaintType and description", () => {
        const result = reportSchema.safeParse({
            complaintType: "harassment",
            description: "This is a detailed complaint description.",
        });
        expect(result.success).toBe(true);
    });

    it("fails when complaintType is empty", () => {
        const result = reportSchema.safeParse({
            complaintType: "",
            description: "This is a detailed complaint description.",
        });
        expect(result.error.flatten().fieldErrors.complaintType[0]).toBe(
            "Please select a complaint type.",
        );
    });

    it("fails when description is under 10 characters", () => {
        const result = reportSchema.safeParse({ complaintType: "spam", description: "short" });
        expect(result.error.flatten().fieldErrors.description[0]).toBe(
            "Description must be at least 10 characters.",
        );
    });

    it("trims whitespace from description before checking length", () => {
        const result = reportSchema.safeParse({
            complaintType: "spam",
            description: "   short   ",
        });
        expect(result.success).toBe(false);
    });
});