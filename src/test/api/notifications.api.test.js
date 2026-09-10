import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mswServer";
import {
    getNotifications, markAllNotificationsRead, clearAllNotifications,
    markNotificationRead, deleteNotification, subscribeToPush,
} from "../../features/notifications/model/notifications.api";

const BASE = "http://localhost:5000/api/v1";
const envelope = (data) => HttpResponse.json({ success: true, data });

describe("notifications.api", () => {
    it("getNotifications: GETs /notifications and returns res.data", async () => {
        server.use(
            http.get(`${BASE}/notifications`, () =>
                envelope([{ _id: "n1", message: "New request", isRead: false }]),
            ),
        );
        const result = await getNotifications();
        expect(result).toEqual([{ _id: "n1", message: "New request", isRead: false }]);
    });

    it("markAllNotificationsRead: PATCHes empty body to /notifications/mark-all-read", async () => {
        let receivedBody, receivedMethod;
        server.use(
            http.patch(`${BASE}/notifications/mark-all-read`, async ({ request }) => {
                receivedMethod = request.method;
                receivedBody = await request.json();
                return envelope({});
            }),
        );
        const result = await markAllNotificationsRead();
        expect(receivedMethod).toBe("PATCH");
        expect(receivedBody).toEqual({});
        expect(result).toBeUndefined();
    });

    it("clearAllNotifications: DELETEs /notifications/clear-all", async () => {
        let wasHit = false, receivedMethod;
        server.use(
            http.delete(`${BASE}/notifications/clear-all`, ({ request }) => {
                wasHit = true;
                receivedMethod = request.method;
                return envelope({});
            }),
        );
        const result = await clearAllNotifications();
        expect(wasHit).toBe(true);
        expect(receivedMethod).toBe("DELETE");
        expect(result).toBeUndefined();
    });

    it("markNotificationRead: PATCHes empty body to /notifications/:id/read", async () => {
        let receivedBody, receivedMethod;
        server.use(
            http.patch(`${BASE}/notifications/n1/read`, async ({ request }) => {
                receivedMethod = request.method;
                receivedBody = await request.json();
                return envelope({});
            }),
        );
        const result = await markNotificationRead("n1");
        expect(receivedMethod).toBe("PATCH");
        expect(receivedBody).toEqual({});
        expect(result).toBeUndefined();
    });

    it("deleteNotification: DELETEs /notifications/:id", async () => {
        let wasHit = false, receivedMethod;
        server.use(
            http.delete(`${BASE}/notifications/n1`, ({ request }) => {
                wasHit = true;
                receivedMethod = request.method;
                return envelope({});
            }),
        );
        const result = await deleteNotification("n1");
        expect(wasHit).toBe(true);
        expect(receivedMethod).toBe("DELETE");
        expect(result).toBeUndefined();
    });

    it("subscribeToPush: POSTs { subscription } to /push/subscribe", async () => {
        let receivedBody;
        const subscription = { endpoint: "https://fcm.example.com/xyz", keys: { p256dh: "abc", auth: "def" } };
        server.use(
            http.post(`${BASE}/push/subscribe`, async ({ request }) => {
                receivedBody = await request.json();
                return envelope({});
            }),
        );
        const result = await subscribeToPush(subscription);
        expect(receivedBody).toEqual({ subscription });
        expect(result).toBeUndefined();
    });
});