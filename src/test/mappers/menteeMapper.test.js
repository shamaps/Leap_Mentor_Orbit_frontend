import { describe, it, expect } from "vitest";
import { mapMenteeProfile } from "../../mappers/menteeMapper";

describe("mapMenteeProfile", () => {
    it("returns null when given a falsy value", () => {
        expect(mapMenteeProfile(null)).toBeNull();
        expect(mapMenteeProfile(undefined)).toBeNull();
    });

    it("maps a fully populated raw profile", () => {
        const raw = {
            _id: "m1",
            profilePicture160: "pic160.jpg",
            profilePicture: "pic.jpg",
            bio: "Learning to code",
            currentRole: "Student",
            company: "Acme",
            industry: "Tech",
            yearsOfExperience: 2,
            skills: ["JS"],
            interestedFields: ["Frontend"],
            communicationPreferences: ["email"],
            languages: ["English"],
            linkedInUrl: "https://linkedin.com/in/m1",
            portfolioUrl: "https://m1.dev",
            emailNotifications: false,
            marketingPreferences: true,
            updatedAt: "2026-01-01",
        };
        expect(mapMenteeProfile(raw)).toEqual({
            id: "m1",
            profilePicture: "pic160.jpg",
            bio: "Learning to code",
            currentRole: "Student",
            company: "Acme",
            industry: "Tech",
            yearsOfExperience: 2,
            skills: ["JS"],
            interestedFields: ["Frontend"],
            communicationPreferences: ["email"],
            languages: ["English"],
            linkedInUrl: "https://linkedin.com/in/m1",
            portfolioUrl: "https://m1.dev",
            emailNotifications: false,
            marketingPreferences: true,
            updatedAt: "2026-01-01",
        });
    });

    it("falls back to id when _id is missing, and null when both are missing", () => {
        expect(mapMenteeProfile({ id: "m2" }).id).toBe("m2");
        expect(mapMenteeProfile({}).id).toBeNull();
    });

    it("falls back to profilePicture when profilePicture160 is absent", () => {
        expect(mapMenteeProfile({ profilePicture: "fallback.jpg" }).profilePicture).toBe(
            "fallback.jpg",
        );
    });

    it("defaults profilePicture to empty string when both are absent", () => {
        expect(mapMenteeProfile({}).profilePicture).toBe("");
    });

    it("defaults every remaining field when the raw object is otherwise empty", () => {
        expect(mapMenteeProfile({})).toEqual({
            id: null,
            profilePicture: "",
            bio: "",
            currentRole: "",
            company: "",
            industry: "",
            yearsOfExperience: "",
            skills: [],
            interestedFields: [],
            communicationPreferences: [],
            languages: [],
            linkedInUrl: "",
            portfolioUrl: "",
            emailNotifications: true,
            marketingPreferences: false,
            updatedAt: null,
        });
    });

    it("respects explicit false/true values for the boolean preference fields (not just absence)", () => {
        expect(mapMenteeProfile({ emailNotifications: false }).emailNotifications).toBe(false);
        expect(mapMenteeProfile({ marketingPreferences: true }).marketingPreferences).toBe(true);
    });
});