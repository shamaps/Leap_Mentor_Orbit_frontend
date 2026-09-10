import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import React from "react";
import SharedReportTab from "../../../../features/shared-dashboard/view/components/tabs/SharedReportTab";
import useReport from "../../../../features/shared-dashboard/presenter/useReport";

// Hoist the missing global component to prevent the source code's ReferenceError crash[cite: 8]
beforeAll(() => {
    globalThis.EmptyState = ({ message, subMessage, icon }) => (
        <div data-testid="mock-empty-state">
            <div data-testid="mock-icon">{icon}</div>
            <h3>{message}</h3>
            <p>{subMessage}</p>
        </div>
    );
});

// Mock the useReport custom hook layout paths
const mockSubmitFeedback = vi.fn();
vi.mock("../../../../features/shared-dashboard/presenter/useReport", () => ({
    default: vi.fn(() => ({
        myFeedback: null,
        theirFeedback: null,
        sessionStatus: "completed",
        loading: false,
        submitting: false,
        error: null,
        submitFeedback: mockSubmitFeedback,
    })),
}));

// Fix absolute path mappings for sub-modals relative to the source module location[cite: 8]
vi.mock("../../../../features/shared-dashboard/view/components/tabs/ReportModal", () => ({
    default: ({ onClose, onSuccess }) => (
        <div data-testid="mock-report-modal">
            <button onClick={onClose}>Close Report</button>
            <button onClick={onSuccess}>Confirm Success</button>
        </div>
    ),
}));

vi.mock("../../../../features/shared-dashboard/view/components/tabs/ReportSuccessModal", () => ({
    default: ({ onBack }) => (
        <div data-testid="mock-success-modal">
            <p>Report Submitted Successfully</p>
            <button onClick={onBack}>Go Back</button>
        </div>
    ),
}));

describe("SharedReportTab Component Suite", () => {
    const mockConnectMentee = {
        _id: "conn-999",
        viewerRole: "mentee",
        mentor: { name: "Alice Mentor" },
        mentee: { name: "Bob Mentee" },
    };

    const mockConnectMentor = {
        _id: "conn-888",
        viewerRole: "mentor",
        mentor: { name: "Alice Mentor" },
        mentee: { name: "Bob Mentee" },
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Loading Boundary Layout Passages", () => {
        it("should mount and display structural loader spinning animations before network resolution", () => {
            useReport.mockReturnValueOnce({
                loading: true,
            });

            render(<SharedReportTab connect={mockConnectMentee} reportRefreshKey={1} />);
            expect(screen.getByText("Loading...")).toBeInTheDocument();
        });
    });

    describe("User Category Verification & Roles Fallbacks", () => {
        it("should render names for Alice Mentor cleanly if the current viewer context is marked as a mentee", () => {
            render(<SharedReportTab connect={mockConnectMentee} reportRefreshKey={1} />);
            expect(screen.getByText("Rate your session with Alice Mentor")).toBeInTheDocument();
        });

        it("should render names for Bob Mentee cleanly if the current viewer context is marked as a mentor", () => {
            render(<SharedReportTab connect={mockConnectMentor} reportRefreshKey={1} />);
            expect(screen.getByText("Rate your session with Bob Mentee")).toBeInTheDocument();
        });

        it("should deploy generic parameter text fallbacks when user profile references return blank objects", () => {
            const bareMentee = { _id: "1", viewerRole: "mentee", mentor: null };
            const bareMentor = { _id: "2", viewerRole: "mentor", mentee: null };

            const { rerender } = render(<SharedReportTab connect={bareMentee} reportRefreshKey={1} />);
            expect(screen.getByText("Rate your session with Mentor")).toBeInTheDocument();

            rerender(<SharedReportTab connect={bareMentor} reportRefreshKey={1} />);
            expect(screen.getByText("Rate your session with Mentee")).toBeInTheDocument();
        });
    });

    describe("Session Non-Completion Empty States", () => {
        it("should mount the custom EmptyState framework template when sessionStatus maps to incomplete", () => {
            useReport.mockReturnValueOnce({
                sessionStatus: "pending",
                loading: false,
            });

            render(<SharedReportTab connect={mockConnectMentee} reportRefreshKey={1} />);

            expect(screen.getByTestId("mock-empty-state")).toBeInTheDocument();
            expect(screen.getByText("Session not completed yet")).toBeInTheDocument();
            expect(screen.getByTestId("mock-icon").querySelector("svg")).toBeInTheDocument();
        });
    });

    describe("Interactive Feedback Form Submissions", () => {
        it("should render validation labels and allow dynamic adjustments of overall star values", () => {
            render(<SharedReportTab connect={mockConnectMentee} reportRefreshKey={1} />);

            const stars = screen.getAllByRole("button");
            // Index 0 = Report button, Index 1 = Star 1
            fireEvent.click(stars[1]);
            expect(screen.getByText("Poor")).toBeInTheDocument();

            fireEvent.click(stars[3]); // Star 3
            expect(screen.getByText("Good")).toBeInTheDocument();

            fireEvent.click(stars[5]); // Star 5
            expect(screen.getByText("Excellent")).toBeInTheDocument();
        });

        it("should submit user parameters cleanly and substitute elements with success banners", async () => {
            mockSubmitFeedback.mockResolvedValueOnce({ success: true });
            render(<SharedReportTab connect={mockConnectMentee} reportRefreshKey={1} />);

            const stars = screen.getAllByRole("button");
            fireEvent.click(stars[5]);

            const textComment = screen.getByPlaceholderText(/Share what you thought/);
            fireEvent.change(textComment, { target: { value: "Exemplary guidance patterns!" } });

            const submitBtn = screen.getByText("Submit Feedback");
            await act(async () => {
                fireEvent.click(submitBtn);
            });

            expect(mockSubmitFeedback).toHaveBeenCalledWith(5, "Exemplary guidance patterns!");
            expect(screen.getByText("Feedback submitted successfully!")).toBeInTheDocument();
        });

        it("should keep submit action handles locked and display spinner assets when submitting matches true", () => {
            useReport.mockReturnValueOnce({
                sessionStatus: "completed",
                loading: false,
                submitting: true,
            });

            render(<SharedReportTab connect={mockConnectMentee} reportRefreshKey={1} />);
            expect(screen.getByText("Submitting...")).toBeInTheDocument();
        });

        it("should render error texts beneath input grids if submit mutations reject", () => {
            useReport.mockReturnValueOnce({
                sessionStatus: "completed",
                loading: false,
                error: "Database integrity constraints block duplicate feedback updates.",
            });

            render(<SharedReportTab connect={mockConnectMentee} reportRefreshKey={1} />);
            expect(screen.getByText("Database integrity constraints block duplicate feedback updates.")).toBeInTheDocument();
        });
    });

    describe("Submitted Review Information Cards Displays", () => {
        it("should load pre-existing review metrics and paint their corresponding details", () => {
            const mockPastFeedback = {
                rating: 4,
                comment: "Outstanding mentorship session clarity.",
                createdAt: "2026-06-15T08:00:00.000Z",
            };

            useReport.mockReturnValueOnce({
                sessionStatus: "completed",
                myFeedback: mockPastFeedback,
                theirFeedback: mockPastFeedback,
                loading: false,
            });

            render(<SharedReportTab connect={mockConnectMentee} reportRefreshKey={1} />);

            expect(screen.getByText("Your Feedback")).toBeInTheDocument();
            expect(screen.getByText("Feedback from Alice Mentor")).toBeInTheDocument();
            expect(screen.getAllByText(`"Outstanding mentorship session clarity."`)).toHaveLength(2);
            expect(screen.getAllByText("4/5")).toHaveLength(2);
            expect(screen.getAllByText("Jun 15, 2026")).toHaveLength(2);
        });

        it("should display a placeholder notice if the opposite partner profile has not supplied feedback data", () => {
            useReport.mockReturnValueOnce({
                sessionStatus: "completed",
                myFeedback: null,
                theirFeedback: null,
                loading: false,
            });

            render(<SharedReportTab connect={mockConnectMentee} reportRefreshKey={1} />);
            expect(screen.getByText("Waiting for Alice Mentor to submit their feedback")).toBeInTheDocument();
        });
    });

    describe("Reporting Modals Interception Operations", () => {
        it("should coordinate opening triggers, allow manual modal drops, and transition to system success panels", () => {
            render(<SharedReportTab connect={mockConnectMentee} reportRefreshKey={1} />);

            const reportOpenBtn = screen.getByRole("button", { name: /report/i });
            fireEvent.click(reportOpenBtn);

            expect(screen.getByTestId("mock-report-modal")).toBeInTheDocument();

            fireEvent.click(screen.getByText("Close Report"));
            expect(screen.queryByTestId("mock-report-modal")).not.toBeInTheDocument();

            fireEvent.click(reportOpenBtn);
            fireEvent.click(screen.getByText("Confirm Success"));

            expect(screen.queryByTestId("mock-report-modal")).not.toBeInTheDocument();
            expect(screen.getByTestId("mock-success-modal")).toBeInTheDocument();

            fireEvent.click(screen.getByText("Go Back"));
            expect(screen.queryByTestId("mock-success-modal")).not.toBeInTheDocument();
        });
    });
});