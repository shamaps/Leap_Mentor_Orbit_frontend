// src/test/hooks/usePrivateNotes.test.js
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import {
    createPrivateNote,
    getPrivateNotes,
    updatePrivateNote,
    deletePrivateNote,
} from "../../features/shared-dashboard/model/privateNotes.api";
import usePrivateNotes from "../../features/shared-dashboard/presenter/usePrivateNotes";

vi.mock("../../features/shared-dashboard/model/privateNotes.api");

describe("usePrivateNotes", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("fetchNotes (on mount)", () => {
        it("does not fetch when connectRequestId is falsy", () => {
            renderHook(() => usePrivateNotes(null));

            expect(getPrivateNotes).not.toHaveBeenCalled();
        });

        it("fetches notes and sets them on success", async () => {
            getPrivateNotes.mockResolvedValue({ notes: [{ _id: "n1", title: "Note 1" }] });

            const { result } = renderHook(() => usePrivateNotes("conn-1"));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(getPrivateNotes).toHaveBeenCalledWith("conn-1");
            expect(result.current.notes).toEqual([{ _id: "n1", title: "Note 1" }]);
        });

        it("defaults notes to an empty array when missing from the response", async () => {
            getPrivateNotes.mockResolvedValue({});

            const { result } = renderHook(() => usePrivateNotes("conn-2"));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.notes).toEqual([]);
        });

        it("sets an error message on failure", async () => {
            getPrivateNotes.mockRejectedValue({
                response: { data: { message: "Notes unavailable" } },
            });

            const { result } = renderHook(() => usePrivateNotes("conn-3"));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.error).toBe("Notes unavailable");
        });

        it("falls back to a generic error message when the API gives none", async () => {
            getPrivateNotes.mockRejectedValue({});

            const { result } = renderHook(() => usePrivateNotes("conn-4"));

            await waitFor(() => expect(result.current.loading).toBe(false));

            expect(result.current.error).toBe("Failed to load notes.");
        });

        it("refetches when connectRequestId changes", async () => {
            getPrivateNotes.mockResolvedValue({ notes: [] });

            const { rerender } = renderHook(({ id }) => usePrivateNotes(id), {
                initialProps: { id: "conn-5" },
            });

            await waitFor(() => expect(getPrivateNotes).toHaveBeenCalledTimes(1));

            rerender({ id: "conn-6" });

            await waitFor(() => expect(getPrivateNotes).toHaveBeenCalledTimes(2));
            expect(getPrivateNotes).toHaveBeenLastCalledWith("conn-6");
        });
    });

    describe("createNote", () => {
        it("does not call the API when connectRequestId is falsy", async () => {
            const { result } = renderHook(() => usePrivateNotes(null));

            await act(async () => {
                await result.current.createNote("Title", "Content");
            });

            expect(createPrivateNote).not.toHaveBeenCalled();
        });

        it("prepends the new note to the list on success", async () => {
            getPrivateNotes.mockResolvedValue({ notes: [{ _id: "existing" }] });
            createPrivateNote.mockResolvedValue({ note: { _id: "new1", title: "Title" } });

            const { result } = renderHook(() => usePrivateNotes("conn-7"));
            await waitFor(() => expect(result.current.loading).toBe(false));

            let res;
            await act(async () => {
                res = await result.current.createNote("Title", "Content");
            });

            expect(createPrivateNote).toHaveBeenCalledWith("conn-7", "Title", "Content");
            expect(result.current.notes).toEqual([
                { _id: "new1", title: "Title" },
                { _id: "existing" },
            ]);
            expect(res).toEqual({ success: true, note: { _id: "new1", title: "Title" } });
            expect(result.current.saving).toBe(false);
        });

        it("uses default title/content when none are provided", async () => {
            getPrivateNotes.mockResolvedValue({ notes: [] });
            createPrivateNote.mockResolvedValue({ note: { _id: "new2" } });

            const { result } = renderHook(() => usePrivateNotes("conn-8"));
            await waitFor(() => expect(result.current.loading).toBe(false));

            await act(async () => {
                await result.current.createNote();
            });

            expect(createPrivateNote).toHaveBeenCalledWith("conn-8", "Untitled Note", "");
        });

        it("sets an error and returns failure on create error", async () => {
            getPrivateNotes.mockResolvedValue({ notes: [] });
            createPrivateNote.mockRejectedValue({
                response: { data: { message: "Cannot create note" } },
            });

            const { result } = renderHook(() => usePrivateNotes("conn-9"));
            await waitFor(() => expect(result.current.loading).toBe(false));

            let res;
            await act(async () => {
                res = await result.current.createNote("T", "C");
            });

            expect(res).toEqual({ success: false, message: "Cannot create note" });
            expect(result.current.error).toBe("Cannot create note");
        });
    });

    describe("updateNote", () => {
        it("replaces the matching note in the list on success", async () => {
            getPrivateNotes.mockResolvedValue({
                notes: [{ _id: "n1", title: "Old" }, { _id: "n2", title: "Other" }],
            });
            updatePrivateNote.mockResolvedValue({ note: { _id: "n1", title: "New" } });

            const { result } = renderHook(() => usePrivateNotes("conn-10"));
            await waitFor(() => expect(result.current.loading).toBe(false));

            let res;
            await act(async () => {
                res = await result.current.updateNote("n1", "New", "Updated content");
            });

            expect(updatePrivateNote).toHaveBeenCalledWith("n1", "New", "Updated content");
            expect(result.current.notes).toEqual([
                { _id: "n1", title: "New" },
                { _id: "n2", title: "Other" },
            ]);
            expect(res).toEqual({ success: true, note: { _id: "n1", title: "New" } });
        });

        it("sets an error and returns failure on update error", async () => {
            getPrivateNotes.mockResolvedValue({ notes: [] });
            updatePrivateNote.mockRejectedValue({});

            const { result } = renderHook(() => usePrivateNotes("conn-11"));
            await waitFor(() => expect(result.current.loading).toBe(false));

            let res;
            await act(async () => {
                res = await result.current.updateNote("n1", "T", "C");
            });

            expect(res).toEqual({ success: false, message: "Failed to save note." });
            expect(result.current.error).toBe("Failed to save note.");
        });
    });

    describe("deleteNote", () => {
        it("removes the note from the list on success", async () => {
            getPrivateNotes.mockResolvedValue({
                notes: [{ _id: "n1" }, { _id: "n2" }],
            });
            deletePrivateNote.mockResolvedValue({});

            const { result } = renderHook(() => usePrivateNotes("conn-12"));
            await waitFor(() => expect(result.current.loading).toBe(false));

            let res;
            await act(async () => {
                res = await result.current.deleteNote("n1");
            });

            expect(deletePrivateNote).toHaveBeenCalledWith("n1");
            expect(result.current.notes).toEqual([{ _id: "n2" }]);
            expect(res).toEqual({ success: true });
        });

        it("sets an error and returns failure on delete error", async () => {
            getPrivateNotes.mockResolvedValue({ notes: [{ _id: "n1" }] });
            deletePrivateNote.mockRejectedValue({
                response: { data: { message: "Cannot delete note" } },
            });

            const { result } = renderHook(() => usePrivateNotes("conn-13"));
            await waitFor(() => expect(result.current.loading).toBe(false));

            let res;
            await act(async () => {
                res = await result.current.deleteNote("n1");
            });

            expect(res).toEqual({ success: false, message: "Cannot delete note" });
            expect(result.current.error).toBe("Cannot delete note");
            expect(result.current.notes).toEqual([{ _id: "n1" }]);
        });
    });
});