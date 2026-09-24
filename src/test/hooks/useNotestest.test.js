// src/test/hooks/useNotes.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useNotes from "../../features/shared-dashboard/presenter/useNotes";
import {
    getNotes,
    uploadNote,
    deleteNote,
    getPrivateNotes,
} from "../../features/shared-dashboard/model/notes.api";
import logger from "../../shared/utils/logger";

vi.mock("../../features/shared-dashboard/model/notes.api", () => ({
    getNotes: vi.fn(),
    uploadNote: vi.fn(),
    deleteNote: vi.fn(),
    getPrivateNotes: vi.fn(),
}));
vi.mock("../../shared/utils/logger", () => ({
    default: { warn: vi.fn(), error: vi.fn() },
}));

const CR_ID = "cr1";

const flush = async () => {
    await act(async () => {
        await Promise.resolve();
    });
};

describe("useNotes", () => {
    beforeEach(() => {
        getNotes.mockReset();
        uploadNote.mockReset();
        deleteNote.mockReset();
        getPrivateNotes.mockReset();
        logger.warn.mockReset();

        getNotes.mockResolvedValue({ notes: [{ _id: "n1" }] });
        getPrivateNotes.mockResolvedValue({ notes: [{ _id: "pn1" }] });
    });

    it("does nothing and stays loading=true when connectRequestId is falsy", async () => {
        const { result } = renderHook(() => useNotes(null));
        await flush();

        expect(getNotes).not.toHaveBeenCalled();
        expect(getPrivateNotes).not.toHaveBeenCalled();
        expect(result.current.loading).toBe(true);
        expect(result.current.privateLoading).toBe(true);
        expect(result.current.notes).toEqual([]);
        expect(result.current.privateNotes).toEqual([]);
    });

    it("fetches both shared and private notes on mount", async () => {
        const { result } = renderHook(() => useNotes(CR_ID));
        await flush();

        expect(getNotes).toHaveBeenCalledWith(CR_ID);
        expect(getPrivateNotes).toHaveBeenCalledWith(CR_ID);
        expect(result.current.notes).toEqual([{ _id: "n1" }]);
        expect(result.current.privateNotes).toEqual([{ _id: "pn1" }]);
        expect(result.current.loading).toBe(false);
        expect(result.current.privateLoading).toBe(false);
    });

    it("defaults notes to [] when the server omits them", async () => {
        getNotes.mockResolvedValueOnce({});
        getPrivateNotes.mockResolvedValueOnce({});
        const { result } = renderHook(() => useNotes(CR_ID));
        await flush();

        expect(result.current.notes).toEqual([]);
        expect(result.current.privateNotes).toEqual([]);
    });

    it("sets a global error using the server message when the shared-notes fetch fails", async () => {
        getNotes.mockRejectedValueOnce({ response: { data: { message: "Not found" } } });
        const { result } = renderHook(() => useNotes(CR_ID));
        await flush();

        expect(result.current.error).toBe("Not found");
        expect(result.current.loading).toBe(false);
    });

    it("falls back to the generic load-error message when shared-notes fetch fails without a server message", async () => {
        getNotes.mockRejectedValueOnce(new Error("network down"));
        const { result } = renderHook(() => useNotes(CR_ID));
        await flush();

        expect(result.current.error).toBe("Failed to load notes.");
    });

    it("does NOT set the global error when private-notes fetch fails — only logs a warning", async () => {
        getPrivateNotes.mockRejectedValueOnce({ response: { data: { message: "Forbidden" } } });
        const { result } = renderHook(() => useNotes(CR_ID));
        await flush();

        expect(result.current.error).toBeNull();
        expect(result.current.privateLoading).toBe(false);
        expect(logger.warn).toHaveBeenCalledWith("Private notes fetch failed", {
            message: "Forbidden",
        });
    });

    it("logs a warning with message=undefined when the private-notes error has no response body", async () => {
        getPrivateNotes.mockRejectedValueOnce(new Error("boom"));
        renderHook(() => useNotes(CR_ID));
        await flush();

        expect(logger.warn).toHaveBeenCalledWith("Private notes fetch failed", {
            message: undefined,
        });
    });

    it("re-fetches when connectRequestId changes", async () => {
        const { rerender } = renderHook(({ id }) => useNotes(id), {
            initialProps: { id: CR_ID },
        });
        await flush();
        expect(getNotes).toHaveBeenCalledWith(CR_ID);

        rerender({ id: "cr2" });
        await flush();
        expect(getNotes).toHaveBeenCalledWith("cr2");
    });

    it("uploadNote: does nothing and returns undefined when file is missing", async () => {
        const { result } = renderHook(() => useNotes(CR_ID));
        await flush();

        let outcome;
        await act(async () => {
            outcome = await result.current.uploadNote(null, "title");
        });

        expect(outcome).toBeUndefined();
        expect(uploadNote).not.toHaveBeenCalled();
    });

    it("uploadNote: does nothing when connectRequestId is falsy", async () => {
        const { result } = renderHook(() => useNotes(null));
        await flush();
        const file = new File(["x"], "x.pdf");

        let outcome;
        await act(async () => {
            outcome = await result.current.uploadNote(file);
        });

        expect(outcome).toBeUndefined();
        expect(uploadNote).not.toHaveBeenCalled();
    });

    it("uploadNote: shared note is prepended to notes on success", async () => {
        uploadNote.mockResolvedValueOnce({ note: { _id: "new1" } });
        const { result } = renderHook(() => useNotes(CR_ID));
        await flush();
        const file = new File(["x"], "x.pdf");

        let outcome;
        await act(async () => {
            outcome = await result.current.uploadNote(file, "My Title", false);
        });

        expect(uploadNote).toHaveBeenCalledWith(CR_ID, file, "My Title", false);
        expect(outcome).toEqual({ success: true });
        expect(result.current.notes).toEqual([{ _id: "new1" }, { _id: "n1" }]);
        expect(result.current.privateNotes).toEqual([{ _id: "pn1" }]); // untouched
        expect(result.current.uploading).toBe(false);
    });

    it("uploadNote: private note is prepended to privateNotes on success", async () => {
        uploadNote.mockResolvedValueOnce({ note: { _id: "newp1" } });
        const { result } = renderHook(() => useNotes(CR_ID));
        await flush();
        const file = new File(["x"], "x.pdf");

        await act(async () => {
            await result.current.uploadNote(file, "", true);
        });

        expect(result.current.privateNotes).toEqual([{ _id: "newp1" }, { _id: "pn1" }]);
        expect(result.current.notes).toEqual([{ _id: "n1" }]); // untouched
    });

    it("uploadNote: sets error and returns failure message on rejection", async () => {
        uploadNote.mockRejectedValueOnce({ response: { data: { message: "File too large" } } });
        const { result } = renderHook(() => useNotes(CR_ID));
        await flush();
        const file = new File(["x"], "x.pdf");

        let outcome;
        await act(async () => {
            outcome = await result.current.uploadNote(file);
        });

        expect(outcome).toEqual({ success: false, message: "File too large" });
        expect(result.current.error).toBe("File too large");
        expect(result.current.uploading).toBe(false);
    });

    it("uploadNote: falls back to the generic upload-error message", async () => {
        uploadNote.mockRejectedValueOnce(new Error("boom"));
        const { result } = renderHook(() => useNotes(CR_ID));
        await flush();
        const file = new File(["x"], "x.pdf");

        let outcome;
        await act(async () => {
            outcome = await result.current.uploadNote(file);
        });

        expect(outcome.message).toBe("Upload failed. Please try again.");
        expect(result.current.error).toBe("Upload failed. Please try again.");
    });

    it("deleteNote: removes the note from the shared list on success", async () => {
        deleteNote.mockResolvedValueOnce(undefined);
        const { result } = renderHook(() => useNotes(CR_ID));
        await flush();

        let outcome;
        await act(async () => {
            outcome = await result.current.deleteNote("n1", false);
        });

        expect(deleteNote).toHaveBeenCalledWith("n1");
        expect(outcome).toEqual({ success: true });
        expect(result.current.notes).toEqual([]);
        expect(result.current.privateNotes).toEqual([{ _id: "pn1" }]); // untouched
    });

    it("deleteNote: removes the note from the private list on success", async () => {
        deleteNote.mockResolvedValueOnce(undefined);
        const { result } = renderHook(() => useNotes(CR_ID));
        await flush();

        await act(async () => {
            await result.current.deleteNote("pn1", true);
        });

        expect(result.current.privateNotes).toEqual([]);
        expect(result.current.notes).toEqual([{ _id: "n1" }]); // untouched
    });

    it("deleteNote: sets error and returns failure message on rejection", async () => {
        deleteNote.mockRejectedValueOnce({ response: { data: { message: "Not your note" } } });
        const { result } = renderHook(() => useNotes(CR_ID));
        await flush();

        let outcome;
        await act(async () => {
            outcome = await result.current.deleteNote("n1");
        });

        expect(outcome).toEqual({ success: false, message: "Not your note" });
        expect(result.current.error).toBe("Not your note");
    });

    it("deleteNote: falls back to the generic delete-error message", async () => {
        deleteNote.mockRejectedValueOnce(new Error("boom"));
        const { result } = renderHook(() => useNotes(CR_ID));
        await flush();

        let outcome;
        await act(async () => {
            outcome = await result.current.deleteNote("n1");
        });

        expect(outcome.message).toBe("Delete failed. Please try again.");
    });

    it("refetch and refetchPrivate are exposed and trigger fresh fetches", async () => {
        const { result } = renderHook(() => useNotes(CR_ID));
        await flush();
        getNotes.mockClear();
        getPrivateNotes.mockClear();

        await act(async () => {
            await result.current.refetch();
        });
        expect(getNotes).toHaveBeenCalledWith(CR_ID);

        await act(async () => {
            await result.current.refetchPrivate();
        });
        expect(getPrivateNotes).toHaveBeenCalledWith(CR_ID);
    });
});