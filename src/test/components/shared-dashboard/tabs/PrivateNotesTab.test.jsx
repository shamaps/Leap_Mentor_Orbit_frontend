import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../../../test/mswServer"; // adjust relative path to your shared MSW server
import PrivateNotesTab from "../../../../components/shared-dashboard/tabs/PrivateNotesTab";
import useNotes from "../../../../hooks/useNotes";
import usePrivateNotes from "../../../../hooks/usePrivateNotes";

// Mock dependent custom hooks
vi.mock("../../../../hooks/useNotes", () => ({
    default: vi.fn(),
}));

vi.mock("../../../../hooks/usePrivateNotes", () => ({
    default: vi.fn(),
}));

// Mock child or external atomic elements
vi.mock("../../../../components/common/EmptyState", () => ({
    default: vi.fn(({ message, actionLabel, onAction }) => (
        <div data-testid="empty-state">
            <p>{message}</p>
            {actionLabel && <button onClick={onAction}>{actionLabel}</button>}
        </div>
    )),
}));

// Stub global environments safely using Vitest utilities
vi.stubGlobal("URL", {
    createObjectURL: vi.fn(() => "blob:mock-url"),
});
vi.stubGlobal("confirm", vi.fn(() => true));
vi.stubGlobal("open", vi.fn(() => ({
    document: {
        createElement: vi.fn((type) => document.createElement(type)),
        head: { appendChild: vi.fn() },
        body: { appendChild: vi.fn() },
        title: "",
    },
    print: vi.fn(),
})));

// Prevent JSDOM anchor navigation crashes globally across download simulations
HTMLAnchorElement.prototype.click = vi.fn();

// Generate clean traceable global mock for fetch
const mockFetchInstance = vi.fn(() =>
    Promise.resolve({
        blob: () => Promise.resolve(new Blob(["mock content"], { type: "text/plain" })),
    })
);
vi.stubGlobal("fetch", mockFetchInstance);

describe("PrivateNotesTab Component & Children", () => {
    const defaultConnect = { _id: "conn-999", status: "active" };

    // Sample data configurations
    const mockPrivateNotesFiles = [
        {
            _id: "file-1",
            fileType: "pdf",
            fileUrl: "https://mock.com/doc.pdf",
            fileName: "test-document.pdf",
            fileSize: 2048,
            title: "Custom Title",
            createdAt: new Date().toISOString(),
        },
        {
            _id: "file-2",
            fileType: "unknown_type",
            fileUrl: "https://mock.com/random.xyz",
            fileName: "untitled-file.xyz",
            fileSize: 1048576,
            title: "",
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        },
        {
            _id: "file-3",
            fileType: "doc",
            fileUrl: "https://mock.com/word.docx",
            fileName: "doc.docx",
            fileSize: 500,
            title: "Older Document",
            createdAt: "2023-01-01T00:00:00.000Z", // Static past date
        }
    ];

    const mockNotepadNotes = [
        { _id: "note-1", title: "Note One", content: "Short note content.", updatedAt: new Date().toISOString() },
        { _id: "note-2", title: "", content: "   ", updatedAt: new Date().toISOString() }
    ];

    let mockUploadNote, mockDeleteFile, mockCreateNote, mockUpdateNote, mockDeleteNote;

    beforeEach(() => {
        vi.clearAllMocks();

        mockUploadNote = vi.fn().mockResolvedValue({ success: true });
        mockDeleteFile = vi.fn();
        mockCreateNote = vi.fn().mockResolvedValue({ success: true, note: { _id: "note-new" } });
        mockUpdateNote = vi.fn().mockResolvedValue({ success: true });
        mockDeleteNote = vi.fn();

        useNotes.mockReturnValue({
            privateNotes: mockPrivateNotesFiles,
            loading: false,
            uploading: false,
            error: null,
            uploadNote: mockUploadNote,
            deleteNote: mockDeleteFile,
        });

        usePrivateNotes.mockReturnValue({
            notes: mockNotepadNotes,
            loading: false,
            saving: false,
            createNote: mockCreateNote,
            updateNote: mockUpdateNote,
            deleteNote: mockDeleteNote,
        });

        mockFetchInstance.mockImplementation(() =>
            Promise.resolve({
                blob: () => Promise.resolve(new Blob(["mock content"], { type: "text/plain" })),
            })
        );
    });

    // ── 1. ROOT NAVIGATION & LAYOUT BRANCHES ───────────────────
    it("should render root layout and support swapping sub-tabs", async () => {
        const user = userEvent.setup();
        render(<PrivateNotesTab connect={defaultConnect} />);

        expect(screen.getByText("Private Workspace")).toBeInTheDocument();
        expect(screen.getByText("Private Files")).toBeInTheDocument();

        const notepadTabBtn = screen.getByRole("button", { name: "Notepad" });
        await user.click(notepadTabBtn);

        expect(screen.queryByText("Private Files")).not.toBeInTheDocument();
        expect(screen.getByPlaceholderText("Note title...")).toBeInTheDocument();
    });

    // ── 2. PRIVATE FILES SUB-SECTION & UTILITIES ───────────────
    it("should display loading skeletons under file ingestion", () => {
        useNotes.mockReturnValue({ privateNotes: [], loading: true, uploading: false, error: null });
        render(<PrivateNotesTab connect={defaultConnect} />);

        expect(screen.queryByText("Private Files")).toBeInTheDocument();
        expect(screen.queryByText("Custom Title")).not.toBeInTheDocument();
    });

    it("should offer empty states when file catalogs evaluate dry", () => {
        useNotes.mockReturnValue({ privateNotes: [], loading: false, uploading: false, error: null });
        render(<PrivateNotesTab connect={defaultConnect} />);

        expect(screen.getByTestId("empty-state")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Upload First Private File" })).toBeInTheDocument();
    });

    it("should lock upload parameters if context status reads completed", () => {
        const completedConnect = { ...defaultConnect, status: "completed" };
        useNotes.mockReturnValue({ privateNotes: [], loading: false, uploading: false, error: null });

        render(<PrivateNotesTab connect={completedConnect} />);
        expect(screen.queryByRole("button", { name: "Upload Private File" })).not.toBeInTheDocument();
    });

    it("should render dynamic date header partitions and file type variations", () => {
        render(<PrivateNotesTab connect={defaultConnect} />);

        expect(screen.getByText("Today")).toBeInTheDocument();
        expect(screen.getByText("Yesterday")).toBeInTheDocument();
        expect(screen.getByText("January 1, 2023")).toBeInTheDocument();

        expect(screen.getByText("Custom Title")).toBeInTheDocument();
        expect(screen.getByText("test-document.pdf")).toBeInTheDocument();
    });

    it("should call hook deletion algorithms when requested from cards", async () => {
        const user = userEvent.setup();
        render(<PrivateNotesTab connect={defaultConnect} />);

        const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
        await user.click(deleteButtons[0]);

        expect(globalThis.confirm).toHaveBeenCalledWith("Delete this file?");
        expect(mockDeleteFile).toHaveBeenCalledWith("file-1", true);
    });
    it("should download files locally via programmatic click actions", async () => {
        const documentAppendSpy = vi.spyOn(document.body, "appendChild");
        const user = userEvent.setup();

        server.use(
            http.get("https://mock.com/doc.pdf", () =>
                HttpResponse.text("mock content", {
                    headers: { "Content-Type": "text/plain" },
                })
            )
        );

        render(<PrivateNotesTab connect={defaultConnect} />);

        const downloadButtons = screen.getAllByRole("button", { name: /download/i });
        await user.click(downloadButtons[0]);

        await waitFor(() => {
            expect(documentAppendSpy).toHaveBeenCalled();
        });
    });
    it("should fallback to blank targets if fetch downloads encounter networking issues", async () => {
        mockFetchInstance.mockImplementationOnce(() => Promise.reject(new Error("Network Error")));
        const user = userEvent.setup();

        render(<PrivateNotesTab connect={defaultConnect} />);

        const downloadButtons = screen.getAllByRole("button", { name: "Download" });
        await user.click(downloadButtons[0]);

        await waitFor(() => {
            expect(globalThis.open).toHaveBeenCalledWith("https://mock.com/doc.pdf", "_blank");
        });
    });

    it("should present external hook error alerts if declared", () => {
        useNotes.mockReturnValue({
            privateNotes: [],
            loading: false,
            uploading: false,
            error: "Critical upload filesystem interruption error",
        });

        render(<PrivateNotesTab connect={defaultConnect} />);
        expect(screen.getByText("Critical upload filesystem interruption error")).toBeInTheDocument();
    });

    // ── 3. UPLOAD MODAL COMPONENT FLOWS ────────────────────────
    it("should open upload modal and cycle through file drag drop classes", async () => {
        const user = userEvent.setup();
        render(<PrivateNotesTab connect={defaultConnect} />);

        const openUploadBtn = screen.getByRole("button", { name: "Upload Private File" });
        await user.click(openUploadBtn);

        expect(screen.getByRole("heading", { name: "Upload Private File" })).toBeInTheDocument();

        const dropzoneLabel = screen.getByText(/Drop file here or/i).closest("label");

        fireEvent.dragOver(dropzoneLabel);
        expect(dropzoneLabel.className).toContain("border-amber-400");

        fireEvent.dragLeave(dropzoneLabel);
        expect(dropzoneLabel.className).not.toContain("border-amber-400");
    });

    it("should validate mime classifications and reject unsupported types", async () => {
        const user = userEvent.setup();
        const { container } = render(<PrivateNotesTab connect={defaultConnect} />);

        await user.click(screen.getByRole("button", { name: "Upload Private File" }));
        const hiddenInput = container.querySelector('input[type="file"]');

        const brokenFile = new File(["data"], "virus.exe", { type: "application/x-msdownload" });

        // Direct change event ensures reliable delivery to custom input elements inside JSDOM
        fireEvent.change(hiddenInput, { target: { files: [brokenFile] } });

        await waitFor(() => {
            expect(screen.getByText("File type not supported.")).toBeInTheDocument();
        });
    });

    it("should reject oversized payloads based on sizing bounds", async () => {
        const user = userEvent.setup();
        const { container } = render(<PrivateNotesTab connect={defaultConnect} />);

        await user.click(screen.getByRole("button", { name: "Upload Private File" }));
        const hiddenInput = container.querySelector('input[type="file"]');

        const hugeFile = new File(["data"], "big.pdf", { type: "application/pdf" });
        Object.defineProperty(hugeFile, "size", { value: 15 * 1024 * 1024 });

        fireEvent.change(hiddenInput, { target: { files: [hugeFile] } });

        await waitFor(() => {
            expect(screen.getByText("File too large. Maximum size is 10MB.")).toBeInTheDocument();
        });
    });

    it("should upload configurations and process dynamic execution triggers", async () => {
        const user = userEvent.setup();
        const { container } = render(<PrivateNotesTab connect={defaultConnect} />);

        // Open Modal
        await user.click(screen.getByRole("button", { name: "Upload Private File" }));
        const hiddenInput = container.querySelector('input[type="file"]');

        const validFile = new File(["content"], "my-notes.pdf", { type: "application/pdf" });

        fireEvent.change(hiddenInput, { target: { files: [validFile] } });

        await waitFor(() => {
            expect(screen.getByText("my-notes.pdf")).toBeInTheDocument();
        });

        const titleInput = screen.getByPlaceholderText("e.g. Week 2 Notes");
        await user.clear(titleInput);
        await user.type(titleInput, "Custom Dynamic Note Title");

        // Grab the footer submit button directly using a combination text filter
        const modalButtons = screen.getAllByRole("button");
        const submitBtn = modalButtons.find(
            (b) => b.textContent.includes("Upload Private File") && b.type === "button" && !b.className.includes("inline-flex")
        );

        await user.click(submitBtn);

        await waitFor(() => {
            expect(mockUploadNote).toHaveBeenCalledWith(validFile, "Custom Dynamic Note Title", true);
        });
    });
    it("should reset file state when 'Choose different file' button is clicked", async () => {
        const user = userEvent.setup();
        const { container } = render(<PrivateNotesTab connect={defaultConnect} />);

        await user.click(screen.getByRole("button", { name: "Upload Private File" }));
        const hiddenInput = container.querySelector('input[type="file"]');

        const validFile = new File(["content"], "reset-me.docx", { type: "application/msword" });
        fireEvent.change(hiddenInput, { target: { files: [validFile] } });

        await waitFor(async () => {
            const chooseDiffBtn = screen.getByRole("button", { name: "Choose different file" });
            await user.click(chooseDiffBtn);
        });

        expect(screen.getByText(/Drop file here or/i)).toBeInTheDocument();
    });

    // ── 4. NOTEPAD EDITOR & TEXT FLOWS ─────────────────────────
    it("should open blank editor interfaces if no workspace records exist", async () => {
        const user = userEvent.setup();
        usePrivateNotes.mockReturnValue({
            notes: [], loading: false, saving: false, createNote: mockCreateNote, updateNote: mockUpdateNote, deleteNote: mockDeleteNote
        });

        render(<PrivateNotesTab connect={defaultConnect} />);
        await user.click(screen.getByRole("button", { name: "Notepad" }));

        expect(screen.getByText("No note selected")).toBeInTheDocument();

        const newNoteButtons = screen.getAllByRole("button", { name: "New Note" });
        await user.click(newNoteButtons[0]);

        expect(mockCreateNote).toHaveBeenCalledWith("Untitled Note", "");
    });

    it("should calculate live word sizes and save textual payload data edits", async () => {
        const user = userEvent.setup();
        render(<PrivateNotesTab connect={defaultConnect} />);
        await user.click(screen.getByRole("button", { name: "Notepad" }));

        const editorArea = screen.getByPlaceholderText("Start writing your private note here…");
        await user.type(editorArea, " Adding extra words.");

        expect(screen.getByText(/Unsaved changes/i)).toBeInTheDocument();
        expect(screen.getByText(/6\s*file\s*word/i)).toBeInTheDocument();

        const saveBtn = screen.getByRole("button", { name: "Save" });
        await user.click(saveBtn);

        expect(mockUpdateNote).toHaveBeenCalledWith("note-1", "Note One", "Short note content. Adding extra words.");
    });

    it("should trigger programmatic download packages for text types and pdf layouts", async () => {
        const user = userEvent.setup();
        const documentAppendSpy = vi.spyOn(document.body, "appendChild");

        render(<PrivateNotesTab connect={defaultConnect} />);
        await user.click(screen.getByRole("button", { name: "Notepad" }));

        const txtBtn = screen.getByRole("button", { name: ".txt" });
        await user.click(txtBtn);
        expect(documentAppendSpy).toHaveBeenCalled();

        const pdfBtn = screen.getByRole("button", { name: "PDF" });
        await user.click(pdfBtn);
        expect(globalThis.open).toHaveBeenCalled();
    });

    it("should delete specific notes and navigate selection index listings backward", async () => {
        const user = userEvent.setup();
        render(<PrivateNotesTab connect={defaultConnect} />);
        await user.click(screen.getByRole("button", { name: "Notepad" }));

        const deleteNoteBtn = screen.getAllByRole("button").find(b => b.innerHTML.includes("polyline"));
        await user.click(deleteNoteBtn);

        expect(globalThis.confirm).toHaveBeenCalledWith("Delete this note?");
        expect(mockDeleteNote).toHaveBeenCalledWith("note-1");
    });

    it("should display spinning indicator bars while notepad hooks run initializations", async () => {
        usePrivateNotes.mockReturnValue({
            notes: [], loading: true, saving: false, createNote: mockCreateNote, updateNote: mockUpdateNote, deleteNote: mockDeleteNote
        });

        const user = userEvent.setup();
        const { container } = render(<PrivateNotesTab connect={defaultConnect} />);
        await user.click(screen.getByRole("button", { name: "Notepad" }));

        const spinner = container.querySelector(".animate-spin");
        expect(spinner).toBeInTheDocument();
    });
});