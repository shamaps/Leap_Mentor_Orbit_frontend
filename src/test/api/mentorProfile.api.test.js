import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mswServer";
import { getMentorProfile, updateMentorProfile } from "../../features/mentor/model/mentorProfile.api";

const BASE = "http://localhost:5000/api/v1";
const envelope = (data) => HttpResponse.json({ success: true, data });

describe("mentorProfile.api", () => {
    it("getMentorProfile: GETs /mentor-profile/me and returns res.data", async () => {
        server.use(
            http.get(`${BASE}/mentor-profile/me`, () =>
                envelope({ _id: "m1", name: "Ravi", expertise: ["React", "Node"] }),
            ),
        );
        const result = await getMentorProfile();
        expect(result).toEqual({ _id: "m1", name: "Ravi", expertise: ["React", "Node"] });
    });

    it("updateMentorProfile: PATCHes the exact payload to /mentor-profile/me", async () => {
        let receivedBody, receivedMethod;
        server.use(
            http.patch(`${BASE}/mentor-profile/me`, async ({ request }) => {
                receivedMethod = request.method;
                receivedBody = await request.json();
                return envelope({ _id: "m1", bio: "Updated bio" });
            }),
        );
        const payload = { bio: "Updated bio", expertise: ["React", "System Design"] };
        const result = await updateMentorProfile(payload);
        expect(receivedMethod).toBe("PATCH");
        expect(receivedBody).toEqual(payload);
        expect(result).toEqual({ _id: "m1", bio: "Updated bio" });
    });

    it("updateMentorProfile: propagates errors when the request fails", async () => {
        server.use(
            http.patch(`${BASE}/mentor-profile/me`, () =>
                HttpResponse.json({ success: false, message: "Validation failed" }, { status: 400 }),
            ),
        );
        await expect(updateMentorProfile({ bio: "" })).rejects.toBeTruthy();
    });
});