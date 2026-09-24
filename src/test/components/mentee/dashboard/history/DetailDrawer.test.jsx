// src/test/components/mentee/dashboard/history/DetailDrawer.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import DetailDrawer from "../../../../../features/mentee/view/components/dashboard/history/DetailDrawer";
import { useInvoiceDownload } from "../../../../../features/mentor/presenter/useInvoiceDownload";
import { mapReferredMentor } from "../../../../../features/connects/model/connectRequestMapper";

vi.mock("../../../../../features/mentor/presenter/useInvoiceDownload", () => ({
    useInvoiceDownload: vi.fn(),
}));

vi.mock("../../../../../features/connects/model/connectRequestMapper", () => ({
    mapReferredMentor: vi.fn(),
}));

vi.mock("../../../../../shared/components/StatusBadge", () => ({
    default: ({ status }) => <div data-testid="mock-status-badge">{status}</div>,
}));

vi.mock("../../../../../features/mentee/view/components/dashboard/history/EscrowPaymentModal", () => ({
    default: ({ onClose, onSuccess }) => (
        <div data-testid="mock-escrow-payment-modal">
            <button onClick={onClose}>close-payment</button>
            <button onClick={() => onSuccess({ status: "ongoing" })}>succeed-payment</button>
        </div>
    ),
}));

vi.mock("../../../../../features/mentee/view/components/dashboard/findMentors/MentorProfileModal", () => ({
    default: ({ mentor, onClose }) => (
        <div data-testid="mock-mentor-profile-modal">
            <span>{mentor?.name}</span>
            <button onClick={onClose}>close-profile</button>
        </div>
    ),
}));

describe("DetailDrawer Component Suite", () => {
    const mockClose = vi.fn();
    const mockDelete = vi.fn();
    const mockUpdateRequest = vi.fn();
    const mockDownloadInvoice = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        useInvoiceDownload.mockReturnValue({
            downloading: false,
            error: null,
            downloadInvoice: mockDownloadInvoice,
        });
        mapReferredMentor.mockReturnValue(null);
    });

    it("should render nothing when request is null", () => {
        const { container } = render(
            <DetailDrawer request={null} onClose={mockClose} onDelete={mockDelete} onUpdateRequest={mockUpdateRequest} />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it("should render mentor identity, status badge, and status message for a pending request", () => {
        const request = {
            _id: "r1",
            mentor: { name: "Jordan Lee", email: "jordan@example.com" },
            status: "pending",
            selectedSlots: [],
            message: "",
            requestedAt: "2026-08-01T00:00:00.000Z",
        };
        render(<DetailDrawer request={request} onClose={mockClose} onDelete={mockDelete} onUpdateRequest={mockUpdateRequest} />);

        expect(screen.getByText("Jordan Lee")).toBeInTheDocument();
        expect(screen.getByText("jordan@example.com")).toBeInTheDocument();
        expect(screen.getByTestId("mock-status-badge")).toHaveTextContent("pending");
        expect(screen.getByText(/Waiting for mentor response/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Cancel Request" })).toBeInTheDocument();
    });

    it("should call onDelete and onClose when cancelling a pending request", () => {
        const request = { _id: "r1", mentor: { name: "Jordan" }, status: "pending", selectedSlots: [] };
        render(<DetailDrawer request={request} onClose={mockClose} onDelete={mockDelete} onUpdateRequest={mockUpdateRequest} />);

        fireEvent.click(screen.getByRole("button", { name: "Cancel Request" }));
        expect(mockDelete).toHaveBeenCalledWith("r1");
        expect(mockClose).toHaveBeenCalled();
    });

    it("should open and close the EscrowPaymentModal for an accepted request", () => {
        const request = { _id: "r2", mentor: { name: "Jordan" }, status: "accepted", selectedSlots: [] };
        render(<DetailDrawer request={request} onClose={mockClose} onDelete={mockDelete} onUpdateRequest={mockUpdateRequest} />);

        fireEvent.click(screen.getByRole("button", { name: "Make Payment" }));
        expect(screen.getByTestId("mock-escrow-payment-modal")).toBeInTheDocument();

        fireEvent.click(screen.getByText("close-payment"));
        expect(screen.queryByTestId("mock-escrow-payment-modal")).not.toBeInTheDocument();
    });

    it("should call onUpdateRequest with the patch when payment succeeds", () => {
        const request = { _id: "r2", mentor: { name: "Jordan" }, status: "accepted", selectedSlots: [] };
        render(<DetailDrawer request={request} onClose={mockClose} onDelete={mockDelete} onUpdateRequest={mockUpdateRequest} />);

        fireEvent.click(screen.getByRole("button", { name: "Make Payment" }));
        fireEvent.click(screen.getByText("succeed-payment"));

        expect(mockUpdateRequest).toHaveBeenCalledWith("r2", { status: "ongoing" });
    });

    it("should render escrow amount and trigger invoice download for an ongoing request", () => {
        const request = {
            _id: "r3",
            mentor: { name: "Jordan" },
            status: "ongoing",
            totalAmount: 300,
            sessionRate: 50,
            sessionCount: 6,
            confirmedSlot: { day: "Monday", date: "2026-08-17", startTime: "10:00", endTime: "11:00" },
        };
        render(<DetailDrawer request={request} onClose={mockClose} onDelete={mockDelete} onUpdateRequest={mockUpdateRequest} />);

        expect(screen.getByText("300 tokens secured in escrow")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: /Download Invoice/i }));
        expect(mockDownloadInvoice).toHaveBeenCalledWith("r3");
    });

    it("should show a downloading state and error for the ongoing invoice download", () => {
        useInvoiceDownload.mockReturnValue({
            downloading: true,
            error: "Download failed",
            downloadInvoice: mockDownloadInvoice,
        });
        const request = { _id: "r3", mentor: { name: "Jordan" }, status: "ongoing", totalAmount: 100 };
        render(<DetailDrawer request={request} onClose={mockClose} onDelete={mockDelete} onUpdateRequest={mockUpdateRequest} />);

        expect(screen.getByText("Downloading...")).toBeInTheDocument();
        expect(screen.getByText("Download failed")).toBeInTheDocument();
    });

    it("should render completed session summary for a completed request", () => {
        const request = {
            _id: "r4",
            mentor: { name: "Jordan" },
            status: "completed",
            totalAmount: 300,
            completedAt: "2026-08-20T00:00:00.000Z",
        };
        render(<DetailDrawer request={request} onClose={mockClose} onDelete={mockDelete} onUpdateRequest={mockUpdateRequest} />);

        expect(screen.getByText("Session Completed")).toBeInTheDocument();
        expect(screen.getByText("300 tokens released to mentor")).toBeInTheDocument();
    });

    it("should render referral path and hide the profile button when there's no referred mentor mapping", () => {
        mapReferredMentor.mockReturnValue(null);
        const request = {
            _id: "r5",
            mentor: { name: "Original Mentor" },
            status: "referred",
            referredTo: { name: "New Mentor" },
            referredToProfile: { currentRole: "Coach" },
            selectedSlots: [],
        };
        render(<DetailDrawer request={request} onClose={mockClose} onDelete={mockDelete} onUpdateRequest={mockUpdateRequest} />);

        expect(screen.getAllByText("Original Mentor").length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("New Mentor")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /View Referred Mentor Profile/i })).not.toBeInTheDocument();
    });

    it("should open the referred mentor's profile modal when mapping succeeds", () => {
        mapReferredMentor.mockReturnValue({ name: "New Mentor", userId: "u9" });
        const request = {
            _id: "r5",
            mentor: { name: "Original Mentor" },
            status: "referred",
            referredTo: { name: "New Mentor" },
            selectedSlots: [],
        };
        render(<DetailDrawer request={request} onClose={mockClose} onDelete={mockDelete} onUpdateRequest={mockUpdateRequest} />);

        fireEvent.click(screen.getByRole("button", { name: /View Referred Mentor Profile/i }));
        expect(screen.getByTestId("mock-mentor-profile-modal")).toHaveTextContent("New Mentor");

        fireEvent.click(screen.getByText("close-profile"));
        expect(screen.queryByTestId("mock-mentor-profile-modal")).not.toBeInTheDocument();
    });

    it("should call onDelete and onClose when deleting a referred request", () => {
        mapReferredMentor.mockReturnValue(null);
        const request = { _id: "r5", mentor: { name: "Original" }, status: "referred", selectedSlots: [] };
        render(<DetailDrawer request={request} onClose={mockClose} onDelete={mockDelete} onUpdateRequest={mockUpdateRequest} />);

        fireEvent.click(screen.getByRole("button", { name: "Delete Request" }));
        expect(mockDelete).toHaveBeenCalledWith("r5");
        expect(mockClose).toHaveBeenCalled();
    });

    it("should show the response date and a Close button for a rejected request", () => {
        const request = {
            _id: "r6",
            mentor: { name: "Jordan" },
            status: "rejected",
            selectedSlots: [],
            respondedAt: "2026-08-05T00:00:00.000Z",
        };
        render(<DetailDrawer request={request} onClose={mockClose} onDelete={mockDelete} onUpdateRequest={mockUpdateRequest} />);

        expect(screen.getByText(/Declined on/)).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Close" }));
        expect(mockClose).toHaveBeenCalled();
    });

    it("should call onClose when the header close button or backdrop is clicked", () => {
        const request = { _id: "r1", mentor: { name: "Jordan" }, status: "pending", selectedSlots: [] };
        render(<DetailDrawer request={request} onClose={mockClose} onDelete={mockDelete} onUpdateRequest={mockUpdateRequest} />);

        fireEvent.click(screen.getByRole("button", { name: "Close details" })); // backdrop aria-label
        expect(mockClose).toHaveBeenCalled();
    });
});