// src/test/components/mentee/dashboard/findMentors/MentorProfileModal.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import React from "react";
import MentorProfileModal from "../../../../../components/mentee/dashboard/findMentors/MentorProfileModal";
import { useMentorSlots } from "../../../../../hooks/useMentorSlots";
import useConnectRequest from "../../../../../hooks/useConnectRequest";
import useSlotLock from "../../../../../hooks/useSlotLock";

vi.mock("../../../../../hooks/useMentorSlots", () => ({
    useMentorSlots: vi.fn(),
}));

vi.mock("../../../../../hooks/useConnectRequest", () => ({
    default: vi.fn(),
}));

vi.mock("../../../../../hooks/useSlotLock", () => ({
    default: vi.fn(),
}));

vi.mock("../../../../../components/mentee/dashboard/findMentors/ConnectSucessModal", () => ({
    default: ({ mentorName, onBackToDashboard }) => (
        <div data-testid="mock-success-modal">
            <span>{mentorName}</span>
            <button onClick={onBackToDashboard}>Back</button>
        </div>
    ),
}));

describe("MentorProfileModal Component Suite", () => {
    const mockClose = vi.fn();
    const mockSendRequest = vi.fn();
    const mockReset = vi.fn();
    const mockLockSlot = vi.fn();
    const mockUnlockSlot = vi.fn();
    const mockUnlockAll = vi.fn();
    const mockFetchSlots = vi.fn();

    const baseMentor = {
        id: "mentor-1",
        userId: "u-1",
        name: "Alex Chen",
        currentRole: "Engineering Manager",
        company: "Zenith Labs",
        industry: "Technology",
        bio: "10 years building distributed systems.",
        hourlyRate: 50,
        avgRating: 4.7,
        reviewCount: 20,
        yearsOfExperience: 10,
        profilePicture: "",
        location: "Remote",
        totalSessions: 60,
    };

    const groupA = {
        date: "2026-08-20",
        day: "Thursday",
        displayDate: "Thu, Aug 20",
        slots: [
            { startTime: "10:00", endTime: "11:00", isBooked: false },
            { startTime: "11:00", endTime: "12:00", isBooked: true },
        ],
    };

    beforeEach(() => {
        vi.clearAllMocks();

        useMentorSlots.mockReturnValue({
            groupedSlots: [groupA],
            availableDurations: [30, 60],
            fetchingSlots: false,
            slotsError: null,
            fetchSlots: mockFetchSlots,
        });

        useConnectRequest.mockReturnValue({
            sending: false,
            error: null,
            sendRequest: mockSendRequest,
            reset: mockReset,
        });

        useSlotLock.mockReturnValue({
            lockSlot: mockLockSlot,
            unlockSlot: mockUnlockSlot,
            unlockAll: mockUnlockAll,
        });
    });

    it("should render core mentor details, rating, and badges", () => {
        render(<MentorProfileModal mentor={baseMentor} onClose={mockClose} />);

        expect(screen.getByText("Alex Chen")).toBeInTheDocument();
        expect(screen.getByText(/Engineering Manager at Zenith Labs/)).toBeInTheDocument();
        expect(screen.getByText("4.7")).toBeInTheDocument();
        expect(screen.getByText("(20 reviews)")).toBeInTheDocument();
        expect(screen.getByText("Top Rated")).toBeInTheDocument(); // avgRating >= 4.5
        expect(screen.getByText("Expert Guide")).toBeInTheDocument(); // totalSessions >= 50
    });

    it("should show a fetching skeleton state while slots load", () => {
        useMentorSlots.mockReturnValue({
            groupedSlots: [],
            availableDurations: [],
            fetchingSlots: true,
            slotsError: null,
            fetchSlots: mockFetchSlots,
        });
        const { container } = render(<MentorProfileModal mentor={baseMentor} onClose={mockClose} />);
        expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    });

    it("should show the slots error message when slotsError is set", () => {
        useMentorSlots.mockReturnValue({
            groupedSlots: [],
            availableDurations: [],
            fetchingSlots: false,
            slotsError: "Could not load slots",
            fetchSlots: mockFetchSlots,
        });
        render(<MentorProfileModal mentor={baseMentor} onClose={mockClose} />);
        expect(screen.getByText("Could not load slots")).toBeInTheDocument();
    });

    it("should show 'No available slots.' when there are no free (unbooked) slots", () => {
        useMentorSlots.mockReturnValue({
            groupedSlots: [{ ...groupA, slots: [{ startTime: "10:00", endTime: "11:00", isBooked: true }] }],
            availableDurations: [60],
            fetchingSlots: false,
            slotsError: null,
            fetchSlots: mockFetchSlots,
        });
        render(<MentorProfileModal mentor={baseMentor} onClose={mockClose} />);
        expect(screen.getByText("No available slots.")).toBeInTheDocument();
    });

    it("should lock a slot on selection and add it to the selections list", async () => {
        mockLockSlot.mockResolvedValueOnce({ ok: true });
        render(<MentorProfileModal mentor={baseMentor} onClose={mockClose} />);

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: /10:00 AM.*11:00 AM/i }));
        });

        expect(mockLockSlot).toHaveBeenCalledWith("2026-08-20", "10:00", "11:00");
        expect(screen.getByText("Your selections")).toBeInTheDocument();
        expect(screen.getAllByText("Thu, Aug 20")).toHaveLength(2); // day tab + selection row
    });

    it("should unlock and remove a slot when clicking an already-selected pill", async () => {
        mockLockSlot.mockResolvedValueOnce({ ok: true });
        render(<MentorProfileModal mentor={baseMentor} onClose={mockClose} />);

        const pill = screen.getByRole("button", { name: /10:00 AM.*11:00 AM/i });
        await act(async () => {
            fireEvent.click(pill); // select
        });
        await act(async () => {
            fireEvent.click(pill); // deselect
        });

        expect(mockUnlockSlot).toHaveBeenCalledWith("2026-08-20", "10:00", "11:00");
    });

    it("should show a lock error and refetch slots when locking fails with SLOT_BOOKED", async () => {
        mockLockSlot.mockResolvedValueOnce({ ok: false, code: "SLOT_BOOKED" });
        render(<MentorProfileModal mentor={baseMentor} onClose={mockClose} />);

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: /10:00 AM.*11:00 AM/i }));
        });

        expect(screen.getByText(/just booked by someone/i)).toBeInTheDocument();
        expect(mockFetchSlots).toHaveBeenCalled();
    });

    it("should remove a selected slot via the selection row's remove button", async () => {
        mockLockSlot.mockResolvedValueOnce({ ok: true });
        render(<MentorProfileModal mentor={baseMentor} onClose={mockClose} />);

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: /10:00 AM.*11:00 AM/i }));
        });
        expect(screen.getByText("Your selections")).toBeInTheDocument();

        fireEvent.click(screen.getByTitle("Remove slot"));

        // selection row is gone; only the day-tab pill's "Thu, Aug 20" remains
        expect(screen.queryByText("Your selections")).not.toBeInTheDocument();
        expect(screen.getAllByText("Thu, Aug 20")).toHaveLength(1);
    });

    it("should keep the send button disabled until at least one slot is selected", () => {
        render(<MentorProfileModal mentor={baseMentor} onClose={mockClose} />);
        expect(screen.getByRole("button", { name: /Send Connect Request/i })).toBeDisabled();
    });

    it("should send the request with selected slots and show the success modal on success", async () => {
        mockLockSlot.mockResolvedValueOnce({ ok: true });
        mockSendRequest.mockResolvedValueOnce(true);
        render(<MentorProfileModal mentor={baseMentor} onClose={mockClose} />);

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: /10:00 AM.*11:00 AM/i }));
        });

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: /Send Connect Request/i }));
        });

        expect(mockSendRequest).toHaveBeenCalledWith(
            expect.objectContaining({
                mentorId: "u-1",
                sessionRate: 50,
                sessionCount: 1,
            })
        );
        expect(screen.getByTestId("mock-success-modal")).toBeInTheDocument();
        expect(screen.getByText("Alex Chen")).toBeInTheDocument();
    });

    it("should call unlockAll and onClose when the header close button is clicked", () => {
        render(<MentorProfileModal mentor={baseMentor} onClose={mockClose} />);
        fireEvent.click(screen.getByRole("button", { name: "" })); // the X icon button has no accessible name
        expect(mockUnlockAll).toHaveBeenCalled();
        expect(mockClose).toHaveBeenCalled();
    });

    it("should reset and close via the success modal's back button", async () => {
        mockLockSlot.mockResolvedValueOnce({ ok: true });
        mockSendRequest.mockResolvedValueOnce(true);
        render(<MentorProfileModal mentor={baseMentor} onClose={mockClose} />);

        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: /10:00 AM.*11:00 AM/i }));
        });
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: /Send Connect Request/i }));
        });

        fireEvent.click(screen.getByRole("button", { name: "Back" }));
        expect(mockReset).toHaveBeenCalled();
        expect(mockClose).toHaveBeenCalled();
    });
});