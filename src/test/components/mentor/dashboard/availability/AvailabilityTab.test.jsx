// src/test/components/mentor/dashboard/availability/AvailabilityTab.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AvailabilityTab from "../../../../../features/mentor/view/components/dashboard/availability/AvailabilityTab";

const { mockUseAvailability, mockUseAvailabilityReturn } = vi.hoisted(() => {
    const mockUseAvailabilityReturn = {
        availability: {
            specificDates: [],
            timezone: "Asia/Kolkata",
            sessionDurations: [30, 60],
            googleCalendarConnected: false,
        },
        loading: false,
        saving: false,
        msg: { type: "", text: "" },
        toggleDuration: vi.fn(),
        updateTimezone: vi.fn(),
        saveAvailability: vi.fn(),
        cancelChanges: vi.fn(),
        setSpecificDates: vi.fn(),
        setAvailability: vi.fn(),
    };
    return {
        mockUseAvailability: vi.fn(() => mockUseAvailabilityReturn),
        mockUseAvailabilityReturn,
    };
});

vi.mock("../../../../../features/mentor/presenter/useAvailability", () => ({
    default: mockUseAvailability,
}));

vi.mock("../../../../../features/mentor/view/components/dashboard/availability/CalendarAvailabilitySection", () => ({
    default: (props) => (
        <div data-testid="calendar-availability-section-stub">
            <button type="button" data-testid="stub-mark-invalid" onClick={() => props.onValidationChange(false)}>mark invalid</button>
            <button type="button" data-testid="stub-mark-valid" onClick={() => props.onValidationChange(true)}>mark valid</button>
            <button
                type="button"
                data-testid="stub-set-busy"
                onClick={() =>
                    props.onBusySlotsChange([
                        { start: "2099-06-20T05:00:00", end: "2099-06-20T06:00:00" },
                    ])
                }
            >
                set busy
            </button>
        </div>
    ),
}));
vi.mock("../../../../../features/mentor/view/components/dashboard/availability/TimezoneDurationSection", () => ({
    default: () => <div data-testid="timezone-duration-section-stub" />,
}));

vi.mock("../../../../../features/mentor/view/components/dashboard/availability/IntegrationsSection", () => ({
    default: (props) => (
        <div data-testid="integrations-section-stub">
            <button
                type="button"
                data-testid="stub-connect"
                onClick={() => props.onConnectionChange(true)}
            >
                connect
            </button>
        </div>
    ),
}));

describe("AvailabilityTab Component Suite", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseAvailabilityReturn.availability = {
            specificDates: [],
            timezone: "Asia/Kolkata",
            sessionDurations: [30, 60],
            googleCalendarConnected: false,
        };
        mockUseAvailabilityReturn.loading = false;
        mockUseAvailabilityReturn.saving = false;
        mockUseAvailabilityReturn.msg = { type: "", text: "" };
        mockUseAvailability.mockReturnValue(mockUseAvailabilityReturn);
    });

    it("should show a loading state and skip rendering sections when loading is true", () => {
        mockUseAvailabilityReturn.loading = true;
        render(<AvailabilityTab />);
        expect(screen.getByText("Loading availability...")).toBeInTheDocument();
        expect(screen.queryByTestId("calendar-availability-section-stub")).not.toBeInTheDocument();
    });

    it("should render the header, all sections, and footer note once loaded", () => {
        render(<AvailabilityTab />);
        expect(screen.getByText("Availability Settings")).toBeInTheDocument();
        expect(screen.getByTestId("calendar-availability-section-stub")).toBeInTheDocument();
        expect(screen.getByTestId("timezone-duration-section-stub")).toBeInTheDocument();
        expect(screen.getByTestId("integrations-section-stub")).toBeInTheDocument();
        expect(
            screen.getByText("Changes are saved to your profile and visible to mentees immediately."),
        ).toBeInTheDocument();
    });

    it("should render a success message styled distinctly from an error message", () => {
        mockUseAvailabilityReturn.msg = { type: "success", text: "Saved!" };
        const { rerender } = render(<AvailabilityTab />);
        expect(screen.getByText("Saved!")).toBeInTheDocument();

        mockUseAvailabilityReturn.msg = { type: "error", text: "Something broke" };
        rerender(<AvailabilityTab />);
        expect(screen.getByText("Something broke")).toBeInTheDocument();
    });

    it("should call saveAvailability directly on Save when there are no busy conflicts", () => {
        render(<AvailabilityTab />);
        fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
        expect(mockUseAvailabilityReturn.saveAvailability).toHaveBeenCalled();
    });

    it("should not call saveAvailability when isAvailabilityValid is false", () => {
        render(<AvailabilityTab />);
        fireEvent.click(screen.getByTestId("stub-mark-invalid"));
        fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
        expect(mockUseAvailabilityReturn.saveAvailability).not.toHaveBeenCalled();
    });

    it("should disable the Save button while saving", () => {
        mockUseAvailabilityReturn.saving = true;
        render(<AvailabilityTab />);
        expect(screen.getByRole("button", { name: /Saving/i })).toBeDisabled();
    });

    it("should call cancelChanges when Cancel is clicked", () => {
        render(<AvailabilityTab />);
        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(mockUseAvailabilityReturn.cancelChanges).toHaveBeenCalled();
    });

    it("should show the busy conflict modal instead of saving immediately when a future date slot overlaps a busy slot", () => {
        mockUseAvailabilityReturn.availability = {
            ...mockUseAvailabilityReturn.availability,
            specificDates: [
                {
                    date: "2099-06-20",
                    slots: [{ id: "s1", startTime: "05:30", endTime: "06:30" }],
                },
            ],
        };
        render(<AvailabilityTab />);

        fireEvent.click(screen.getByTestId("stub-set-busy"));
        fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

        expect(screen.getByText("Busy Time Conflict")).toBeInTheDocument();
        expect(mockUseAvailabilityReturn.saveAvailability).not.toHaveBeenCalled();
    });

    it("should save anyway and close the modal when the user confirms the conflict", () => {
        mockUseAvailabilityReturn.availability = {
            ...mockUseAvailabilityReturn.availability,
            specificDates: [
                {
                    date: "2099-06-20",
                    slots: [{ id: "s1", startTime: "05:30", endTime: "06:30" }],
                },
            ],
        };
        render(<AvailabilityTab />);
        fireEvent.click(screen.getByTestId("stub-set-busy"));
        fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

        fireEvent.click(screen.getByRole("button", { name: "Yes, Save Anyway" }));
        expect(mockUseAvailabilityReturn.saveAvailability).toHaveBeenCalled();
        expect(screen.queryByText("Busy Time Conflict")).not.toBeInTheDocument();
    });

    it("should dismiss the modal without saving when the user cancels the conflict", () => {
        mockUseAvailabilityReturn.availability = {
            ...mockUseAvailabilityReturn.availability,
            specificDates: [
                {
                    date: "2099-06-20",
                    slots: [{ id: "s1", startTime: "05:30", endTime: "06:30" }],
                },
            ],
        };
        render(<AvailabilityTab />);
        fireEvent.click(screen.getByTestId("stub-set-busy"));
        fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

        fireEvent.click(screen.getByRole("button", { name: "Go Back & Edit" }));
        expect(mockUseAvailabilityReturn.saveAvailability).not.toHaveBeenCalled();
        expect(screen.queryByText("Busy Time Conflict")).not.toBeInTheDocument();
    });

    it("should update availability.googleCalendarConnected via setAvailability when the integration connects", () => {
        render(<AvailabilityTab />);
        fireEvent.click(screen.getByTestId("stub-connect"));
        expect(mockUseAvailabilityReturn.setAvailability).toHaveBeenCalledWith(
            expect.any(Function),
        );
        const updater = mockUseAvailabilityReturn.setAvailability.mock.calls[0][0];
        expect(updater({ googleCalendarConnected: false })).toEqual({
            googleCalendarConnected: true,
        });
    });
});