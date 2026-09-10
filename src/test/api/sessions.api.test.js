import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mswServer";
import {
    getSlots, setSlotMeetingLink, markSlotComplete, addSlot,
    cancelSlot, rescheduleSlot, lockSlot, unlockSlot, unlockAllSlots,
} from "../../features/shared-dashboard/model/sessions.api";

const BASE = "http://localhost:5000/api/v1";
const envelope = (data) => HttpResponse.json({ success: true, data });

describe("sessions.api", () => {
    it("getSlots: GETs /sessions/:connectRequestId/slots", async () => {
        server.use(
            http.get(`${BASE}/sessions/cr1/slots`, () => envelope([{ slotIndex: 0, status: "scheduled" }])),
        );
        const result = await getSlots("cr1");
        expect(result).toEqual([{ slotIndex: 0, status: "scheduled" }]);
    });

    it("setSlotMeetingLink: PATCHes { meetingLink } to /sessions/:id/slots/:idx/meeting-link", async () => {
        let receivedBody, receivedMethod;
        server.use(
            http.patch(`${BASE}/sessions/cr1/slots/0/meeting-link`, async ({ request }) => {
                receivedMethod = request.method;
                receivedBody = await request.json();
                return envelope({ slotIndex: 0, meetingLink: "https://meet.example.com/xyz" });
            }),
        );
        const result = await setSlotMeetingLink("cr1", 0, "https://meet.example.com/xyz");
        expect(receivedMethod).toBe("PATCH");
        expect(receivedBody).toEqual({ meetingLink: "https://meet.example.com/xyz" });
        expect(result).toEqual({ slotIndex: 0, meetingLink: "https://meet.example.com/xyz" });
    });

    it("markSlotComplete: PATCHes { action: 'complete' } to /sessions/:id/slots/:idx/status", async () => {
        let receivedBody;
        server.use(
            http.patch(`${BASE}/sessions/cr1/slots/0/status`, async ({ request }) => {
                receivedBody = await request.json();
                return envelope({ slotIndex: 0, status: "completed" });
            }),
        );
        const result = await markSlotComplete("cr1", 0);
        expect(receivedBody).toEqual({ action: "complete" });
        expect(result).toEqual({ slotIndex: 0, status: "completed" });
    });

    it("addSlot: POSTs { day, date, startTime, endTime } to /sessions/:id/slots", async () => {
        let receivedBody;
        server.use(
            http.post(`${BASE}/sessions/cr1/slots`, async ({ request }) => {
                receivedBody = await request.json();
                return envelope({ slotIndex: 1 });
            }),
        );
        const payload = { day: "Monday", date: "2026-08-03", startTime: "10:00", endTime: "11:00" };
        const result = await addSlot("cr1", payload);
        expect(receivedBody).toEqual(payload);
        expect(result).toEqual({ slotIndex: 1 });
    });

    it("cancelSlot: PATCHes { action: 'cancel', reason } to /sessions/:id/slots/:idx/status", async () => {
        let receivedBody;
        server.use(
            http.patch(`${BASE}/sessions/cr1/slots/0/status`, async ({ request }) => {
                receivedBody = await request.json();
                return envelope({ slotIndex: 0, status: "cancelled" });
            }),
        );
        const result = await cancelSlot("cr1", 0, "Schedule conflict");
        expect(receivedBody).toEqual({ action: "cancel", reason: "Schedule conflict" });
        expect(result).toEqual({ slotIndex: 0, status: "cancelled" });
    });

    it("cancelSlot: defaults reason to empty string when omitted", async () => {
        let receivedBody;
        server.use(
            http.patch(`${BASE}/sessions/cr1/slots/0/status`, async ({ request }) => {
                receivedBody = await request.json();
                return envelope({});
            }),
        );
        await cancelSlot("cr1", 0);
        expect(receivedBody).toEqual({ action: "cancel", reason: "" });
    });

    it("rescheduleSlot: PATCHes { action: 'reschedule', date, startTime, endTime }", async () => {
        let receivedBody;
        server.use(
            http.patch(`${BASE}/sessions/cr1/slots/0/status`, async ({ request }) => {
                receivedBody = await request.json();
                return envelope({ slotIndex: 0, status: "rescheduled" });
            }),
        );
        const result = await rescheduleSlot("cr1", 0, { date: "2026-08-05", startTime: "14:00", endTime: "15:00" });
        expect(receivedBody).toEqual({
            action: "reschedule", date: "2026-08-05", startTime: "14:00", endTime: "15:00",
        });
        expect(result).toEqual({ slotIndex: 0, status: "rescheduled" });
    });

    it("lockSlot: POSTs { mentorId, date, startTime, endTime } to /slot-locks/lock", async () => {
        let receivedBody;
        server.use(
            http.post(`${BASE}/slot-locks/lock`, async ({ request }) => {
                receivedBody = await request.json();
                return envelope({ lockId: "lk1" });
            }),
        );
        const payload = { mentorId: "m1", date: "2026-08-05", startTime: "14:00", endTime: "15:00" };
        const result = await lockSlot(payload);
        expect(receivedBody).toEqual(payload);
        expect(result).toEqual({ lockId: "lk1" });
    });

    it("unlockSlot: DELETEs /slot-locks/lock with a JSON body", async () => {
        let receivedBody, receivedMethod;
        server.use(
            http.delete(`${BASE}/slot-locks/lock`, async ({ request }) => {
                receivedMethod = request.method;
                receivedBody = await request.json();
                return envelope({});
            }),
        );
        const payload = { mentorId: "m1", date: "2026-08-05", startTime: "14:00", endTime: "15:00" };
        const result = await unlockSlot(payload);
        expect(receivedMethod).toBe("DELETE");
        expect(receivedBody).toEqual(payload);
        expect(result).toBeUndefined();
    });

    it("unlockAllSlots: DELETEs /slot-locks/locks with { mentorId } body", async () => {
        let receivedBody;
        server.use(
            http.delete(`${BASE}/slot-locks/locks`, async ({ request }) => {
                receivedBody = await request.json();
                return envelope({});
            }),
        );
        const result = await unlockAllSlots("m1");
        expect(receivedBody).toEqual({ mentorId: "m1" });
        expect(result).toBeUndefined();
    });
});