import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mswServer";
import {
    getMyAvailability, saveMyAvailability, getMentorAvailabilityForReschedule,
    getGoogleCalendarAuthUrl, getGoogleCalendarStatus, disconnectGoogleCalendar,
    getGoogleCalendarBusySlots, getGoogleCalendarEvents,
} from "../../api/availability.api";

const BASE = "http://localhost:5000/api/v1";
const envelope = (data) => HttpResponse.json({ success: true, data });

describe("availability.api", () => {
    it("getMyAvailability: GETs /availability/me and returns res.data", async () => {
        server.use(
            http.get(`${BASE}/availability/me`, () =>
                envelope({ timezone: "Asia/Kolkata", sessionDurations: [30, 60], specificDates: [] }),
            ),
        );
        const result = await getMyAvailability();
        expect(result).toEqual({ timezone: "Asia/Kolkata", sessionDurations: [30, 60], specificDates: [] });
    });

    it("saveMyAvailability: PATCHes the exact payload to /availability/me", async () => {
        let receivedBody, receivedMethod;
        server.use(
            http.patch(`${BASE}/availability/me`, async ({ request }) => {
                receivedMethod = request.method;
                receivedBody = await request.json();
                return envelope({});
            }),
        );
        const result = await saveMyAvailability({
            timezone: "Asia/Kolkata",
            sessionDurations: [30, 60],
            specificDates: ["2026-08-01"],
        });
        expect(receivedMethod).toBe("PATCH");
        expect(receivedBody).toEqual({
            timezone: "Asia/Kolkata",
            sessionDurations: [30, 60],
            specificDates: ["2026-08-01"],
        });
        expect(result).toBeUndefined();
    });

    it("getMentorAvailabilityForReschedule: GETs /sessions/:id/mentor-availability with duration param", async () => {
        let capturedUrl;
        server.use(
            http.get(`${BASE}/sessions/:id/mentor-availability`, ({ request, params }) => {
                capturedUrl = request.url;
                expect(params.id).toBe("cr123");
                return envelope({ slots: [] });
            }),
        );
        const result = await getMentorAvailabilityForReschedule("cr123", 45);
        expect(capturedUrl).toContain("duration=45");
        expect(result).toEqual({ slots: [] });
    });

    it("getGoogleCalendarAuthUrl: GETs /google-calendar/auth-url", async () => {
        server.use(
            http.get(`${BASE}/google-calendar/auth-url`, () => envelope({ url: "https://accounts.google.com/xyz" })),
        );
        const result = await getGoogleCalendarAuthUrl();
        expect(result).toEqual({ url: "https://accounts.google.com/xyz" });
    });

    it("getGoogleCalendarStatus: GETs /google-calendar/status", async () => {
        server.use(
            http.get(`${BASE}/google-calendar/status`, () => envelope({ connected: true })),
        );
        const result = await getGoogleCalendarStatus();
        expect(result).toEqual({ connected: true });
    });

    it("disconnectGoogleCalendar: DELETEs /google-calendar/connection", async () => {
        let wasHit = false, receivedMethod;
        server.use(
            http.delete(`${BASE}/google-calendar/connection`, ({ request }) => {
                wasHit = true;
                receivedMethod = request.method;
                return envelope({});
            }),
        );
        const result = await disconnectGoogleCalendar();
        expect(wasHit).toBe(true);
        expect(receivedMethod).toBe("DELETE");
        expect(result).toBeUndefined();
    });

    it("getGoogleCalendarBusySlots: GETs /google-calendar/busy with query params", async () => {
        let capturedUrl;
        server.use(
            http.get(`${BASE}/google-calendar/busy`, ({ request }) => {
                capturedUrl = request.url;
                return envelope({ busy: [] });
            }),
        );
        const result = await getGoogleCalendarBusySlots({ from: "2026-08-01", to: "2026-08-07" });
        expect(capturedUrl).toContain("from=2026-08-01");
        expect(capturedUrl).toContain("to=2026-08-07");
        expect(result).toEqual({ busy: [] });
    });

    it("getGoogleCalendarEvents: GETs /google-calendar/events with query params", async () => {
        let capturedUrl;
        server.use(
            http.get(`${BASE}/google-calendar/events`, ({ request }) => {
                capturedUrl = request.url;
                return envelope({ events: [] });
            }),
        );
        const result = await getGoogleCalendarEvents({ from: "2026-08-01", to: "2026-08-07" });
        expect(capturedUrl).toContain("from=2026-08-01");
        expect(result).toEqual({ events: [] });
    });
});