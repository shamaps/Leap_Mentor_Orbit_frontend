import { describe, it, expect, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mswServer";
import {
    getGoal, createGoal, updateGoal, addMilestone, toggleMilestone, deleteMilestone,
} from "../../features/shared-dashboard/model/goals.api";

const BASE = "http://localhost:5000/api/v1";
const envelope = (data) => HttpResponse.json({ success: true, data });

describe("goals.api", () => {
    afterEach(() => {
        delete globalThis.__leapSocket;
    });

    it("getGoal: GETs /goals/:connectRequestId", async () => {
        server.use(
            http.get(`${BASE}/goals/cr1`, () => envelope({ _id: "g1", title: "Learn React" })),
        );
        const result = await getGoal("cr1");
        expect(result).toEqual({ _id: "g1", title: "Learn React" });
    });

    it("createGoal: POSTs the exact payload to /goals", async () => {
        let receivedBody;
        server.use(
            http.post(`${BASE}/goals`, async ({ request }) => {
                receivedBody = await request.json();
                return envelope({ _id: "g1" });
            }),
        );
        const payload = {
            connectRequestId: "cr1",
            title: "Learn React",
            description: "Master hooks and state",
            startDate: "2026-08-01",
            endDate: "2026-09-01",
        };
        const result = await createGoal(payload);
        expect(receivedBody).toEqual(payload);
        expect(result).toEqual({ _id: "g1" });
    });

    it("updateGoal: PATCHes the given fields to /goals/:goalId", async () => {
        let receivedBody, receivedMethod;
        server.use(
            http.patch(`${BASE}/goals/g1`, async ({ request }) => {
                receivedMethod = request.method;
                receivedBody = await request.json();
                return envelope({ _id: "g1", title: "Updated title" });
            }),
        );
        const result = await updateGoal("g1", { title: "Updated title" });
        expect(receivedMethod).toBe("PATCH");
        expect(receivedBody).toEqual({ title: "Updated title" });
        expect(result).toEqual({ _id: "g1", title: "Updated title" });
    });

    it("addMilestone: POSTs { title, dueDate } to /goals/:goalId/milestones", async () => {
        let receivedBody;
        server.use(
            http.post(`${BASE}/goals/g1/milestones`, async ({ request }) => {
                receivedBody = await request.json();
                return envelope({ _id: "m1", title: "Finish chapter 1" });
            }),
        );
        const result = await addMilestone("g1", { title: "Finish chapter 1", dueDate: "2026-08-10" });
        expect(receivedBody).toEqual({ title: "Finish chapter 1", dueDate: "2026-08-10" });
        expect(result).toEqual({ _id: "m1", title: "Finish chapter 1" });
    });

    it("toggleMilestone: PATCHes { isCompleted, socketId } when a socket is connected", async () => {
        globalThis.__leapSocket = { id: "socket-123" };
        let receivedBody;
        server.use(
            http.patch(`${BASE}/goals/milestones/m1`, async ({ request }) => {
                receivedBody = await request.json();
                return envelope({ _id: "m1", isCompleted: true });
            }),
        );
        const result = await toggleMilestone("m1", true);
        expect(receivedBody).toEqual({ isCompleted: true, socketId: "socket-123" });
        expect(result).toEqual({ _id: "m1", isCompleted: true });
    });

    it("toggleMilestone: sends socketId undefined when no socket is connected", async () => {
        let receivedBody;
        server.use(
            http.patch(`${BASE}/goals/milestones/m1`, async ({ request }) => {
                receivedBody = await request.json();
                return envelope({ _id: "m1", isCompleted: false });
            }),
        );
        await toggleMilestone("m1", false);
        expect(receivedBody).toEqual({ isCompleted: false });
    });

    it("deleteMilestone: DELETEs /goals/milestones/:milestoneId", async () => {
        let wasHit = false, receivedMethod;
        server.use(
            http.delete(`${BASE}/goals/milestones/m1`, ({ request }) => {
                wasHit = true;
                receivedMethod = request.method;
                return envelope({});
            }),
        );
        const result = await deleteMilestone("m1");
        expect(wasHit).toBe(true);
        expect(receivedMethod).toBe("DELETE");
        expect(result).toBeUndefined();
    });
});