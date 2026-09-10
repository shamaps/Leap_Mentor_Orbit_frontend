import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mswServer";
import {
    createPrivateNote, getPrivateNotes, updatePrivateNote, deletePrivateNote,
} from "../../features/shared-dashboard/model/privateNotes.api";

const BASE = "http://localhost:5000/api/v1";
const envelope = (data) => HttpResponse.json({ success: true, data });

describe("privateNotes.api", () => {
    it("createPrivateNote: POSTs { connectRequestId, title, content } to /private-notes", async () => {
        let receivedBody;
        server.use(
            http.post(`${BASE}/private-notes`, async ({ request }) => {
                receivedBody = await request.json();
                return envelope({ _id: "pn1" });
            }),
        );
        const result = await createPrivateNote("cr1", "My thoughts", "Session went well");
        expect(receivedBody).toEqual({
            connectRequestId: "cr1",
            title: "My thoughts",
            content: "Session went well",
        });
        expect(result).toEqual({ _id: "pn1" });
    });

    it("getPrivateNotes: GETs private-notes/:connectRequestId and resolves to the right URL", async () => {
        server.use(
            http.get(`${BASE}/private-notes/cr1`, () =>
                envelope([{ _id: "pn1", title: "My thoughts" }]),
            ),
        );
        const result = await getPrivateNotes("cr1");
        expect(result).toEqual([{ _id: "pn1", title: "My thoughts" }]);
    });

    it("updatePrivateNote: PATCHes { title, content } to /private-notes/:noteId", async () => {
        let receivedBody, receivedMethod;
        server.use(
            http.patch(`${BASE}/private-notes/pn1`, async ({ request }) => {
                receivedMethod = request.method;
                receivedBody = await request.json();
                return envelope({ _id: "pn1", title: "Updated" });
            }),
        );
        const result = await updatePrivateNote("pn1", "Updated", "New content");
        expect(receivedMethod).toBe("PATCH");
        expect(receivedBody).toEqual({ title: "Updated", content: "New content" });
        expect(result).toEqual({ _id: "pn1", title: "Updated" });
    });

    it("deletePrivateNote: DELETEs /private-notes/:noteId", async () => {
        let wasHit = false, receivedMethod;
        server.use(
            http.delete(`${BASE}/private-notes/pn1`, ({ request }) => {
                wasHit = true;
                receivedMethod = request.method;
                return envelope({});
            }),
        );
        const result = await deletePrivateNote("pn1");
        expect(wasHit).toBe(true);
        expect(receivedMethod).toBe("DELETE");
        expect(result).toBeUndefined();
    });
});