// src/test/components/mentor/dashboard/availability/CalendarAvailabilitySection.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CalendarAvailabilitySection from "../../../../../features/mentor/view/components/dashboard/availability/CalendarAvailabilitySection";

const { mockAxiosGet, mockLoggerError } = vi.hoisted(() => ({
    mockAxiosGet: vi.fn(),
    mockLoggerError: vi.fn(),
}));

vi.mock("../../../../../shared/utils/axiosInstance", () => ({
    default: { get: mockAxiosGet },
}));

vi.mock("../../../../../shared/utils/logger", () => ({
    default: { error: mockLoggerError },
}));

// Fix "today" so past/future date logic and month labels are deterministic.
const FIXED_NOW = new Date("2099-06-15T10:00:00.000Z");

describe("CalendarAvailabilitySection Component Suite", () => {
    let setSpecificDates;
    let onBusySlotsChange;
    let onValidationChange;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        vi.setSystemTime(FIXED_NOW);
        mockAxiosGet.mockResolvedValue({ data: { busy: [], events: [] } });
        setSpecificDates = vi.fn();
        onBusySlotsChange = vi.fn();
        onValidationChange = vi.fn();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const setup = (props = {}) =>
        render(
            <CalendarAvailabilitySection
                specificDates={[]}
                setSpecificDates={setSpecificDates}
                googleCalendarConnected={false}
                onBusySlotsChange={onBusySlotsChange}
                sessionDurations={[30, 60]}
                onValidationChange={onValidationChange}
                {...props}
            />,
        );

    it("should render the current month and year in the calendar header", () => {
        setup();
        expect(screen.getByText("June 2099")).toBeInTheDocument();
    });

    it("should show the empty state when there are no future selected dates", () => {
        setup();
        expect(screen.getByText("No dates selected")).toBeInTheDocument();
    });

    it("should call setSpecificDates to add a date when a future calendar day is clicked", () => {
        setup();
        // June 20, 2099 is in-month and in the future relative to FIXED_NOW
        const dayButton = screen.getByRole("button", { name: /^20$/ });
        fireEvent.click(dayButton);
        expect(setSpecificDates).toHaveBeenCalledWith(expect.any(Function));
        const updater = setSpecificDates.mock.calls[0][0];
        const result = updater([]);
        expect(result).toEqual([
            expect.objectContaining({
                date: "2099-06-20",
                slots: [expect.objectContaining({ startTime: "09:00", endTime: "17:00" })],
            }),
        ]);
    });

    it("should not toggle a past date when clicked", () => {
        setup();
        // June 1, 2099 is before the fixed 'today' of June 15
        const pastButton = screen.getByRole("button", { name: /^1$/ });
        expect(pastButton).toBeDisabled();
        fireEvent.click(pastButton);
        expect(setSpecificDates).not.toHaveBeenCalled();
    });

    it("should navigate forward and backward across month boundaries", () => {
        setup();
        const [prevBtn, nextBtn] = screen.getAllByRole("button").filter((b) =>
            b.querySelector("svg polyline"),
        );
        fireEvent.click(nextBtn);
        expect(screen.getByText("July 2099")).toBeInTheDocument();
        fireEvent.click(prevBtn);
        fireEvent.click(prevBtn);
        expect(screen.getByText("May 2099")).toBeInTheDocument();
    });

    it("should render selected future dates in the slot editor list", () => {
        setup({
            specificDates: [
                {
                    date: "2099-06-20",
                    slots: [{ id: "s1", startTime: "09:00", endTime: "17:00" }],
                },
            ],
        });
        expect(screen.getByText("1 date selected")).toBeInTheDocument();
    });

    it("should call setSpecificDates with an empty array when 'Clear all' is clicked", () => {
        setup({
            specificDates: [
                {
                    date: "2099-06-20",
                    slots: [{ id: "s1", startTime: "09:00", endTime: "17:00" }],
                },
            ],
        });
        fireEvent.click(screen.getByRole("button", { name: /Clear all/i }));
        expect(setSpecificDates).toHaveBeenCalledWith([]);
    });

    it("should call setSpecificDates to remove a date when Remove is clicked", () => {
        setup({
            specificDates: [
                {
                    date: "2099-06-20",
                    slots: [{ id: "s1", startTime: "09:00", endTime: "17:00" }],
                },
            ],
        });
        fireEvent.click(screen.getByRole("button", { name: /Remove/i }));
        const updater = setSpecificDates.mock.calls[0][0];
        expect(
            updater([{ date: "2099-06-20", slots: [] }]),
        ).toEqual([]);
    });

    it("should call setSpecificDates to add a new slot when 'Add slot' is clicked", () => {
        setup({
            specificDates: [
                {
                    date: "2099-06-20",
                    slots: [{ id: "s1", startTime: "09:00", endTime: "17:00" }],
                },
            ],
        });
        fireEvent.click(screen.getByRole("button", { name: /Add slot/i }));
        const updater = setSpecificDates.mock.calls[0][0];
        const result = updater([
            { date: "2099-06-20", slots: [{ id: "s1", startTime: "09:00", endTime: "17:00" }] },
        ]);
        expect(result[0].slots).toHaveLength(2);
    });

    it("should show a remove-slot button only when a date has more than one slot", () => {
        const { rerender } = setup({
            specificDates: [
                {
                    date: "2099-06-20",
                    slots: [{ id: "s1", startTime: "09:00", endTime: "17:00" }],
                },
            ],
        });
        expect(screen.queryByTitle("Remove this slot")).not.toBeInTheDocument();

        rerender(
            <CalendarAvailabilitySection
                specificDates={[
                    {
                        date: "2099-06-20",
                        slots: [
                            { id: "s1", startTime: "09:00", endTime: "12:00" },
                            { id: "s2", startTime: "13:00", endTime: "17:00" },
                        ],
                    },
                ]}
                setSpecificDates={setSpecificDates}
                googleCalendarConnected={false}
                onBusySlotsChange={onBusySlotsChange}
                sessionDurations={[30, 60]}
                onValidationChange={onValidationChange}
            />,
        );
        expect(screen.getAllByTitle("Remove this slot")).toHaveLength(2);
    });

    it("should call onValidationChange(false) when a slot's end time is not after its start time", () => {
        setup({
            specificDates: [
                {
                    date: "2099-06-20",
                    slots: [{ id: "s1", startTime: "10:00", endTime: "10:00" }],
                },
            ],
        });
        expect(onValidationChange).toHaveBeenCalledWith(false);
        expect(screen.getByText("Start and end time cannot be the same")).toBeInTheDocument();
    });

    it("should call onValidationChange(false) with a minimum-duration message for too-short slots", () => {
        setup({
            specificDates: [
                {
                    date: "2099-06-20",
                    slots: [{ id: "s1", startTime: "10:00", endTime: "10:10" }],
                },
            ],
            sessionDurations: [30],
        });
        expect(onValidationChange).toHaveBeenCalledWith(false);
        expect(screen.getByText("Minimum slot duration is 30 min")).toBeInTheDocument();
    });

    it("should call onValidationChange(true) when all slots are valid", () => {
        setup({
            specificDates: [
                {
                    date: "2099-06-20",
                    slots: [{ id: "s1", startTime: "09:00", endTime: "17:00" }],
                },
            ],
        });
        expect(onValidationChange).toHaveBeenCalledWith(true);
    });

    it("should not fetch busy slots or events when googleCalendarConnected is false", async () => {
        setup({ googleCalendarConnected: false });
        await vi.waitFor(() => {
            expect(mockAxiosGet).not.toHaveBeenCalled();
        });
    });

    it("should fetch busy slots and events and show the synced banner when connected", async () => {
        mockAxiosGet.mockImplementation((url) => {
            if (url.includes("busy")) {
                return Promise.resolve({
                    data: { busy: [{ start: "2099-06-20T05:00:00.000Z", end: "2099-06-20T06:00:00.000Z" }] },
                });
            }
            return Promise.resolve({ data: { events: [] } });
        });
        setup({ googleCalendarConnected: true });

        expect(
            screen.getByText("Google Calendar synced — hover dates to see events"),
        ).toBeInTheDocument();

        await vi.waitFor(() => expect(onBusySlotsChange).toHaveBeenCalled());
        expect(mockAxiosGet).toHaveBeenCalledWith(
            "/google-calendar/busy",
            expect.objectContaining({ params: expect.any(Object) }),
        );
        expect(mockAxiosGet).toHaveBeenCalledWith(
            "/google-calendar/events",
            expect.objectContaining({ params: expect.any(Object) }),
        );
    });
    // ─── Additional tests: TimePicker widget ───────────────────────────────────
    describe("CalendarAvailabilitySection — TimePicker interactions", () => {
        let setSpecificDates, onBusySlotsChange, onValidationChange;

        beforeEach(() => {
            vi.clearAllMocks();
            vi.useFakeTimers();
            vi.setSystemTime(FIXED_NOW);
            mockAxiosGet.mockResolvedValue({ data: { busy: [], events: [] } });
            setSpecificDates = vi.fn();
            onBusySlotsChange = vi.fn();
            onValidationChange = vi.fn();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        const setupWithSlot = (slotOverrides = {}) =>
            render(
                <CalendarAvailabilitySection
                    specificDates={[
                        {
                            date: "2099-06-20",
                            slots: [{ id: "s1", startTime: "09:00", endTime: "17:00", ...slotOverrides }],
                        },
                    ]}
                    setSpecificDates={setSpecificDates}
                    googleCalendarConnected={false}
                    onBusySlotsChange={onBusySlotsChange}
                    sessionDurations={[30, 60]}
                    onValidationChange={onValidationChange}
                />,
            );

        it("should display the formatted time value in the TimePicker input", () => {
            setupWithSlot();
            const inputs = screen.getAllByPlaceholderText("09:00 AM");
            expect(inputs[0]).toHaveValue("09:00 AM");
            expect(inputs[1]).toHaveValue("05:00 PM");
        });

        it("should open the dropdown when the clock button is clicked and select an hour/min/period", () => {
            setupWithSlot();
            const firstWrapper = screen.getAllByPlaceholderText("09:00 AM")[0].closest("div");
            const trigger = firstWrapper.querySelector("button");
            fireEvent.click(trigger);

            const hourButtons = screen.getAllByRole("button", { name: "10" });
            const hourOption = hourButtons.find((b) => !b.disabled);
            fireEvent.click(hourOption);

            const updater = setSpecificDates.mock.calls.at(-1)[0];
            const result = updater([
                { date: "2099-06-20", slots: [{ id: "s1", startTime: "09:00", endTime: "17:00" }] },
            ]);
            expect(result[0].slots[0].startTime).toBe("10:00");
        });

        it("should parse a manually typed valid time on blur", () => {
            setupWithSlot();
            const input = screen.getAllByPlaceholderText("09:00 AM")[0];
            fireEvent.focus(input);
            fireEvent.change(input, { target: { value: "2:30 pm" } });
            fireEvent.blur(input);

            const updater = setSpecificDates.mock.calls.at(-1)[0];
            const result = updater([
                { date: "2099-06-20", slots: [{ id: "s1", startTime: "09:00", endTime: "17:00" }] },
            ]);
            expect(result[0].slots[0].startTime).toBe("14:30");
        });

        it("should revert to the previous value on blur when typed input is invalid", () => {
            setupWithSlot();
            const input = screen.getAllByPlaceholderText("09:00 AM")[0];
            fireEvent.focus(input);
            fireEvent.change(input, { target: { value: "not a time" } });
            fireEvent.blur(input);

            expect(setSpecificDates).not.toHaveBeenCalled();
            expect(input).toHaveValue("09:00 AM");
        });
        it("should commit on Enter key and blur the input", () => {
            setupWithSlot();
            const input = screen.getAllByPlaceholderText("09:00 AM")[0];
            fireEvent.focus(input);
            fireEvent.change(input, { target: { value: "8:00 am" } });
            fireEvent.keyDown(input, { key: "Enter" });
            fireEvent.blur(input);

            const updater = setSpecificDates.mock.calls.at(-1)[0];
            const result = updater([
                { date: "2099-06-20", slots: [{ id: "s1", startTime: "09:00", endTime: "17:00" }] },
            ]);
            expect(result[0].slots[0].startTime).toBe("08:00");
        });

        it("should cancel editing on Escape key without committing", () => {
            setupWithSlot();
            const input = screen.getAllByPlaceholderText("09:00 AM")[0];
            fireEvent.focus(input);
            fireEvent.change(input, { target: { value: "invalid" } });
            fireEvent.keyDown(input, { key: "Escape" });

            expect(setSpecificDates).not.toHaveBeenCalled();
        });
        it("should close the dropdown when clicking outside", () => {
            setupWithSlot();
            const firstWrapper = screen.getAllByPlaceholderText("09:00 AM")[0].closest("div");
            const trigger = firstWrapper.querySelector("button");
            fireEvent.click(trigger);

            const hourButtons = screen.getAllByRole("button", { name: "10" });
            const dropdownHourOption = hourButtons.find((b) => !b.disabled);
            expect(dropdownHourOption).toBeInTheDocument();

            fireEvent.mouseDown(document.body);

            const hourButtonsAfterClose = screen.queryAllByRole("button", { name: "10" });
            // Only the disabled calendar-grid day cell should remain; the dropdown's "10" option is gone
            const openDropdownOption = hourButtonsAfterClose.find((b) => !b.disabled);
            expect(openDropdownOption).toBeUndefined();
        });

        it("should auto-adjust end time when start time is moved past it", () => {
            setupWithSlot({ endTime: "09:30" });
            const input = screen.getAllByPlaceholderText("09:00 AM")[0];
            fireEvent.focus(input);
            fireEvent.change(input, { target: { value: "10:00 am" } });
            fireEvent.blur(input);

            const calls = setSpecificDates.mock.calls;
            expect(calls.length).toBeGreaterThanOrEqual(2);

            const endUpdater = calls.at(-1)[0];
            const result = endUpdater([
                { date: "2099-06-20", slots: [{ id: "s1", startTime: "10:00", endTime: "09:30" }] },
            ]);
            expect(result[0].slots[0].endTime).toBe("10:30"); // 10:00 + minDuration(30)
        });
    });


    describe("CalendarAvailabilitySection — busy overlap badge", () => {
        let setSpecificDates, onBusySlotsChange, onValidationChange;

        beforeEach(() => {
            vi.clearAllMocks();
            vi.useFakeTimers();
            vi.setSystemTime(FIXED_NOW);
            setSpecificDates = vi.fn();
            onBusySlotsChange = vi.fn();
            onValidationChange = vi.fn();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it("should render a Busy badge when a slot overlaps a fetched busy window", async () => {
            mockAxiosGet.mockImplementation((url) => {
                if (url.includes("busy")) {
                    return Promise.resolve({
                        data: {
                            busy: [
                                {
                                    start: "2099-06-20T04:00:00.000Z", // 09:30 IST-ish depending on TZ, adjust if needed
                                    end: "2099-06-20T05:00:00.000Z",
                                },
                            ],
                        },
                    });
                }
                return Promise.resolve({ data: { events: [] } });
            });

            render(
                <CalendarAvailabilitySection
                    specificDates={[
                        {
                            date: "2099-06-20",
                            slots: [{ id: "s1", startTime: "00:00", endTime: "23:59" }],
                        },
                    ]}
                    setSpecificDates={setSpecificDates}
                    googleCalendarConnected={true}
                    onBusySlotsChange={onBusySlotsChange}
                    sessionDurations={[30, 60]}
                    onValidationChange={onValidationChange}
                />,
            );

            await vi.waitFor(() => expect(onBusySlotsChange).toHaveBeenCalled());
            expect(screen.getByText(/Busy/)).toBeInTheDocument();
        });
    });
    it("should log an error when fetching busy slots fails", async () => {
        mockAxiosGet.mockImplementation((url) => {
            if (url.includes("busy")) return Promise.reject(new Error("busy fetch fail"));
            return Promise.resolve({ data: { events: [] } });
        });
        setup({ googleCalendarConnected: true });

        await vi.waitFor(() =>
            expect(mockLoggerError).toHaveBeenCalledWith(
                "Failed to fetch busy slots:",
                expect.objectContaining({ err: expect.any(Error) }),
            ),
        );
    });

    it("should log an error when fetching calendar events fails", async () => {
        mockAxiosGet.mockImplementation((url) => {
            if (url.includes("events")) return Promise.reject(new Error("events fetch fail"));
            return Promise.resolve({ data: { busy: [] } });
        });
        setup({ googleCalendarConnected: true });

        await vi.waitFor(() =>
            expect(mockLoggerError).toHaveBeenCalledWith(
                "Failed to fetch events:",
                expect.objectContaining({ err: expect.any(Error) }),
            ),
        );
    });
});