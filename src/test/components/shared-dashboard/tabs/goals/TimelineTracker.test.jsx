import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import React from "react";
import TimelineTracker from "../../../../../features/shared-dashboard/view/components/tabs/goals/TimelineTracker";

describe("TimelineTracker Component Suite", () => {
    const mockUpdate = vi.fn();

    // Enforce matching local time components explicitly to eliminate environment offset calculations
    const baseGoalWithTimeline = {
        _id: "g-99",
        startDate: "2026-07-01",
        endDate: "2026-07-21",
    };

    const baseProps = {
        goal: baseGoalWithTimeline,
        viewerRole: "mentee",
        onUpdate: mockUpdate,
        saving: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Synchronize system test clock to absolute local midnight matching the date range math boundaries
        vi.setSystemTime(new Date("2026-07-11T00:00:00"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("Timeline Progress Visualization & Days Remaining Bounds", () => {
        it("should mount and plot proportional progress analytics text outputs cleanly", () => {
            render(<TimelineTracker {...baseProps} />);
            expect(screen.getByText("Jul 1, 2026")).toBeInTheDocument();
            expect(screen.getByText("Jul 21, 2026")).toBeInTheDocument();
            expect(screen.getByText(/50% through engagement/i)).toBeInTheDocument();
            expect(screen.getByText("10 days remaining")).toBeInTheDocument();
        });

        it("should display distinct color matrices if remaining values plunge below the critical overdue horizon", () => {
            vi.setSystemTime(new Date("2026-07-25T12:00:00"));
            render(<TimelineTracker {...baseProps} />);

            const overdueBadge = screen.getByText("Ended 4 days ago");
            expect(overdueBadge).toBeInTheDocument();
            expect(overdueBadge).toHaveClass("bg-red-50");
        });

        it("should present warning alert treatments if metrics sit under the single digit margin limit", () => {
            vi.setSystemTime(new Date("2026-07-16T12:00:00"));
            render(<TimelineTracker {...baseProps} />);

            const warningBadge = screen.getByText("5 days remaining");
            expect(warningBadge).toHaveClass("bg-orange-50");
        });

        it("should register absolute bounds values smoothly if today sits directly on target lines", () => {
            vi.setSystemTime(new Date("2026-07-21T08:00:00"));
            render(<TimelineTracker {...baseProps} />);
            expect(screen.getByText("Ends today")).toBeInTheDocument();
        });

        it("should handle alternative fallback text items when data objects contain blank variables", () => {
            render(<TimelineTracker {...baseProps} goal={{ ...baseGoalWithTimeline, startDate: "", endDate: "" }} />);
            expect(screen.getByText(/No timeline set. Click 'Set Timeline' to add dates./i)).toBeInTheDocument();
        });
    });

    describe("Editing Interactions Form Passages", () => {
        it("should intercept date constraint violations and display warning alerts within the container grid", async () => {
            render(<TimelineTracker {...baseProps} />);

            fireEvent.click(screen.getByRole("button", { name: "Edit" }));

            const startInput = screen.getByLabelText("Start Date");
            const endInput = screen.getByLabelText("End Date");

            fireEvent.change(startInput, { target: { value: "2026-07-15" } });
            fireEvent.change(endInput, { target: { value: "2026-07-10" } });

            fireEvent.click(screen.getByRole("button", { name: "Save" }));
            expect(screen.getByText("End date cannot be before start date")).toBeInTheDocument();
            expect(mockUpdate).not.toHaveBeenCalled();

            fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
            expect(screen.queryByLabelText("Start Date")).not.toBeInTheDocument();
        });

        it("should pass cleared parameters safely through the onUpdate wrapper callback link upon validation success", async () => {
            render(<TimelineTracker {...baseProps} />);

            fireEvent.click(screen.getByRole("button", { name: "Edit" }));

            fireEvent.change(screen.getByLabelText("Start Date"), { target: { value: "2026-07-05" } });
            fireEvent.change(screen.getByLabelText("End Date"), { target: { value: "2026-07-25" } });

            await act(async () => {
                fireEvent.click(screen.getByRole("button", { name: "Save" }));
            });

            expect(mockUpdate).toHaveBeenCalledWith("g-99", { startDate: "2026-07-05", endDate: "2026-07-25" });
        });
    });
});