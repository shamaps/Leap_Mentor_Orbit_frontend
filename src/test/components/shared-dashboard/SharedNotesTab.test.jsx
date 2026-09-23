// src/test/components/shared-dashboard/tabs/SharedNotesTab.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import SharedNotesTab from "../../../features/shared-dashboard/view/components/tabs/SharedNotesTab";

let mockState;
vi.mock("react-redux", () => ({
    useSelector: (selectorFn) => selectorFn(mockState),
}));

vi.mock("../../../features/shared-dashboard/view/components/tabs/PrivateNotesTab", () => ({
    default: ({ connect }) => (
        <div>private-notes-tab-{connect?._id}</div>
    ),
}));

let mockUseNotesReturn;
const mockUploadNote = vi.fn();
const mockDeleteNote = vi.fn();
vi.mock("../../../features/shared-dashboard/presenter/useNotes", () => ({
    default: () => mockUseNotesReturn,
}));

const makeNote = (overrides = {}) => ({
    _id: "note1",
    uploadedBy: { _id: "user1", name: "John Doe" },
    fileType: "pdf",
    fileUrl: "https://example.com/file.pdf",
    fileName: "file.pdf",
    fileSize: 2048,
    title: "My File",
    createdAt: "2026-07-10T10:00:00Z",
    ...overrides,
});

describe("SharedNotesTab", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockState = {
            sharedConnect: { connect: { _id: "connect1", status: "active" } },
            auth: { user: { _id: "user1" } },
        };
        mockUseNotesReturn = {
            notes: [],
            loading: false,
            uploading: false,
            error: null,
            uploadNote: mockUploadNote,
            deleteNote: mockDeleteNote,
        };
    });

    it("shows a loading spinner when connect is not available", () => {
        mockState = { sharedConnect: { connect: null }, auth: { user: null } };
        const { container } = render(<SharedNotesTab />);
        expect(container.querySelector(".animate-spin")).toBeInTheDocument();
    });

    it("renders the header and shared/private toggle", () => {
        render(<SharedNotesTab />);
        expect(screen.getByText("Notes & Files")).toBeInTheDocument();
        expect(screen.getByText("Shared")).toBeInTheDocument();
        expect(screen.getByText("Private")).toBeInTheDocument();
    });

    it("shows the empty state when there are no shared files", () => {
        render(<SharedNotesTab />);
        expect(screen.getByText("No shared files yet")).toBeInTheDocument();
        expect(screen.getByText("Upload First File")).toBeInTheDocument();
    });

    it("hides the empty-state upload button when connect is completed", () => {
        mockState = {
            sharedConnect: { connect: { _id: "connect1", status: "completed" } },
            auth: { user: { _id: "user1" } },
        };
        render(<SharedNotesTab />);
        expect(screen.queryByText("Upload First File")).not.toBeInTheDocument();
    });

    it("shows the loading skeletons while notes are loading", () => {
        mockUseNotesReturn = { ...mockUseNotesReturn, loading: true };
        const { container } = render(<SharedNotesTab />);
        expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    });
    it("hides the uploading spinner and re-enables the button after upload completes", () => {
        mockUseNotesReturn = { ...mockUseNotesReturn, notes: [makeNote()], uploading: true };
        const { rerender } = render(<SharedNotesTab />);
        fireEvent.click(screen.getByText("Upload File", { selector: "button:not([disabled])" }));
        expect(screen.getByText("Uploading...")).toBeInTheDocument();

        mockUseNotesReturn = { ...mockUseNotesReturn, notes: [makeNote()], uploading: false };
        rerender(<SharedNotesTab />);
        expect(screen.queryByText("Uploading...")).not.toBeInTheDocument();
    });
    it("renders a note card with title, uploader tag, size and date", () => {
        mockUseNotesReturn = { ...mockUseNotesReturn, notes: [makeNote()] };
        render(<SharedNotesTab />);
        expect(screen.getByText("My File")).toBeInTheDocument();
        expect(screen.getByText("You")).toBeInTheDocument();
        expect(screen.getByText(/2\.0 KB/)).toBeInTheDocument();
    });

    it("shows the partner's name badge when the note wasn't uploaded by the current user", () => {
        mockUseNotesReturn = {
            ...mockUseNotesReturn,
            notes: [makeNote({ uploadedBy: { _id: "user2", name: "Partner Name" } })],
        };
        render(<SharedNotesTab />);
        expect(screen.getByText("Partner Name")).toBeInTheDocument();
    });

    it("falls back to 'Partner' when uploader name is missing on a non-owned note", () => {
        mockUseNotesReturn = {
            ...mockUseNotesReturn,
            notes: [makeNote({ uploadedBy: { _id: "user2" } })],
        };
        render(<SharedNotesTab />);
        expect(screen.getByText("Partner")).toBeInTheDocument();
    });

    it("renders a date separator between notes uploaded on different days", () => {
        mockUseNotesReturn = {
            ...mockUseNotesReturn,
            notes: [
                makeNote({ _id: "n1", createdAt: "2026-07-10T10:00:00Z" }),
                makeNote({ _id: "n2", createdAt: "2026-06-01T10:00:00Z", title: "Older File" }),
            ],
        };
        render(<SharedNotesTab />);
        expect(screen.getByText("My File")).toBeInTheDocument();
        expect(screen.getByText("Older File")).toBeInTheDocument();
    });

    it("shows the delete button only when the current user owns the note", () => {
        mockUseNotesReturn = {
            ...mockUseNotesReturn,
            notes: [
                makeNote({ _id: "n1", uploadedBy: { _id: "user1", name: "Me" } }),
                makeNote({ _id: "n2", uploadedBy: { _id: "user2", name: "Other" }, title: "Other File" }),
            ],
        };
        render(<SharedNotesTab />);
        expect(screen.getAllByText("Delete").length).toBe(1);
    });

    it("calls deleteNote when Delete is clicked and confirmed", async () => {
        vi.spyOn(globalThis, "confirm").mockReturnValue(true);
        mockDeleteNote.mockResolvedValue({ success: true });
        mockUseNotesReturn = { ...mockUseNotesReturn, notes: [makeNote()] };
        render(<SharedNotesTab />);
        await act(async () => {
            fireEvent.click(screen.getByText("Delete"));
        });
        expect(mockDeleteNote).toHaveBeenCalledWith("note1", false);
    });

    it("does not call deleteNote when the confirm dialog is dismissed", async () => {
        vi.spyOn(globalThis, "confirm").mockReturnValue(false);
        mockUseNotesReturn = { ...mockUseNotesReturn, notes: [makeNote()] };
        render(<SharedNotesTab />);
        await act(async () => {
            fireEvent.click(screen.getByText("Delete"));
        });
        expect(mockDeleteNote).not.toHaveBeenCalled();
    });

    it("triggers a stream download when Download is clicked", async () => {
        globalThis.fetch = vi.fn().mockResolvedValue({
            blob: () => Promise.resolve(new Blob(["data"])),
        });
        globalThis.URL.createObjectURL = vi.fn().mockReturnValue("blob:url");
        mockUseNotesReturn = { ...mockUseNotesReturn, notes: [makeNote()] };
        render(<SharedNotesTab />);
        await act(async () => {
            fireEvent.click(screen.getByText("Download"));
        });
        expect(globalThis.fetch).toHaveBeenCalledWith("https://example.com/file.pdf");
    });

    it("falls back to opening the file URL when the download fetch fails", async () => {
        globalThis.fetch = vi.fn().mockRejectedValue(new Error("network error"));
        globalThis.open = vi.fn();
        mockUseNotesReturn = { ...mockUseNotesReturn, notes: [makeNote()] };
        render(<SharedNotesTab />);
        await act(async () => {
            fireEvent.click(screen.getByText("Download"));
        });
        expect(globalThis.open).toHaveBeenCalledWith("https://example.com/file.pdf", "_blank");
    });

    it("shows the error banner when there is an error and not uploading", () => {
        mockUseNotesReturn = { ...mockUseNotesReturn, error: "Failed to load notes." };
        render(<SharedNotesTab />);
        expect(screen.getByText("Failed to load notes.")).toBeInTheDocument();
    });

    it("hides the error banner while uploading", () => {
        mockUseNotesReturn = { ...mockUseNotesReturn, error: "Failed to load notes.", uploading: true };
        render(<SharedNotesTab />);
        expect(screen.queryByText("Failed to load notes.")).not.toBeInTheDocument();
    });

    it("opens the upload modal when Upload File is clicked", () => {
        mockUseNotesReturn = { ...mockUseNotesReturn, notes: [makeNote()] };
        render(<SharedNotesTab />);
        fireEvent.click(screen.getByText("Upload File"));
        expect(screen.getByText("Upload Shared File")).toBeInTheDocument();
        expect(screen.getByText("Visible to both you and your session partner")).toBeInTheDocument();
    });

    it("closes the upload modal when Cancel is clicked", () => {
        mockUseNotesReturn = { ...mockUseNotesReturn, notes: [makeNote()] };
        render(<SharedNotesTab />);
        fireEvent.click(screen.getByText("Upload File"));
        fireEvent.click(screen.getByText("Cancel"));
        expect(screen.queryByText("Upload Shared File")).not.toBeInTheDocument();
    });

    it("shows a file-type error when an unsupported file is selected", () => {
        mockUseNotesReturn = { ...mockUseNotesReturn, notes: [makeNote()] };
        render(<SharedNotesTab />);
        fireEvent.click(screen.getByText("Upload File"));
        const input = document.getElementById("shared-note-file-input");
        const badFile = new File(["x"], "bad.exe", { type: "application/x-msdownload" });
        fireEvent.change(input, { target: { files: [badFile] } });
        expect(
            screen.getByText("File type not supported. Use PDF, image, Word, PowerPoint, Excel or text."),
        ).toBeInTheDocument();
    });

    it("shows a file-size error when the selected file is too large", () => {
        mockUseNotesReturn = { ...mockUseNotesReturn, notes: [makeNote()] };
        render(<SharedNotesTab />);
        fireEvent.click(screen.getByText("Upload File"));
        const input = document.getElementById("shared-note-file-input");
        const bigFile = new File(["x"], "big.pdf", { type: "application/pdf" });
        Object.defineProperty(bigFile, "size", { value: 11 * 1024 * 1024 });
        fireEvent.change(input, { target: { files: [bigFile] } });
        expect(screen.getByText("File too large. Maximum size is 10MB.")).toBeInTheDocument();
    });

    it("accepts a valid file, pre-fills the title, and allows editing it", () => {
        mockUseNotesReturn = { ...mockUseNotesReturn, notes: [makeNote()] };
        render(<SharedNotesTab />);
        fireEvent.click(screen.getByText("Upload File"));
        const input = document.getElementById("shared-note-file-input");
        const goodFile = new File(["x"], "resume.pdf", { type: "application/pdf" });
        fireEvent.change(input, { target: { files: [goodFile] } });
        expect(screen.getByDisplayValue("resume")).toBeInTheDocument();
        fireEvent.change(screen.getByDisplayValue("resume"), { target: { value: "My Resume" } });
        expect(screen.getByDisplayValue("My Resume")).toBeInTheDocument();
    });

    it("allows choosing a different file after one is selected", () => {
        mockUseNotesReturn = { ...mockUseNotesReturn, notes: [makeNote()] };
        render(<SharedNotesTab />);
        fireEvent.click(screen.getByText("Upload File"));
        const input = document.getElementById("shared-note-file-input");
        const goodFile = new File(["x"], "resume.pdf", { type: "application/pdf" });
        fireEvent.change(input, { target: { files: [goodFile] } });
        fireEvent.click(screen.getByText("Choose different file"));
        expect(screen.getByText(/Drop file here/)).toBeInTheDocument();
    });

    it("calls uploadNote and closes the modal on successful upload", async () => {
        mockUploadNote.mockResolvedValue({ success: true });
        mockUseNotesReturn = { ...mockUseNotesReturn, notes: [makeNote()], uploadNote: mockUploadNote };
        render(<SharedNotesTab />);
        fireEvent.click(screen.getByText("Upload File"));
        const input = document.getElementById("shared-note-file-input");
        const goodFile = new File(["x"], "resume.pdf", { type: "application/pdf" });
        fireEvent.change(input, { target: { files: [goodFile] } });
        const submitButtons = screen.getAllByText("Upload File", { selector: "button" });
        await act(async () => {
            fireEvent.click(submitButtons[submitButtons.length - 1]);
        });
        expect(mockUploadNote).toHaveBeenCalledWith(goodFile, "resume", false);
        expect(screen.queryByText("Upload Shared File")).not.toBeInTheDocument();
    });

    it("keeps the modal open when upload fails", async () => {
        mockUploadNote.mockResolvedValue({ success: false, message: "Upload failed." });
        mockUseNotesReturn = { ...mockUseNotesReturn, notes: [makeNote()], uploadNote: mockUploadNote };
        render(<SharedNotesTab />);
        fireEvent.click(screen.getByText("Upload File"));
        const input = document.getElementById("shared-note-file-input");
        const goodFile = new File(["x"], "resume.pdf", { type: "application/pdf" });
        fireEvent.change(input, { target: { files: [goodFile] } });
        const submitButtons = screen.getAllByText("Upload File", { selector: "button" });
        await act(async () => {
            fireEvent.click(submitButtons[submitButtons.length - 1]);
        });
        expect(screen.getByText("Upload Shared File")).toBeInTheDocument();
    });

    it("shows a spinner and 'Uploading...' label while uploading", () => {
        mockUseNotesReturn = { ...mockUseNotesReturn, notes: [makeNote()], uploading: true };
        render(<SharedNotesTab />);
        fireEvent.click(screen.getByText("Upload File", { selector: "button:not([disabled])" }));
        expect(screen.getByText("Uploading...")).toBeInTheDocument();
    });

    it("switches to the Private tab and renders PrivateNotesTab", () => {
        render(<SharedNotesTab />);
        fireEvent.click(screen.getByText("Private"));
        expect(screen.getByText("private-notes-tab-connect1")).toBeInTheDocument();
    });

    it("switches back to the Shared tab from Private", () => {
        render(<SharedNotesTab />);
        fireEvent.click(screen.getByText("Private"));
        fireEvent.click(screen.getByText("Shared"));
        expect(screen.getByText("No shared files yet")).toBeInTheDocument();
    });

    it("shows singular file count label when exactly one file is shared", () => {
        mockUseNotesReturn = { ...mockUseNotesReturn, notes: [makeNote()] };
        render(<SharedNotesTab />);
        expect(screen.getByText("1 file shared with your session partner")).toBeInTheDocument();
    });

    it("shows plural file count label when multiple files are shared", () => {
        mockUseNotesReturn = {
            ...mockUseNotesReturn,
            notes: [makeNote({ _id: "n1" }), makeNote({ _id: "n2", title: "Second" })],
        };
        render(<SharedNotesTab />);
        expect(screen.getByText("2 files shared with your session partner")).toBeInTheDocument();
    });
});