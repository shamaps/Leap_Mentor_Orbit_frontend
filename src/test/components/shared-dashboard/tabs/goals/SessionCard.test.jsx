import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import React from "react";
import SessionCard from "../../../../../features/shared-dashboard/view/components/tabs/goals/SessionCard";
import { useRescheduleAvailability } from "../../../../../features/mentor/presenter/useRescheduleAvailability";

// ── Mock Dependency Hooks ──
vi.mock("../../../../../features/mentor/presenter/useRescheduleAvailability", () => ({
    useRescheduleAvailability: vi.fn(),
}));

// ── Mock Subcomponents ──
vi.mock("../../../../../shared/components/StatusBadge", () => ({
    default: ({ status }) => <div data-testid="mock-status-badge">{status}</div>,
}));

vi.mock("../../../../../shared/components/Spinner", () => ({
    default: () => <span data-testid="mock-spinner" />,
}));

describe("SessionCard Component Suite", () => {
    const mockSetLink = vi.fn();
    const mockMarkComplete = vi.fn();
    const mockCancelSlot = vi.fn();
    const mockRescheduleSlot = vi.fn();
    const mockSessionComplete = vi.fn();

    const baseActiveSlot = {
        date: "2026-08-15",
        startTime: "14:00",
        endTime: "15:00",
        status: "active",
        meetingLink: "",
        menteeMarked: false,
        mentorMarked: false,
        isRescheduled: false,
    };

    const baseProps = {
        slot: baseActiveSlot,
        slotIndex: 0,
        viewerRole: "mentee",
        otherName: "Sarah Mentor",
        savingSlots: new Set(),
        onSetLink: mockSetLink,
        onMarkComplete: mockMarkComplete,
        onCancelSlot: mockCancelSlot,
        onRescheduleSlot: mockRescheduleSlot,
        allSlots: [baseActiveSlot],
        connectRequestId: "conn-req-777",
        onSessionComplete: mockSessionComplete,
        connect: {},
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Freeze calendar line to August 12, 2026 (More than 12 hours before slot)
        vi.setSystemTime(new Date("2026-08-12T12:00:00"));

        useRescheduleAvailability.mockReturnValue({
            availability: [
                {
                    date: "2026-08-16",
                    day: "Sunday",
                    slots: [{ startTime: "10:00", endTime: "11:00" }],
                },
            ],
            sessionDurations: [30, 60],
            availLoading: false,
            availError: null,
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("Initial Mount & Text Formatter Paths", () => {
        it("should display slot parameters correctly covering time boundaries and badge statuses", () => {
            render(<SessionCard {...baseProps} />);
            expect(screen.getByText("Session 1")).toBeInTheDocument();
            expect(screen.getByText(/Saturday, Aug 15, 2026/i)).toBeInTheDocument();
            expect(screen.getByText("2:00 PM – 3:00 PM")).toBeInTheDocument();
            expect(screen.getByTestId("mock-status-badge")).toHaveTextContent("pending");
        });

        it("should handle empty fallback scenarios within text helpers safely", () => {
            const bareProps = { ...baseProps, slot: { ...baseActiveSlot, date: "", startTime: "", endTime: "" } };
            render(<SessionCard {...bareProps} />);
            expect(screen.queryByText(/2026/)).not.toBeInTheDocument();
        });

        it("should apply rescheduled pill metrics cleanly if attributes match true", () => {
            const rescheduledProps = { ...baseProps, slot: { ...baseActiveSlot, isRescheduled: true } };
            render(<SessionCard {...rescheduledProps} />);
            expect(screen.getByText("Rescheduled")).toBeInTheDocument();
        });
    });

    describe("Meeting Link Section Interactions", () => {
        it("should allow mentors to click add and reject non-HTTPS or invalid meeting link patterns", async () => {
            render(<SessionCard {...baseProps} viewerRole="mentor" />);

            const addLinkBtn = screen.getByRole("button", { name: /Add Meeting Link/i });
            fireEvent.click(addLinkBtn);

            const input = screen.getByPlaceholderText("https://meet.google.com/...");

            // Test empty input validation branch
            fireEvent.change(input, { target: { value: "   " } });
            fireEvent.keyDown(input, { key: "Enter" });
            expect(screen.getByText("Link cannot be empty")).toBeInTheDocument();

            // Test bad domain structural validation branch
            fireEvent.change(input, { target: { value: "http://malicious-domain.com" } });
            fireEvent.click(screen.getByRole("button", { name: "Save" }));
            expect(screen.getByText(/Only HTTPS links from Google Meet, Zoom etc are allowed/i)).toBeInTheDocument();

            // Click Cancel layout resets parameters
            fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
            expect(screen.queryByPlaceholderText("https://meet.google.com/...")).not.toBeInTheDocument();
        });

        it("should submit validated links successfully and exit edit forms on resolution", async () => {
            mockSetLink.mockResolvedValueOnce({ success: true });
            render(<SessionCard {...baseProps} viewerRole="mentor" />);

            fireEvent.click(screen.getByRole("button", { name: /Add Meeting Link/i }));
            fireEvent.change(screen.getByPlaceholderText("https://meet.google.com/..."), {
                target: { value: "https://meet.google.com/abc-defg-hij" },
            });

            await act(async () => {
                fireEvent.click(screen.getByRole("button", { name: "Save" }));
            });
            expect(mockSetLink).toHaveBeenCalledWith(0, "https://meet.google.com/abc-defg-hij");
        });

        it("should display read-only view elements to mentees when meetingLink is active", () => {
            const linkedProps = { ...baseProps, slot: { ...baseActiveSlot, meetingLink: "https://zoom.us/j/123" } };
            render(<SessionCard {...linkedProps} viewerRole="mentee" />);

            const linkAnchor = screen.getByRole("link");
            expect(linkAnchor).toHaveAttribute("href", "https://zoom.us/j/123");
            expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
        });
    });

    describe("Completion State Actions Matrix", () => {
        it("should execute onMarkComplete when the completion action button is activated", async () => {
            mockMarkComplete.mockResolvedValueOnce({ success: true });
            render(<SessionCard {...baseProps} />);

            const completeBtn = screen.getByRole("button", { name: /Mark Session Complete/i });
            await act(async () => {
                fireEvent.click(completeBtn);
            });

            expect(mockMarkComplete).toHaveBeenCalledWith(0);
            expect(mockSessionComplete).toHaveBeenCalledWith(0);
        });

        it("should display a finished notification message if both parties have checked off completion", () => {
            const doneProps = { ...baseProps, slot: { ...baseActiveSlot, menteeMarked: true, mentorMarked: true } };
            render(<SessionCard {...doneProps} />);

            expect(screen.getByText("Session Completed by Both Parties")).toBeInTheDocument();
            expect(screen.queryByRole("button", { name: /Mark Session Complete/i })).not.toBeInTheDocument();
        });
    });

    describe("Cancellation Modal Execution Flow", () => {
        it("should orchestrate opening cancel modal sheets and submitting details cleanly", async () => {
            mockCancelSlot.mockResolvedValueOnce({ success: true });
            render(<SessionCard {...baseProps} />);

            fireEvent.click(screen.getByRole("button", { name: /Cancel Session/i }));
            expect(screen.getByText("Cancel this session?")).toBeInTheDocument();

            fireEvent.change(screen.getByLabelText(/Reason/i), { target: { value: "Conflict" } });

            await act(async () => {
                fireEvent.click(screen.getByRole("button", { name: "Yes, Cancel It" }));
            });
            expect(mockCancelSlot).toHaveBeenCalledWith(0, "Conflict");
        });
        it("should render skeletons or alternative notice boxes depending on async state hooks results", () => {
            useRescheduleAvailability.mockReturnValueOnce({ availability: [], sessionDurations: [60], availLoading: true });
            const { container, rerender } = render(<SessionCard {...baseProps} />);
            fireEvent.click(screen.getByRole("button", { name: "Reschedule" }));
            expect(container.querySelectorAll(".bg-slate-100")).toHaveLength(3);

            useRescheduleAvailability.mockReturnValueOnce({ availability: [], sessionDurations: [60], availError: "Server Failure Exception" });
            rerender(<SessionCard {...baseProps} />);
            expect(screen.getByText("Server Failure Exception")).toBeInTheDocument();

            useRescheduleAvailability.mockReturnValueOnce({ availability: [], sessionDurations: [60], availLoading: false, availError: null });
            rerender(<SessionCard {...baseProps} />);
            expect(screen.getByText("No slots available")).toBeInTheDocument();
        });
    });

    describe("Reschedule Selection Triggers and Time Locks", () => {
        it("should enforce a locked notice capsule if dates fall within the 12-hour expiration window", () => {
            // Advance clock timeline closer to the target booking boundary range
            vi.setSystemTime(new Date("2026-08-15T10:00:00"));
            render(<SessionCard {...baseProps} />);

            expect(screen.getByText("Reschedule unavailable (before 12hrs)")).toBeInTheDocument();
        });

        it("should allow opening reschedule forms, toggling duration tabs, and picking slot pills safely", async () => {
            mockRescheduleSlot.mockResolvedValueOnce({ success: true });
            render(<SessionCard {...baseProps} />);

            fireEvent.click(screen.getByRole("button", { name: "Reschedule" }));
            expect(screen.getByText("Reschedule Session")).toBeInTheDocument();

            // Toggle duration filter sets
            fireEvent.click(screen.getByRole("button", { name: "30 min" }));

            // Pick open time pill configuration elements
            const pillBtn = screen.getByRole("button", { name: "10:00 AM – 11:00 AM" });
            fireEvent.click(pillBtn);

            await act(async () => {
                fireEvent.click(screen.getByRole("button", { name: "Confirm Reschedule" }));
            });
            expect(mockRescheduleSlot).toHaveBeenCalledWith(0, {
                day: "Sunday",
                date: "2026-08-16",
                startTime: "10:00",
                endTime: "11:00",
            });
        });

        it("should render skeletons or alternative notice boxes depending on async state hooks results", () => {
            useRescheduleAvailability.mockReturnValueOnce({ availability: [], sessionDurations: [60], availLoading: true });
            const { container, rerender } = render(<SessionCard {...baseProps} />);
            fireEvent.click(screen.getByRole("button", { name: "Reschedule" }));
            expect(container.querySelectorAll(".bg-slate-100")).toHaveLength(3);

            useRescheduleAvailability.mockReturnValueOnce({ availability: [], sessionDurations: [60], availError: "Server Failure Exception" });
            rerender(<SessionCard {...baseProps} />);
            expect(screen.getByText("Server Failure Exception")).toBeInTheDocument();

            useRescheduleAvailability.mockReturnValueOnce({ availability: [], sessionDurations: [60], availLoading: false, availError: null });
            rerender(<SessionCard {...baseProps} />);
            expect(screen.getByText("No slots available")).toBeInTheDocument();
        });
    });
});