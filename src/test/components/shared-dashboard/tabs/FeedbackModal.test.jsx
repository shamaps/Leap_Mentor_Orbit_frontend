import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import FeedbackModal from "../../../../features/shared-dashboard/view/components/tabs/FeedbackModal";
import useReport from "../../../../features/shared-dashboard/presenter/useReport";

// Mock the useReport custom layout hook
const mockSubmitFeedback = vi.fn();
vi.mock("../../../../features/shared-dashboard/presenter/useReport", () => ({
    default: vi.fn(() => ({
        submitFeedback: mockSubmitFeedback,
        submitting: false,
        error: null,
    })),
}));

// Mock the Spinner component out of layout streams
vi.mock("../../../../shared/components/Spinner", () => ({
    default: () => <div data-testid="mock-spinner">Loading...</div>,
}));

describe("FeedbackModal Component Suite", () => {
    const mockClose = vi.fn();
    const mockFeedbackSubmitted = vi.fn();

    const baseConnectMentee = {
        _id: "conn-123",
        viewerRole: "mentee",
        mentor: { name: "John Mentor" },
        mentee: { name: "Alice Mentee" },
    };

    const baseConnectMentor = {
        _id: "conn-456",
        viewerRole: "mentor",
        mentor: { name: "John Mentor" },
        mentee: { name: "Alice Mentee" },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
        useReport.mockReturnValue({
            submitFeedback: mockSubmitFeedback,
            submitting: false,
            error: null,
        });
    });

    describe("Initial Core Layout & Roles Mapping Matrix", () => {
        it("should mount accurately and read mentor information properties if viewer is a mentee", () => {
            render(
                <FeedbackModal
                    connect={baseConnectMentee}
                    onClose={mockClose}
                    slotIndex={0}
                />
            );

            expect(screen.getByText("Session 1 Complete!")).toBeInTheDocument();
            expect(screen.getByText("Share your experience with John Mentor")).toBeInTheDocument();
            expect(screen.getByPlaceholderText("What did you think about your session with John Mentor?")).toBeInTheDocument();
        });

        it("should mount accurately and read mentee information properties if viewer is a mentor", () => {
            render(
                <FeedbackModal
                    connect={baseConnectMentor}
                    onClose={mockClose}
                    slotIndex={undefined}
                />
            );

            expect(screen.getByText("Session Complete!")).toBeInTheDocument();
            expect(screen.getByText("Share your experience with Alice Mentee")).toBeInTheDocument();
        });

        it("should handle missing user information objects using string fallback values seamlessly", () => {
            const bareMenteeConnect = { _id: "conn-789", viewerRole: "mentee", mentor: null };
            const bareMentorConnect = { _id: "conn-000", viewerRole: "mentor", mentee: null };

            const { rerender } = render(
                <FeedbackModal connect={bareMenteeConnect} onClose={mockClose} />
            );
            expect(screen.getByText("Share your experience with Mentor")).toBeInTheDocument();

            rerender(<FeedbackModal connect={bareMentorConnect} onClose={mockClose} />);
            expect(screen.getByText("Share your experience with Mentee")).toBeInTheDocument();
        });
    });

    describe("Star Rating Selector Mechanics", () => {
        it("should display correct matching string values for each star selection score index", () => {
            render(<FeedbackModal connect={baseConnectMentee} onClose={mockClose} />);

            const starButtons = screen.getAllByRole("button", { name: /Rate \d star/ });
            expect(starButtons).toHaveLength(5);

            // Verify textual display tags update upon user selection interactions
            fireEvent.click(starButtons[0]); // 1 Star
            expect(screen.getByText("Poor")).toBeInTheDocument();

            fireEvent.click(starButtons[2]); // 3 Stars
            expect(screen.getByText("Good")).toBeInTheDocument();

            fireEvent.click(starButtons[4]); // 5 Stars
            expect(screen.getByText("Excellent")).toBeInTheDocument();
        });

        it("should completely ignore rating input requests if disabled state property is true", () => {
            useReport.mockReturnValue({
                submitFeedback: mockSubmitFeedback,
                submitting: true,
                error: null,
            });

            render(<FeedbackModal connect={baseConnectMentee} onClose={mockClose} />);

            const starButtons = screen.getAllByRole("button", { name: /Rate \d star/ });
            fireEvent.click(starButtons[3]);

            // Submit button remains locked during background mutations
            expect(screen.getByText("Submitting...")).toBeInTheDocument();
        });
    });

    describe("Submissions Pipeline & Timers Transitions", () => {
        it("should prevent submission events if overall star ranking is zero", () => {
            render(<FeedbackModal connect={baseConnectMentee} onClose={mockClose} />);

            const submitBtn = screen.getByText("Submit Feedback");
            expect(submitBtn).toBeDisabled();

            fireEvent.click(submitBtn);
            expect(mockSubmitFeedback).not.toHaveBeenCalled();
        });

        it("should process successful reviews and close using fallback close callbacks after timeouts", async () => {
            vi.useFakeTimers();
            mockSubmitFeedback.mockResolvedValueOnce({ success: true });

            // Pass slotIndex={0} here so the component logic perfectly forwards 0 to the mock implementation hook
            render(<FeedbackModal connect={baseConnectMentee} onClose={mockClose} slotIndex={0} />);

            // Select 4 Stars and write description text
            const starButtons = screen.getAllByRole("button", { name: /Rate \d star/ });
            fireEvent.click(starButtons[3]);

            const commentArea = screen.getByPlaceholderText(/What did you think/);
            fireEvent.change(commentArea, { target: { value: "Awesome learning loop!" } });

            const submitBtn = screen.getByText("Submit Feedback");
            await act(async () => {
                fireEvent.click(submitBtn);
            });

            expect(mockSubmitFeedback).toHaveBeenCalledWith(4, "Awesome learning loop!", 0);
            expect(screen.getByText("Feedback Submitted!")).toBeInTheDocument();

            // Advance fake timers by 1500ms to complete success banner countdown lifecycle
            await act(async () => {
                vi.advanceTimersByTime(1500);
            });

            expect(mockClose).toHaveBeenCalled();
            vi.useRealTimers();
        });

        it("should use explicit feedback submitted function callbacks if defined inside parameters", async () => {
            vi.useFakeTimers();
            mockSubmitFeedback.mockResolvedValueOnce({ success: true });

            render(
                <FeedbackModal
                    connect={baseConnectMentee}
                    onClose={mockClose}
                    onFeedbackSubmitted={mockFeedbackSubmitted}
                    slotIndex={2}
                />
            );

            fireEvent.click(screen.getAllByRole("button", { name: /Rate \d star/ })[4]);
            await act(async () => {
                fireEvent.click(screen.getByText("Submit Feedback"));
            });

            await act(async () => {
                vi.advanceTimersByTime(1500);
            });

            expect(mockFeedbackSubmitted).toHaveBeenCalled();

            // Verify manual Done click fallback branch execution paths
            const doneBtn = screen.getByText("Done");
            fireEvent.click(doneBtn);
            expect(mockFeedbackSubmitted).toHaveBeenCalledTimes(2);

            vi.useRealTimers();
        });

        it("should instantly execute dialog close pathways if backend catches an existing duplicate review string", async () => {
            mockSubmitFeedback.mockResolvedValueOnce({ success: false, message: "already submitted feedback" });

            render(<FeedbackModal connect={baseConnectMentee} onClose={mockClose} />);

            fireEvent.click(screen.getAllByRole("button", { name: /Rate \d star/ })[4]);
            await act(async () => {
                fireEvent.click(screen.getByText("Submit Feedback"));
            });

            expect(mockClose).toHaveBeenCalled();
        });
    });

    describe("Error Boundary Notice Formats", () => {
        it("should draw explicit notice strings within form margins if hooks emit errors", () => {
            useReport.mockReturnValue({
                submitFeedback: mockSubmitFeedback,
                submitting: false,
                error: "Database cluster down connection refused.",
            });

            render(<FeedbackModal connect={baseConnectMentee} onClose={mockClose} />);

            expect(screen.getByText("Database cluster down connection refused.")).toBeInTheDocument();
        });

        it("should fire exit routines if users click skip for now text blocks", () => {
            render(<FeedbackModal connect={baseConnectMentee} onClose={mockClose} />);

            const skipBtn = screen.getByText("Skip for now");
            fireEvent.click(skipBtn);
            expect(mockClose).toHaveBeenCalled();
        });
    });
});