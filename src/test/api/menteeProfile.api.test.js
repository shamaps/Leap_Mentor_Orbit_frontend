import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mswServer";
import { getMenteeProfile, updateMenteeProfile } from "../../features/mentee/model/menteeProfile.api";

const BASE = "http://localhost:5000/api/v1";
const envelope = (data) => HttpResponse.json({ success: true, data });

describe("menteeProfile.api", () => {
    it("getMenteeProfile: GETs /mentee-profile/me and maps the response with defaults", async () => {
        server.use(
            http.get(`${BASE}/mentee-profile/me`, () =>
                envelope({
                    _id: "u1",
                    profilePicture160: "pic.jpg",
                    bio: "Aspiring engineer",
                    currentRole: "Student",
                }),
            ),
        );
        const result = await getMenteeProfile();
        expect(result).toEqual({
            id: "u1",
            profilePicture: "pic.jpg",
            bio: "Aspiring engineer",
            currentRole: "Student",
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

    it("getMenteeProfile: forwards the abort signal to axios", async () => {
        const controller = new AbortController();
        let receivedSignal;
        server.use(
            http.get(`${BASE}/mentee-profile/me`, ({ request }) => {
                receivedSignal = request.signal;
                return envelope({ _id: "u1" });
            }),
        );
        await getMenteeProfile(controller.signal);
        expect(receivedSignal).toBeDefined();
        expect(receivedSignal.aborted).toBe(false);
    });

    it("getMenteeProfile: returns null when the response is empty", async () => {
        server.use(
            http.get(`${BASE}/mentee-profile/me`, () => envelope(null)),
        );
        const result = await getMenteeProfile();
        expect(result).toBeNull();
    });

    it("updateMenteeProfile: PATCHes the exact payload to /mentee-profile/me", async () => {
        let receivedBody, receivedMethod;
        server.use(
            http.patch(`${BASE}/mentee-profile/me`, async ({ request }) => {
                receivedMethod = request.method;
                receivedBody = await request.json();
                return envelope({ _id: "u1", bio: "Updated bio" });
            }),
        );
        const payload = { bio: "Updated bio", skills: ["JS", "React"] };
        const result = await updateMenteeProfile(payload);
        expect(receivedMethod).toBe("PATCH");
        expect(receivedBody).toEqual(payload);
        expect(result).toEqual({ _id: "u1", bio: "Updated bio" });
    });
});