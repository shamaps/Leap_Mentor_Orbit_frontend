// src/test/components/mentor/dashboard/availability/TimezoneDurationSection.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TimezoneDurationSection from "../../../../../components/mentor/dashboard/availability/TimezoneDurationSection";

describe("TimezoneDurationSection Component Suite", () => {
    let updateTimezone;
    let toggleDuration;

    beforeEach(() => {
        updateTimezone = vi.fn();
        toggleDuration = vi.fn();
    });

    const setup = (props = {}) =>
        render(
            <TimezoneDurationSection
                timezone="Asia/Kolkata"
                sessionDurations={[30, 60]}
                updateTimezone={updateTimezone}
                toggleDuration={toggleDuration}
                {...props}
            />,
        );

    it("should render the section heading", () => {
        setup();
        expect(screen.getByText("Timezone & Duration")).toBeInTheDocument();
    });

    it("should render the timezone select with the current value selected", () => {
        setup();
        const select = screen.getByLabelText("Timezone");
        expect(select).toHaveValue("Asia/Kolkata");
    });

    it("should render all timezone options", () => {
        setup();
        const select = screen.getByLabelText("Timezone");
        // Spot-check a few, not all 15, to keep the test resilient to list edits
        expect(select).toHaveTextContent("Asia/Kolkata");
        expect(select).toHaveTextContent("America/New_York".replace("_", " "));
        expect(select).toHaveTextContent("Pacific/Auckland");
    });

    it("should call updateTimezone with the new value when the select changes", () => {
        setup();
        const select = screen.getByLabelText("Timezone");
        fireEvent.change(select, { target: { value: "Europe/London" } });
        expect(updateTimezone).toHaveBeenCalledWith("Europe/London");
    });

    it("should render all duration options as buttons", () => {
        setup();
        expect(screen.getByRole("button", { name: "30 min" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "45 min" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "60 min" })).toBeInTheDocument();
    });

    it("should visually mark durations included in sessionDurations as selected", () => {
        setup({ sessionDurations: [30] });
        const selectedBtn = screen.getByRole("button", { name: "30 min" });
        const unselectedBtn = screen.getByRole("button", { name: "45 min" });
        expect(selectedBtn.className).toContain("bg-blue-900");
        expect(unselectedBtn.className).not.toContain("bg-blue-900");
    });

    it("should call toggleDuration with the correct value when a duration button is clicked", () => {
        setup();
        fireEvent.click(screen.getByRole("button", { name: "45 min" }));
        expect(toggleDuration).toHaveBeenCalledWith(45);
    });

    it("should render the helper text under the duration options", () => {
        setup();
        expect(
            screen.getByText("Select the session lengths you want to offer mentees."),
        ).toBeInTheDocument();
    });
});