import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import ReportModal from "../../../../features/shared-dashboard/view/components/tabs/ReportModal";
import useReportComplaint from "../../../../features/shared-dashboard/presenter/useReportComplaint";

// Mock the custom hook
vi.mock("../../../../features/shared-dashboard/presenter/useReportComplaint", () => ({
    default: vi.fn(),
}));

// Mock URL.createObjectURL for screenshot preview handling
globalThis.URL.createObjectURL = vi.fn(() => "blob:mock-url");

describe("ReportModal Component", () => {
    let mockOnClose;
    let mockOnSuccess;
    let mockSubmitReport;
    let mockSetError;

    const defaultConnect = {
        _id: "conn-123",
        viewerRole: "mentee",
        mentor: { name: "John Doe" },
        mentee: { name: "Jane Smith" },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockOnClose = vi.fn();
        mockOnSuccess = vi.fn();
        mockSubmitReport = vi.fn();
        mockSetError = vi.fn();

        // Default mock hook state
        useReportComplaint.mockReturnValue({
            submitReport: mockSubmitReport,
            submitting: false,
            error: null,
            setError: mockSetError,
        });
    });

    it("should render correctly with Mentee role and display Refund option", () => {
        render(
            <ReportModal
                connect={defaultConnect}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        expect(screen.getByText("Reporting John Doe")).toBeInTheDocument();
        expect(screen.getByText("Refund Issue")).toBeInTheDocument();
    });

    it("should render correctly with Mentor role and hide Refund option", () => {
        const mentorConnect = {
            ...defaultConnect,
            viewerRole: "mentor",
        };

        render(
            <ReportModal
                connect={mentorConnect}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        expect(screen.getByText("Reporting Jane Smith")).toBeInTheDocument();
        expect(screen.queryByText("Refund Issue")).not.toBeInTheDocument();
    });

    it("should fallback to generic placeholder names if connection properties are missing", () => {
        const basicConnect = { _id: "123", viewerRole: "mentee" };
        render(<ReportModal connect={basicConnect} onClose={mockOnClose} onSuccess={mockOnSuccess} />);
        expect(screen.getByText("Reporting Mentor")).toBeInTheDocument();
    });

    it("should trigger onClose when clicking the close header button or backdrop", async () => {
        const user = userEvent.setup();
        render(
            <ReportModal
                connect={defaultConnect}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        // Click close button
        const closeBtn = screen.getAllByRole("button")[0]; // Header close button
        await user.click(closeBtn);
        expect(mockOnClose).toHaveBeenCalledTimes(1);

        // Click backdrop area
        const backdrop = screen.getByRole("presentation");
        await user.click(backdrop);
        expect(mockOnClose).toHaveBeenCalledTimes(2);
    });

    it("should trigger onClose when pressing the Escape key", () => {
        render(
            <ReportModal
                connect={defaultConnect}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        const event = new KeyboardEvent("keydown", { key: "Escape" });
        globalThis.dispatchEvent(event);
        expect(mockOnClose).toHaveBeenCalled();
    });

    it("should allow a user to select a complaint type and update text fields", async () => {
        const user = userEvent.setup();
        render(
            <ReportModal
                connect={defaultConnect}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        const scamOption = screen.getByText("Spam, Scam or Solicitation");
        await user.click(scamOption);

        const textarea = screen.getByPlaceholderText(/Please describe what happened/i);
        const description = "This is a valid long description for report validation.";
        await user.type(textarea, description);

        expect(textarea.value).toBe(description);

        await waitFor(() => {
            const countEl = screen.getByText(`${description.length}/1000`);
            expect(countEl).toBeInTheDocument();
        });
    });

    it("should handle uploading and clearing screenshots", async () => {
        const user = userEvent.setup();
        const { container } = render(
            <ReportModal
                connect={defaultConnect}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        const file = new File(["dummy content"], "screenshot.png", { type: "image/png" });

        // Safely query target hidden input element bypassing unlinked label properties
        const fileInput = container.querySelector('input[type="file"]');

        // Simulate screenshot select
        await user.upload(fileInput, file);

        const previewImg = screen.getByAltText("preview");
        expect(previewImg).toBeInTheDocument();

        // Select and click the absolute positioned cross icon removal action button
        const removeBtn = screen.getAllByRole("button").find(
            btn => btn.className.includes("absolute")
        );
        await user.click(removeBtn);
        expect(screen.queryByAltText("preview")).not.toBeInTheDocument();
    });

    it("should show submitting loader and block operations while submitting data", () => {
        useReportComplaint.mockReturnValue({
            submitReport: mockSubmitReport,
            submitting: true,
            error: null,
            setError: mockSetError,
        });

        render(
            <ReportModal
                connect={defaultConnect}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        expect(screen.getByText("Submitting...")).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Please describe what happened/i)).toBeDisabled();
    });

    it("should show submission hook errors if populated", () => {
        useReportComplaint.mockReturnValue({
            submitReport: mockSubmitReport,
            submitting: false,
            error: "Network unexpected crash error",
            setError: mockSetError,
        });

        render(
            <ReportModal
                connect={defaultConnect}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        expect(screen.getByText("Network unexpected crash error")).toBeInTheDocument();
    });

    it("should invoke submitReport and launch onSuccess upon functional confirmation", async () => {
        mockSubmitReport.mockResolvedValue({ success: true });
        const user = userEvent.setup();

        render(
            <ReportModal
                connect={defaultConnect}
                onClose={mockOnClose}
                onSuccess={mockOnSuccess}
            />
        );

        // Pick a complaint type
        await user.click(screen.getByText("Inappropriate Behavior"));
        // Add validation text
        await user.type(screen.getByPlaceholderText(/Please describe what happened/i), "Valid testing description input message.");

        // Hit submission
        await user.click(screen.getByText("Submit Report"));

        await waitFor(() => {
            expect(mockSubmitReport).toHaveBeenCalledWith({
                complaintType: "inappropriate_behavior",
                description: "Valid testing description input message.",
                screenshot: null,
            });
            expect(mockOnSuccess).toHaveBeenCalled();
        });
    });
});