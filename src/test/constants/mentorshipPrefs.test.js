import { describe, it, expect } from "vitest";
import { COMM_OPTIONS, COMM_ICONS, LANGUAGE_OPTIONS } from "../../shared/constants/mentorshipPrefs";

describe("Mentorship Preferences Constants Suite", () => {

    describe("COMM_OPTIONS Structural Array Schema", () => {
        it("should be structured as an array containing exactly 5 option entries", () => {
            expect(Array.isArray(COMM_OPTIONS)).toBe(true);
            expect(COMM_OPTIONS).toHaveLength(5);
        });

        it("should maintain clean key-value structures across all item shapes", () => {
            COMM_OPTIONS.forEach((option) => {
                expect(option).toHaveProperty("value");
                expect(option).toHaveProperty("label");
                expect(option).toHaveProperty("icon");
                expect(typeof option.value).toBe("string");
                expect(typeof option.label).toBe("string");
                expect(typeof option.icon).toBe("string");
            });
        });
    });

    describe("COMM_ICONS Map Object Lookup Layer", () => {
        it("should map options into clean, immediate key-value lookup parameters directly", () => {
            expect(COMM_ICONS).toHaveProperty("Chat", "💬");
            expect(COMM_ICONS).toHaveProperty("Video Call", "🎥");
            expect(COMM_ICONS).toHaveProperty("Email", "✉️");
            expect(COMM_ICONS).toHaveProperty("Phone Call", "📞");
            expect(COMM_ICONS).toHaveProperty("In-Person", "🤝");
        });

        it("should verify that the map keys correspond exactly to the number of original items", () => {
            const structuralKeys = Object.keys(COMM_ICONS);
            expect(structuralKeys).toHaveLength(5);
        });
    });

    describe("LANGUAGE_OPTIONS Selection Registry List", () => {
        it("should preserve exactly 20 professional global options in the system registry array", () => {
            expect(Array.isArray(LANGUAGE_OPTIONS)).toBe(true);
            expect(LANGUAGE_OPTIONS).toHaveLength(20);
        });

        it("should identify specific key languages inside the option parameters", () => {
            expect(LANGUAGE_OPTIONS).toContain("English");
            expect(LANGUAGE_OPTIONS).toContain("Hindi");
            expect(LANGUAGE_OPTIONS).toContain("Spanish");
            expect(LANGUAGE_OPTIONS).toContain("Tamil");
            expect(LANGUAGE_OPTIONS).toContain("Urdu");
        });
    });
});