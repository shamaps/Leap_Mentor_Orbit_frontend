import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../mswServer";
import { File } from "node:buffer";
import { uploadNote, getNotes, getPrivateNotes, deleteNote } from "../../api/notes.api";

const BASE = "http://localhost:5000/api/v1";
const envelope = (data) => HttpResponse.json({ success: true, data });

const makeFile = (name = "notes.pdf") =>
    new File(["dummy content"], name, { type: "application/pdf" });
describe("notes.api", () => {
    it("uploadNote: sends file, connectRequestId, title as multipart form fields", async () => {
        let receivedForm, rawBody;
        server.use(
            http.post(`${BASE}/notes/upload`, async ({ request }) => {
                const clonedRequest = request.clone();
                rawBody = await clonedRequest.text();
                receivedForm = await request.formData();
                return envelope({ _id: "n1", title: "Session notes" });
            }),
        );
        const file = makeFile();
        const result = await uploadNote("cr1", file, "  Session notes  ", false);

        expect(receivedForm.get("connectRequestId")).toBe("cr1");
        expect(receivedForm.get("title")).toBe("Session notes");
        expect(receivedForm.get("isPrivate")).toBeNull();
        expect(rawBody).toContain('name="file"');
        expect(result).toEqual({ _id: "n1", title: "Session notes" });
    });
    it("uploadNote: omits title field when title is blank", async () => {
        let receivedForm;
        server.use(
            http.post(`${BASE}/notes/upload`, async ({ request }) => {
                receivedForm = await request.formData();
                return envelope({ _id: "n2" });
            }),
        );
        await uploadNote("cr1", makeFile(), "   ", false);
        expect(receivedForm.get("title")).toBeNull();
    });

    it("uploadNote: appends isPrivate='true' when isPrivate is true", async () => {
        let receivedForm;
        server.use(
            http.post(`${BASE}/notes/upload`, async ({ request }) => {
                receivedForm = await request.formData();
                return envelope({ _id: "n3" });
            }),
        );
        await uploadNote("cr1", makeFile(), "", true);
        expect(receivedForm.get("isPrivate")).toBe("true");
    });

    it("getNotes: GETs /notes/:connectRequestId", async () => {
        server.use(
            http.get(`${BASE}/notes/cr1`, () => envelope([{ _id: "n1", title: "Shared note" }])),
        );
        const result = await getNotes("cr1");
        expect(result).toEqual([{ _id: "n1", title: "Shared note" }]);
    });

    it("getPrivateNotes: GETs /notes/:connectRequestId/private", async () => {
        server.use(
            http.get(`${BASE}/notes/cr1/private`, () => envelope([{ _id: "n2", title: "Private note" }])),
        );
        const result = await getPrivateNotes("cr1");
        expect(result).toEqual([{ _id: "n2", title: "Private note" }]);
    });

    it("deleteNote: DELETEs /notes/:noteId", async () => {
        let wasHit = false, receivedMethod;
        server.use(
            http.delete(`${BASE}/notes/n1`, ({ request }) => {
                wasHit = true;
                receivedMethod = request.method;
                return envelope({});
            }),
        );
        const result = await deleteNote("n1");
        expect(wasHit).toBe(true);
        expect(receivedMethod).toBe("DELETE");
        expect(result).toBeUndefined();
    });
});