import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mswServer";
import {
    getMyRequests, getOngoingConnects, sendConnectRequest,
    respondToRequest, referRequest, getSimilarMentors,
} from "../../features/connects/model/connectRequests.api";

const BASE = "http://localhost:5000/api/v1";
const envelope = (data) => HttpResponse.json({ success: true, data });

const rawRequest = {
    _id: "cr1",
    status: "pending",
    selectedSlots: [{ start: "2026-08-01T10:00:00Z" }],
    confirmedSlot: null,
    referredTo: null,
    referredToProfile: null,
    referredBy: null,
    referredByProfile: null,
};

describe("connectRequests.api", () => {
    it("getMyRequests: GETs /connect-requests/my-requests and maps the list", async () => {
        server.use(
            http.get(`${BASE}/connect-requests/my-requests`, () =>
                envelope({ requests: [rawRequest] }),
            ),
        );
        const result = await getMyRequests();
        expect(result.requests).toHaveLength(1);
        expect(result.requests[0]).toMatchObject({
            _id: "cr1",
            displaySlot: { start: "2026-08-01T10:00:00Z" },
            referredMentor: null,
            referredByMentor: null,
        });
    });

    it("getOngoingConnects: GETs /connect-requests/ongoing and maps the list", async () => {
        server.use(
            http.get(`${BASE}/connect-requests/ongoing`, () =>
                envelope({ connects: [{ ...rawRequest, _id: "cr2", status: "accepted", confirmedSlot: { start: "2026-08-02T10:00:00Z" } }] }),
            ),
        );
        const result = await getOngoingConnects();
        expect(result.connects).toHaveLength(1);
        expect(result.connects[0]).toMatchObject({
            _id: "cr2",
            displaySlot: { start: "2026-08-02T10:00:00Z" },
        });
    });

    it("sendConnectRequest: POSTs the exact payload to /connect-requests", async () => {
        let receivedBody;
        server.use(
            http.post(`${BASE}/connect-requests`, async ({ request }) => {
                receivedBody = await request.json();
                return envelope({});
            }),
        );
        const payload = {
            mentorId: "m1",
            message: "Hi, I'd like to connect",
            selectedSlots: [{ start: "2026-08-01T10:00:00Z" }],
            sessionRate: 500,
            sessionCount: 4,
        };
        const result = await sendConnectRequest(payload);
        expect(receivedBody).toEqual(payload);
        expect(result).toBeUndefined();
    });

    it("respondToRequest: PATCHes { status, confirmedSlot } to /connect-requests/:id", async () => {
        let receivedBody, receivedMethod;
        server.use(
            http.patch(`${BASE}/connect-requests/cr1`, async ({ request }) => {
                receivedMethod = request.method;
                receivedBody = await request.json();
                return envelope({});
            }),
        );
        await respondToRequest("cr1", { status: "accepted", confirmedSlot: { start: "2026-08-01T10:00:00Z" } });
        expect(receivedMethod).toBe("PATCH");
        expect(receivedBody).toEqual({ status: "accepted", confirmedSlot: { start: "2026-08-01T10:00:00Z" } });
    });

    it("referRequest: PATCHes { referToMentorId } to /connect-requests/:id/refer", async () => {
        let receivedBody;
        server.use(
            http.patch(`${BASE}/connect-requests/cr1/refer`, async ({ request }) => {
                receivedBody = await request.json();
                return envelope({});
            }),
        );
        await referRequest("cr1", "m2");
        expect(receivedBody).toEqual({ referToMentorId: "m2" });
    });

    it("getSimilarMentors: GETs /connect-requests/:id/similar-mentors and returns res.data", async () => {
        server.use(
            http.get(`${BASE}/connect-requests/cr1/similar-mentors`, () =>
                envelope({ mentors: [{ _id: "m3", name: "Ravi" }] }),
            ),
        );
        const result = await getSimilarMentors("cr1");
        expect(result).toEqual({ mentors: [{ _id: "m3", name: "Ravi" }] });
    });
});