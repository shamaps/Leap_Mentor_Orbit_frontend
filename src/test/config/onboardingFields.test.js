import { describe, it, expect } from "vitest";
import { MENTEE_ONBOARDING_FIELDS, MENTOR_ONBOARDING_FIELDS } from "../../config/onboardingFields";

describe("Onboarding Fields Configuration Suite", () => {
    describe("Mentee Onboarding Fields Matrix", () => {
        it("should export an array with exactly 12 required configuration fields", () => {
            expect(Array.isArray(MENTEE_ONBOARDING_FIELDS)).toBe(true);
            expect(MENTEE_ONBOARDING_FIELDS).toHaveLength(12);
        });

        it("should maintain valid structured objects containing only key and type parameters", () => {
            MENTEE_ONBOARDING_FIELDS.forEach((field) => {
                expect(field).toHaveProperty("key");
                expect(field).toHaveProperty("type");
                expect(typeof field.key).toBe("string");
                expect(["string", "array"]).toContain(field.type);
            });
        });

        it("should contain the specific mandatory field keys for the mentee tracking flow", () => {
            const keys = MENTEE_ONBOARDING_FIELDS.map((f) => f.key);
            const expectedKeys = [
                "profilePicture",
                "bio",
                "currentRole",
                "company",
                "industry",
                "yearsOfExperience",
                "interestedFields",
                "skills",
                "communicationPreferences",
                "languages",
                "linkedInUrl",
                "portfolioUrl",
            ];
            expect(keys).toEqual(expectedKeys);
        });
    });

    describe("Mentor Onboarding Fields Matrix", () => {
        it("should export an array with exactly 12 required configuration fields", () => {
            expect(Array.isArray(MENTOR_ONBOARDING_FIELDS)).toBe(true);
            expect(MENTOR_ONBOARDING_FIELDS).toHaveLength(12);
        });

        it("should maintain valid structured objects containing only key and type parameters", () => {
            MENTOR_ONBOARDING_FIELDS.forEach((field) => {
                expect(field).toHaveProperty("key");
                expect(field).toHaveProperty("type");
                expect(typeof field.key).toBe("string");
                expect(["string", "array"]).toContain(field.type);
            });
        });

        it("should contain the specific mandatory field keys for the mentor tracking flow", () => {
            const keys = MENTOR_ONBOARDING_FIELDS.map((f) => f.key);
            const expectedKeys = [
                "profilePicture",
                "bio",
                "currentRole",
                "industry",
                "company",
                "yearsOfExperience",
                "hourlyRate",
                "skills",
                "communicationPreferences",
                "languages",
                "linkedInUrl",
                "portfolioUrl",
            ];
            expect(keys).toEqual(expectedKeys);
        });

        it("should enforce correct specific variance types compared to mentee fields", () => {
            // Direct variance sanity check: languages field is string for mentor, array for mentee
            const mentorLanguages = MENTOR_ONBOARDING_FIELDS.find((f) => f.key === "languages");
            const menteeLanguages = MENTEE_ONBOARDING_FIELDS.find((f) => f.key === "languages");

            expect(mentorLanguages.type).toBe("string");
            expect(menteeLanguages.type).toBe("array");

            // Verify hourlyRate exclusive parameter exists only on mentor profiles
            expect(MENTOR_ONBOARDING_FIELDS.some((f) => f.key === "hourlyRate")).toBe(true);
            expect(MENTEE_ONBOARDING_FIELDS.some((f) => f.key === "hourlyRate")).toBe(false);
        });
    });
});