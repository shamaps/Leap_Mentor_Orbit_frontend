// src/test/api/mentorSearch.api.test.js
import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mswServer";
import { searchMentors } from "../../api/mentorSearch.api";

const BASE = "http://localhost:5000/api/v1";
const envelope = (data) => HttpResponse.json({ success: true, data });

describe("mentorSearch.api", () => {
    it("searchMentors: GETs /mentors/search with params serialized as query string", async () => {
        let capturedUrl;
        server.use(
            http.get(`${BASE}/mentors/search`, ({ request }) => {
                capturedUrl = new URL(request.url);
                return envelope({
                    mentors: [
                        {
                            _id: "m1",
                            user: { _id: "u1", name: "Ravi Kumar" },
                            currentRole: "SDE",
                            company: "Acme",
                            industry: "Tech",
                            skills: ["React", "Node"],
                            hourlyRate: 500,
                            avgRating: 4.5,
                            yearsOfExperience: 5,
                            verificationStatus: "verified",
                            profilePicture56: "pic56.jpg",
                        },
                    ],
                    pagination: { page: 1, totalPages: 3 },
                    mySkills: ["React"],
                });
            }),
        );

        const result = await searchMentors({ skill: "React", page: 1 });

        // 1. Call shape: params become query string, not a body
        expect(capturedUrl.searchParams.get("skill")).toBe("React");
        expect(capturedUrl.searchParams.get("page")).toBe("1");

        // 2. Return shape: mapMentorSearchResponse output
        expect(result).toEqual({
            mentors: [
                {
                    id: "m1",
                    userId: "u1",
                    name: "Ravi Kumar",
                    currentRole: "SDE",
                    company: "Acme",
                    industry: "Tech",
                    skills: ["React", "Node"],
                    hourlyRate: 500,
                    avgRating: 4.5,
                    yearsOfExperience: 5,
                    verificationStatus: "verified",
                    profilePicture: "pic56.jpg",
                },
            ],
            pagination: { page: 1, totalPages: 3 },
            mySkills: ["React"],
        });
    });

    it("searchMentors: defaults mentors/pagination/mySkills when the backend omits them", async () => {
        server.use(http.get(`${BASE}/mentors/search`, () => envelope({})));

        const result = await searchMentors({});

        expect(result).toEqual({ mentors: [], pagination: null, mySkills: [] });
    });

    it("searchMentors: works with no params at all", async () => {
        let wasHit = false;
        server.use(
            http.get(`${BASE}/mentors/search`, () => {
                wasHit = true;
                return envelope({ mentors: [], pagination: null, mySkills: [] });
            }),
        );

        await searchMentors();
        expect(wasHit).toBe(true);
    });
});