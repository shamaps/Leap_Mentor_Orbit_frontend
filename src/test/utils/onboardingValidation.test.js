import { describe, it, expect } from "vitest";
import {
    isOnlyNumbers, isValidUrl, validateCommonFields,
    validateMenteeFields, getMenteeFieldErrors, getMentorFieldErrors,
} from "../../utils/onboardingValidation";

describe("isOnlyNumbers", () => {
    it("returns true for a string of digits", () => {
        expect(isOnlyNumbers("12345")).toBe(true);
    });
    it("returns true when digits have surrounding whitespace", () => {
        expect(isOnlyNumbers("  123  ")).toBe(true);
    });
    it("returns false for alphanumeric strings", () => {
        expect(isOnlyNumbers("abc123")).toBe(false);
    });
    it("returns false for empty/undefined input", () => {
        expect(isOnlyNumbers("")).toBe(false);
        expect(isOnlyNumbers(undefined)).toBe(false);
    });
});

describe("isValidUrl", () => {
    it("returns true for empty input (optional field)", () => {
        expect(isValidUrl("")).toBe(true);
        expect(isValidUrl(undefined)).toBe(true);
    });
    it("returns true for a well-formed URL", () => {
        expect(isValidUrl("https://linkedin.com/in/username")).toBe(true);
    });
    it("returns false for a malformed URL", () => {
        expect(isValidUrl("not a url")).toBe(false);
    });
});

describe("validateCommonFields", () => {
    const baseForm = {
        currentRole: "Engineer",
        yearsOfExperience: "5",
        industry: "Tech",
        company: "Acme",
        linkedInUrl: "",
        portfolioUrl: "",
    };

    it("returns null when all fields are valid", () => {
        expect(validateCommonFields(baseForm)).toBeNull();
    });
    it("requires currentRole", () => {
        expect(validateCommonFields({ ...baseForm, currentRole: "" })).toBe("Current Role is required.");
    });
    it("requires yearsOfExperience", () => {
        expect(validateCommonFields({ ...baseForm, yearsOfExperience: "" })).toBe("Years of Experience is required.");
    });
    it("requires industry", () => {
        expect(validateCommonFields({ ...baseForm, industry: "" })).toBe("Industry is required.");
    });
    it("rejects a numeric currentRole", () => {
        expect(validateCommonFields({ ...baseForm, currentRole: "12345" })).toBe("Current Role cannot be a number.");
    });
    it("rejects a numeric company name", () => {
        expect(validateCommonFields({ ...baseForm, company: "12345" })).toBe("Company name cannot be a number.");
    });
    it("rejects an invalid LinkedIn URL", () => {
        expect(validateCommonFields({ ...baseForm, linkedInUrl: "bad url" })).toBe(
            "Please enter a valid LinkedIn URL (e.g. https://linkedin.com/in/username).",
        );
    });
    it("rejects an invalid Portfolio URL", () => {
        expect(validateCommonFields({ ...baseForm, portfolioUrl: "bad url" })).toBe(
            "Please enter a valid Portfolio URL (e.g. https://yoursite.com).",
        );
    });
});

describe("validateMenteeFields", () => {
    const baseForm = {
        currentRole: "Student",
        yearsOfExperience: "0",
        industry: "Tech",
        company: "",
        linkedInUrl: "",
        portfolioUrl: "",
        interestedFields: ["AI"],
        skills: ["JS"],
    };

    it("returns null when everything is valid", () => {
        expect(validateMenteeFields(baseForm)).toBeNull();
    });
    it("returns the common-field error first if present", () => {
        expect(validateMenteeFields({ ...baseForm, currentRole: "" })).toBe("Current Role is required.");
    });
    it("requires at least one interested field", () => {
        expect(validateMenteeFields({ ...baseForm, interestedFields: [] })).toBe(
            "Please add at least one Field of Interest.",
        );
    });
    it("requires at least one skill", () => {
        expect(validateMenteeFields({ ...baseForm, skills: [] })).toBe(
            "Please add at least one Skill of Interest.",
        );
    });
});

describe("getMenteeFieldErrors", () => {
    it("returns an empty object when the form is complete", () => {
        expect(getMenteeFieldErrors({
            currentRole: "Student", yearsOfExperience: "0", industry: "Tech",
            interestedFields: ["AI"], skills: ["JS"],
        })).toEqual({});
    });
    it("flags each missing field individually", () => {
        expect(getMenteeFieldErrors({})).toEqual({
            currentRole: true, yearsOfExperience: true, industry: true,
            interestedFields: true, skills: true,
        });
    });
});

describe("getMentorFieldErrors", () => {
    it("returns an empty object when the form is complete", () => {
        expect(getMentorFieldErrors({
            currentRole: "Mentor", yearsOfExperience: "5", industry: "Tech", skills: ["React"],
        })).toEqual({});
    });
    it("flags each missing field individually", () => {
        expect(getMentorFieldErrors({})).toEqual({
            currentRole: true, yearsOfExperience: true, industry: true, skills: true,
        });
    });
});