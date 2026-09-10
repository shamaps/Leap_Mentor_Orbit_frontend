import { describe, it, expect } from "vitest";
import {
    mapMentorCard,
    mapMentorSearchResponse,
    mapMentorFullProfile,
} from "../../features/mentor/model/mentorMapper";

describe("mapMentorCard", () => {
    it("returns null when given a falsy value", () => {
        expect(mapMentorCard(null)).toBeNull();
        expect(mapMentorCard(undefined)).toBeNull();
    });

    it("maps a fully populated flat mentor object", () => {
        const raw = {
            _id: "mt1",
            name: "Alice",
            email: "alice@example.com",
            currentRole: "Engineer",
            company: "Acme",
            industry: "Tech",
            skills: ["React"],
            hourlyRate: 50,
            avgRating: 4.5,
            yearsOfExperience: 5,
            verificationStatus: "verified",
            profilePicture56: "pic56.jpg",
            profilePicture: "pic.jpg",
        };
        expect(mapMentorCard(raw)).toEqual({
            id: "mt1",
            userId: "mt1", // pickUserId falls through to raw._id since no user/userId present
            name: "Alice",
            currentRole: "Engineer",
            company: "Acme",
            industry: "Tech",
            skills: ["React"],
            hourlyRate: 50,
            avgRating: 4.5,
            yearsOfExperience: 5,
            verificationStatus: "verified",
            profilePicture: "pic56.jpg",
        });
    });

    it("falls back to id when _id is missing", () => {
        expect(mapMentorCard({ id: "mt2" }).id).toBe("mt2");
    });

    it("pulls name/email from nested user object when present", () => {
        const raw = { _id: "mt3", user: { _id: "u3", name: "Nested Name", email: "nested@x.com" } };
        expect(mapMentorCard(raw).name).toBe("Nested Name");
        expect(mapMentorFullProfile(raw).email).toBe("nested@x.com");
    });

    it("falls back to flat name/email when user is absent", () => {
        const raw = { _id: "mt4", name: "Flat Name", email: "flat@x.com" };
        expect(mapMentorCard(raw).name).toBe("Flat Name");
        expect(mapMentorFullProfile(raw).email).toBe("flat@x.com");
    });

    it("defaults name and email to empty string when neither user nor flat fields exist", () => {
        expect(mapMentorCard({ _id: "mt5" }).name).toBe("");
        expect(mapMentorFullProfile({ _id: "mt5" }).email).toBe("");
    });

    it("pickUserId prefers user._id, then userId, then raw._id, then null", () => {
        expect(mapMentorCard({ _id: "a", user: { _id: "u-a" } }).userId).toBe("u-a");
        expect(mapMentorCard({ _id: "b", userId: "uid-b" }).userId).toBe("uid-b");
        expect(mapMentorCard({ _id: "c" }).userId).toBe("c");
        expect(mapMentorCard({}).userId).toBeNull();
    });

    it("defaults all remaining fields when raw is otherwise empty", () => {
        expect(mapMentorCard({})).toEqual({
            id: undefined,
            userId: null,
            name: "",
            currentRole: "",
            company: "",
            industry: "",
            skills: [],
            hourlyRate: 0,
            avgRating: 0,
            yearsOfExperience: 0,
            verificationStatus: "unverified",
            profilePicture: "",
        });
    });

    it("falls back to profilePicture when profilePicture56 is absent", () => {
        expect(mapMentorCard({ profilePicture: "fallback56.jpg" }).profilePicture).toBe(
            "fallback56.jpg",
        );
    });
});

describe("mapMentorSearchResponse", () => {
    it("maps a full search response", () => {
        const raw = {
            mentors: [{ _id: "mt1", name: "Alice" }],
            pagination: { page: 1, total: 10 },
            mySkills: ["React"],
        };
        const result = mapMentorSearchResponse(raw);
        expect(result.mentors).toEqual([mapMentorCard(raw.mentors[0])]);
        expect(result.pagination).toEqual({ page: 1, total: 10 });
        expect(result.mySkills).toEqual(["React"]);
    });

    it("defaults mentors to an empty array when absent", () => {
        expect(mapMentorSearchResponse({}).mentors).toEqual([]);
    });

    it("defaults pagination to null when absent", () => {
        expect(mapMentorSearchResponse({}).pagination).toBeNull();
    });

    it("defaults mySkills to an empty array when absent", () => {
        expect(mapMentorSearchResponse({}).mySkills).toEqual([]);
    });
});

describe("mapMentorFullProfile", () => {
    it("returns null when given a falsy value", () => {
        expect(mapMentorFullProfile(null)).toBeNull();
        expect(mapMentorFullProfile(undefined)).toBeNull();
    });

    it("spreads mapMentorCard fields and adds full-profile-only fields", () => {
        const raw = {
            _id: "mt1",
            name: "Alice",
            bio: "Experienced mentor",
            reviewCount: 12,
            totalSessions: 30,
            location: "Bengaluru",
            profilePicture80: "pic80.jpg",
        };
        expect(mapMentorFullProfile(raw)).toEqual({
            ...mapMentorCard(raw),
            email: "",
            bio: "Experienced mentor",
            reviewCount: 12,
            totalSessions: 30,
            location: "Bengaluru",
            profilePicture: "pic80.jpg",
        });
    });

    it("falls back to profilePicture when profilePicture80 is absent", () => {
        expect(mapMentorFullProfile({ profilePicture: "fallback80.jpg" }).profilePicture).toBe(
            "fallback80.jpg",
        );
    });

    it("defaults bio, reviewCount, totalSessions, and location when absent", () => {
        const result = mapMentorFullProfile({});
        expect(result.bio).toBe("");
        expect(result.reviewCount).toBe(0);
        expect(result.totalSessions).toBe(0);
        expect(result.location).toBe("");
    });
});