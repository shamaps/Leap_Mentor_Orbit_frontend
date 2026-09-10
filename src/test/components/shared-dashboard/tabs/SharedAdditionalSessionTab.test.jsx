import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import React from "react";
import SharedAdditionalSessionTab from "../../../../features/shared-dashboard/view/components/tabs/SharedAdditionalSessionTab";
import { useEscrowStatus } from "../../../../features/mentee/presenter/useEscrowStatus";
import { useRescheduleAvailability } from "../../../../features/mentor/presenter/useRescheduleAvailability";
import useSessions from "../../../../features/shared-dashboard/presenter/useSessions";
import { payAdditionalEscrow } from "../../../../features/shared-dashboard/model/escrow.api";
import { useSelector } from "react-redux";

// ── Mock Redux Selector ──
vi.mock("react-redux", () => ({
    useSelector: vi.fn(),
}));

// ── Mock API Methods ──
vi.mock("../../../../features/shared-dashboard/model/escrow.api", () => ({
    payAdditionalEscrow: vi.fn(),
}));

// ── Mock Dependency Modules ──
vi.mock("../../../../features/mentee/view/components/dashboard/history/EscrowSuccessModal", () => ({
    default: ({ onDone }) => (
        <div data-testid="mock-escrow-success">
            <p>Escrow Successful</p>
            <button onClick={onDone}>Done Success</button>
        </div>
    ),
}));

// ── Mock Custom Hooks ──
vi.mock("../../../../features/mentee/presenter/useEscrowStatus", () => ({ useEscrowStatus: vi.fn() }));
vi.mock("../../../../features/mentor/presenter/useRescheduleAvailability", () => ({ useRescheduleAvailability: vi.fn() }));
vi.mock("../../../../features/shared-dashboard/presenter/useSessions", () => ({ default: vi.fn() }));

describe("SharedAdditionalSessionTab Component Suite", () => {
    const mockTabChange = vi.fn();

    const baseConnectMentee = {
        _id: "conn-mentee-123",
        viewerRole: "mentee",
        status: "active",
        mentor: { name: "Dr. Elizabeth Mentor" },
        mentee: { name: "John Mentee" },
        mentorProfile: { hourlyRate: 100 },
    };

    const baseConnectMentor = {
        _id: "conn-mentor-456",
        viewerRole: "mentor",
        status: "active",
        mentor: { name: "Dr. Elizabeth Mentor" },
        mentee: { name: "John Mentee" },
        mentorProfile: { hourlyRate: 100 },
    };

    const mockAddSlot = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        useSelector.mockReturnValue(baseConnectMentee);

        useSessions.mockReturnValue({
            slots: [],
            additionalSlots: [],
            saving: false,
            addSlot: mockAddSlot,
        });

        useRescheduleAvailability.mockReturnValue({
            availability: [],
            sessionDurations: [30, 60],
            availLoading: false,
            availError: null,
        });

        useEscrowStatus.mockReturnValue({
            fetching: false,
            walletBalance: 500,
            commissionRate: 10,
        });
    });

    describe("Edge Conditions & Null Protection Blocks", () => {
        it("should return null immediately if there is no active connect verification id", () => {
            useSelector.mockReturnValueOnce(null);
            const { container } = render(<SharedAdditionalSessionTab />);
            expect(container.firstChild).toBeNull();
        });

        it("should display a warning notice banner instead of booking panel when session status is marked completed", () => {
            useSelector.mockReturnValueOnce({ ...baseConnectMentee, status: "completed" });
            render(<SharedAdditionalSessionTab />);
            expect(screen.getByText(/This session is completed. Additional slots cannot be added./i)).toBeInTheDocument();
        });
    });

    describe("Time Conversion & Text Formatters Functions", () => {
        it("should format string paths covering different ranges of PM/AM and empty fallback scenarios accurately", () => {
            useRescheduleAvailability.mockReturnValueOnce({
                availability: [
                    {
                        date: "2026-08-20",
                        day: "Thursday",
                        displayDate: "Thursday, August 20",
                        slots: [
                            { startTime: "09:00", endTime: "10:00" },
                            { startTime: "13:30", endTime: "14:30" },
                            { startTime: "00:15", endTime: "01:15" },
                        ],
                    },
                ],
                sessionDurations: [60],
                availLoading: false,
                availError: null,
            });

            render(<SharedAdditionalSessionTab />);
            expect(screen.getByText("09:00 AM")).toBeInTheDocument();
            expect(screen.getByText("01:30 PM")).toBeInTheDocument();
            expect(screen.getByText("12:15 AM")).toBeInTheDocument();
        });
    });

    describe("Availability Selection Grids Layouts", () => {
        it("should render skeleton placeholders when availLoading state targets true", () => {
            useRescheduleAvailability.mockReturnValueOnce({
                availability: [],
                sessionDurations: [60],
                availLoading: true,
                availError: null,
            });

            const { container } = render(<SharedAdditionalSessionTab />);
            // Corrected invalid Chai assertion typo to valid Vitest expectation check
            expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
        });

        it("should construct error messages inside the layout panel when availError string is supplied", () => {
            useRescheduleAvailability.mockReturnValueOnce({
                availability: [],
                sessionDurations: [60],
                availLoading: false,
                availError: "Failed to grab system availability tables from servers.",
            });

            render(<SharedAdditionalSessionTab />);
            expect(screen.getByText("Failed to grab system availability tables from servers.")).toBeInTheDocument();
        });

        it("should supply correct placeholder advice depending on viewerRole rules if slot collection maps empty", () => {
            const { unmount } = render(<SharedAdditionalSessionTab />);
            expect(screen.getByText(/Dr. Elizabeth Mentor hasn't set availability yet/i)).toBeInTheDocument();
            unmount();

            useSelector.mockReturnValueOnce(baseConnectMentor);
            render(<SharedAdditionalSessionTab />);
            expect(screen.getByText(/Go to your Dashboard → Availability tab to add time slots./i)).toBeInTheDocument();
        });
    });

    describe("Booking Interaction Pipeline & Modals Flow", () => {
        const activeAvailability = [
            {
                date: "2026-08-20",
                day: "Thursday",
                displayDate: "Thursday, August 20",
                slots: [{ startTime: "10:00", endTime: "11:00" }],
            },
        ];

        it("should coordinate tab updates, duration switching, confirm dialog paths, and trigger payment screens for mentees", async () => {
            useRescheduleAvailability.mockReturnValue({
                availability: activeAvailability,
                sessionDurations: [30, 60],
                availLoading: false,
                availError: null,
            });
            mockAddSlot.mockResolvedValueOnce({ success: true, slotId: "new-slot-id-987" });

            render(<SharedAdditionalSessionTab onTabChange={mockTabChange} />);

            const durationBtn = screen.getByRole("button", { name: "30 min" });
            fireEvent.click(durationBtn);

            const slotPillBtn = screen.getByText("10:00 AM");
            fireEvent.click(slotPillBtn);

            expect(screen.getByText("Confirm Session")).toBeInTheDocument();

            fireEvent.click(screen.getByText("Cancel"));
            expect(screen.queryByText("Confirm Session")).not.toBeInTheDocument();

            fireEvent.click(slotPillBtn);
            await act(async () => {
                fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
            });

            expect(screen.getByText("Pay for Additional Session")).toBeInTheDocument();
        });

        it("should route straight into SuccessScreen configurations if the viewer category is a mentor", async () => {
            useSelector.mockReturnValue(baseConnectMentor);
            useRescheduleAvailability.mockReturnValue({
                availability: activeAvailability,
                sessionDurations: [60],
                availLoading: false,
                availError: null,
            });
            mockAddSlot.mockResolvedValueOnce({ success: true });

            render(<SharedAdditionalSessionTab onTabChange={mockTabChange} />);

            fireEvent.click(screen.getByText("10:00 AM"));
            await act(async () => {
                fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
            });

            expect(screen.getByText("Session Added!")).toBeInTheDocument();

            fireEvent.click(screen.getByRole("button", { name: "View in Goals Tab →" }));
            expect(mockTabChange).toHaveBeenCalledWith("goals");
        });
    });

    describe("Transaction Escrow Billing Management Module", () => {
        const selectedSlot = { startTime: "10:00", endTime: "11:00", date: "2026-08-20", day: "Thursday" };

        it("should block payment buttons and print explicit errors if balance targets display insufficient levels", async () => {
            useEscrowStatus.mockReturnValueOnce({ fetching: false, walletBalance: 20, commissionRate: 10 });
            useRescheduleAvailability.mockReturnValue({ availability: [{ date: "2026-08-20", day: "Thursday", slots: [selectedSlot] }], sessionDurations: [60] });
            mockAddSlot.mockResolvedValueOnce({ success: true, slotId: "slot-999" });

            render(<SharedAdditionalSessionTab />);

            fireEvent.click(screen.getByText("10:00 AM"));
            await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Confirm" })); });

            expect(screen.getByText(/You need 90 more tokens./i)).toBeInTheDocument();

            const primaryPayBtn = screen.getByRole("button", { name: /Confirm & Pay/i });
            expect(primaryPayBtn).toBeDisabled();
        });

        it("should catch alternative initial fetch delays or failure fallbacks across wallet profiles gracefully", async () => {
            useEscrowStatus.mockReturnValueOnce({ fetching: true, walletBalance: null, commissionRate: 0 });
            useRescheduleAvailability.mockReturnValue({ availability: [{ date: "2026-08-20", day: "Thursday", slots: [selectedSlot] }], sessionDurations: [60] });
            mockAddSlot.mockResolvedValueOnce({ success: true, slotId: "slot-888" });

            render(<SharedAdditionalSessionTab />);
            fireEvent.click(screen.getByText("10:00 AM"));
            await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Confirm" })); });

            expect(screen.getByText("Loading...")).toBeInTheDocument();
        });

        it("should handle wallet balance null fallbacks cleanly without breaking UI", async () => {
            useEscrowStatus.mockReturnValueOnce({ fetching: false, walletBalance: null, commissionRate: 10 });
            useRescheduleAvailability.mockReturnValue({ availability: [{ date: "2026-08-20", day: "Thursday", slots: [selectedSlot] }], sessionDurations: [60] });
            mockAddSlot.mockResolvedValueOnce({ success: true, slotId: "slot-777" });

            render(<SharedAdditionalSessionTab />);
            fireEvent.click(screen.getByText("10:00 AM"));
            await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Confirm" })); });

            expect(screen.getByText("—")).toBeInTheDocument();
        });

        it("should report internal errors if payment rates values return invalid or empty arrays", async () => {
            //  Set hourlyRate to 0 to verify button attribute disables accurately[cite: 9]
            useSelector.mockReturnValue({ ...baseConnectMentee, mentorProfile: { hourlyRate: 0 } });
            useRescheduleAvailability.mockReturnValue({ availability: [{ date: "2026-08-20", day: "Thursday", slots: [selectedSlot] }], sessionDurations: [60] });
            mockAddSlot.mockResolvedValueOnce({ success: true, slotId: "slot-000" });

            render(<SharedAdditionalSessionTab />);
            fireEvent.click(screen.getByText("10:00 AM"));
            await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Confirm" })); });

            // Confirm button element is explicitly disabled due to !sessionRate[cite: 9]
            const confirmPayBtn = screen.getByRole("button", { name: /Confirm & Pay/i });
            expect(confirmPayBtn).toBeDisabled();
        });

        it("should fire backend actions and successfully render confirmation portals upon click executions", async () => {
            payAdditionalEscrow.mockResolvedValueOnce({ success: true });
            useRescheduleAvailability.mockReturnValue({ availability: [{ date: "2026-08-20", day: "Thursday", slots: [selectedSlot] }], sessionDurations: [60] });
            mockAddSlot.mockResolvedValueOnce({ success: true, slotId: "slot-555" });

            render(<SharedAdditionalSessionTab />);
            fireEvent.click(screen.getByText("10:00 AM"));
            await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Confirm" })); });

            const payBtn = screen.getByRole("button", { name: /Confirm & Pay/i });
            await act(async () => {
                fireEvent.click(payBtn);
            });

            expect(screen.getByTestId("mock-escrow-success")).toBeInTheDocument();
            fireEvent.click(screen.getByText("Done Success"));
        });

        it("should catch transaction breakdowns and display customized backend error logs cleanly", async () => {
            payAdditionalEscrow.mockRejectedValueOnce({
                response: { data: { message: "Internal ledger processing timeout error exception." } }
            });
            useRescheduleAvailability.mockReturnValue({ availability: [{ date: "2026-08-20", day: "Thursday", slots: [selectedSlot] }], sessionDurations: [60] });
            mockAddSlot.mockResolvedValueOnce({ success: true, slotId: "slot-444" });

            render(<SharedAdditionalSessionTab />);
            fireEvent.click(screen.getByText("10:00 AM"));
            await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Confirm" })); });

            await act(async () => {
                fireEvent.click(screen.getByRole("button", { name: /Confirm & Pay/i }));
            });

            expect(screen.getByText("Internal ledger processing timeout error exception.")).toBeInTheDocument();

            const closeBtn = screen.getAllByRole("button")[0];
            fireEvent.click(closeBtn);
        });
    });
});