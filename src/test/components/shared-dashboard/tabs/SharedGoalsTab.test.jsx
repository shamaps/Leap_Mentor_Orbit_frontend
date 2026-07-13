import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import React from "react";
import SharedGoalsTab from "../../../../components/shared-dashboard/tabs/SharedGoalsTab";
import useGoals from "../../../../hooks/useGoals";
import useSessions from "../../../../hooks/useSessions";
import useReport from "../../../../hooks/useReport";
import { useSelector } from "react-redux";

// ── Mock Redux Selector Layer ──
vi.mock("react-redux", () => ({
    useSelector: vi.fn(),
}));

// ── Mock Subcomponent Modules ──
vi.mock("../../../../components/shared-dashboard/tabs/goals/GoalForm", () => ({
    default: ({ onSave, onCancel }) => (
        <div data-testid="mock-goal-form">
            <button onClick={() => onSave({ title: "New Goal Title" })}>Save Goal</button>
            <button onClick={onCancel}>Cancel Goal</button>
        </div>
    ),
}));

vi.mock("../../../../components/shared-dashboard/tabs/goals/TimelineTracker", () => ({
    default: () => <div data-testid="mock-timeline-tracker">Timeline</div>,
}));

vi.mock("../../../../components/shared-dashboard/tabs/goals/MilestoneList", () => ({
    default: ({ onAdd, onToggle, onDelete }) => (
        <div data-testid="mock-milestone-list">
            <button onClick={() => onAdd("New Milestone")}>Add Milestone</button>
            <button onClick={() => onToggle("m-1")}>Toggle Milestone</button>
            <button onClick={() => onDelete("m-1")}>Delete Milestone</button>
        </div>
    ),
}));

vi.mock("../../../../components/shared-dashboard/tabs/goals/SessionCard", () => ({
    default: ({ onSessionComplete }) => (
        <div data-testid="mock-session-card">
            <button onClick={() => onSessionComplete(2)}>Complete Session Slot 2</button>
        </div>
    ),
}));

vi.mock("../../../../components/shared-dashboard/tabs/FeedbackModal", () => ({
    default: ({ onClose, onFeedbackSubmitted }) => (
        <div data-testid="mock-feedback-modal">
            <button onClick={onClose}>Close Feedback</button>
            <button onClick={onFeedbackSubmitted}>Submit Feedback From Modal</button>
        </div>
    ),
}));

// ── Mock Custom Hooks ──
vi.mock("../../../../hooks/useGoals", () => ({ default: vi.fn() }));
vi.mock("../../../../hooks/useSessions", () => ({ default: vi.fn() }));
vi.mock("../../../../hooks/useReport", () => ({ default: vi.fn() }));

describe("SharedGoalsTab Component Suite", () => {
    const mockConnect = {
        _id: "conn-123",
        viewerRole: "mentee",
        mentor: { name: "Sarah Mentor" },
        mentee: { name: "Bob Mentee" },
    };

    const mockCreateGoal = vi.fn(() => Promise.resolve({ success: true }));
    const mockUpdateGoal = vi.fn(() => Promise.resolve({ success: true }));
    const mockAddMilestone = vi.fn();
    const mockToggleMilestone = vi.fn();
    const mockDeleteMilestone = vi.fn();
    const mockRefetchFeedback = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
        useSelector.mockReturnValue(mockConnect);

        useGoals.mockReturnValue({
            goal: null,
            milestones: [],
            loading: false,
            error: null,
            saving: false,
            createGoal: mockCreateGoal,
            updateGoal: mockUpdateGoal,
            addMilestone: mockAddMilestone,
            toggleMilestone: mockToggleMilestone,
            deleteMilestone: mockDeleteMilestone,
        });

        useSessions.mockReturnValue({
            slots: [],
            loading: false,
            savingSlots: false,
            error: null,
            completedSlots: 0,
            totalSlots: 0,
            progress: 0,
            setMeetingLink: vi.fn(),
            markSlotComplete: vi.fn(),
            cancelSlot: vi.fn(),
            rescheduleSlot: vi.fn(),
        });

        useReport.mockReturnValue({
            myFeedback: null,
            loading: false,
            refetch: mockRefetchFeedback,
        });
    });

    describe("Loading Boundary States", () => {
        it("should render LoadingSkeleton layout fields when loading state reports true", () => {
            useGoals.mockReturnValueOnce({ loading: true });
            const { container } = render(<SharedGoalsTab />);
            expect(container.querySelectorAll(".animate-pulse")).toHaveLength(3);
        });
    });

    describe("Error Indicators", () => {
        it("should mount an error banner block when hooks return validation exception texts", () => {
            useGoals.mockReturnValueOnce({ error: "Goals API Refusal Error" });
            render(<SharedGoalsTab />);
            expect(screen.getByText("Goals API Refusal Error")).toBeInTheDocument();
        });
    });

    describe("No Goal Empty State & Role Evaluation", () => {
        it("should display NoGoalState when there is no goal and determine the other person's name", () => {
            const { unmount } = render(<SharedGoalsTab />);
            expect(screen.getByText("No goal set yet")).toBeInTheDocument();
            unmount();

            // Switch role to mentor for fallback logic checks
            useSelector.mockReturnValueOnce({ ...mockConnect, viewerRole: "mentor" });
            render(<SharedGoalsTab />);
            expect(screen.getByText("No goal set yet")).toBeInTheDocument();
        });

        it("should switch to GoalForm view when clicking the Set Goal button", () => {
            render(<SharedGoalsTab />);
            fireEvent.click(screen.getByText("Set Goal"));
            expect(screen.getByTestId("mock-goal-form")).toBeInTheDocument();

            fireEvent.click(screen.getByText("Cancel Goal"));
            expect(screen.queryByTestId("mock-goal-form")).not.toBeInTheDocument();
        });

        it("should submit new created goal updates cleanly through createGoal hooks", async () => {
            render(<SharedGoalsTab />);
            fireEvent.click(screen.getByText("Set Goal"));

            await act(async () => {
                fireEvent.click(screen.getByText("Save Goal"));
            });
            expect(mockCreateGoal).toHaveBeenCalledWith({ title: "New Goal Title" });
        });
    });

    describe("Goal Card Status Branches & Milestones Interactions", () => {
        const activeGoal = { _id: "g-1", title: "Learn Vitest", description: "Master full code coverage", status: "active" };
        const completedGoal = { _id: "g-2", title: "Learn Vitest", status: "completed" };
        const abandonedGoal = { _id: "g-3", title: "Learn Vitest", status: "abandoned" };

        const getBaseHookMocks = (goalObj) => ({
            goal: goalObj,
            milestones: [],
            loading: false,
            error: null,
            saving: false,
            createGoal: mockCreateGoal,
            updateGoal: mockUpdateGoal,
            addMilestone: mockAddMilestone,
            toggleMilestone: mockToggleMilestone,
            deleteMilestone: mockDeleteMilestone,
        });

        it("should evaluate dynamic CSS wrapper color matrices for all distinct goal statuses", () => {
            const { rerender } = render(<SharedGoalsTab />);

            useGoals.mockReturnValue(getBaseHookMocks(activeGoal));
            rerender(<SharedGoalsTab />);
            expect(screen.getByText("active")).toHaveClass("bg-violet-50");

            useGoals.mockReturnValue(getBaseHookMocks(completedGoal));
            rerender(<SharedGoalsTab />);
            expect(screen.getByText("completed")).toHaveClass("bg-green-50");

            useGoals.mockReturnValue(getBaseHookMocks(abandonedGoal));
            rerender(<SharedGoalsTab />);
            expect(screen.getByText("abandoned")).toHaveClass("bg-red-50");
        });

        it("should support entering editing mode on an existing goal and submitting changes via updateGoal", async () => {
            useGoals.mockReturnValue(getBaseHookMocks(activeGoal));
            render(<SharedGoalsTab />);

            fireEvent.click(screen.getByText("Edit"));
            expect(screen.getByTestId("mock-goal-form")).toBeInTheDocument();

            await act(async () => {
                fireEvent.click(screen.getByText("Save Goal"));
            });
            expect(mockUpdateGoal).toHaveBeenCalledWith("g-1", { title: "New Goal Title" });
        });

        it("should forward milestone action flows to parent hook mapping targets flawlessly", () => {
            useGoals.mockReturnValue(getBaseHookMocks(activeGoal));
            render(<SharedGoalsTab />);

            fireEvent.click(screen.getByText("Add Milestone"));
            expect(mockAddMilestone).toHaveBeenCalledWith("New Milestone");

            fireEvent.click(screen.getByText("Toggle Milestone"));
            expect(mockToggleMilestone).toHaveBeenCalledWith("m-1");

            fireEvent.click(screen.getByText("Delete Milestone"));
            expect(mockDeleteMilestone).toHaveBeenCalledWith("m-1");
        });
    });

    describe("Overall Progress & Timeouts Evaluation", () => {
        const activeGoal = { _id: "g-1", title: "Test Goal", status: "completed" };

        const getBaseHookMocks = () => ({
            goal: activeGoal,
            milestones: [],
            loading: false,
            error: null,
            saving: false,
            createGoal: mockCreateGoal,
            updateGoal: mockUpdateGoal,
            addMilestone: mockAddMilestone,
            toggleMilestone: mockToggleMilestone,
            deleteMilestone: mockDeleteMilestone,
        });

        it("should display progress updates when slots array is populated and handle leave feedback paths", () => {
            useGoals.mockReturnValue(getBaseHookMocks());
            useSessions.mockReturnValue({
                slots: [{ date: "2026-07-12", startTime: "10:00", status: "active" }],
                completedSlots: 1,
                totalSlots: 1,
                progress: 100,
            });

            render(<SharedGoalsTab />);
            expect(screen.getByText("Overall Session Progress")).toBeInTheDocument();
            expect(screen.getByText("All sessions complete")).toBeInTheDocument();

            fireEvent.click(screen.getByText("Leave Feedback"));
            expect(screen.getByTestId("mock-feedback-modal")).toBeInTheDocument();
        });

        it("should surface secondary notice layers if reviews have already been submitted", async () => {
            vi.useFakeTimers();
            useGoals.mockReturnValue(getBaseHookMocks());
            useSessions.mockReturnValue({
                slots: [{ date: "2026-07-12", startTime: "10:00", status: "active" }],
                completedSlots: 1,
                totalSlots: 1,
                progress: 100,
            });
            useReport.mockReturnValue({ myFeedback: { rating: 5 }, loading: false, refetch: mockRefetchFeedback });

            render(<SharedGoalsTab />);

            const submitBtn = screen.getByText("Feedback Submitted");
            fireEvent.click(submitBtn);

            expect(screen.getByText("You've already submitted feedback for this session")).toBeInTheDocument();

            act(() => {
                vi.advanceTimersByTime(3000);
            });

            expect(screen.queryByText("You've already submitted feedback for this session")).not.toBeInTheDocument();
            vi.useRealTimers();
        });
    });

    describe("Session Cards Complete Intercept Cycles", () => {
        it("should correctly handle asynchronous session completion thunks using fake timers", async () => {
            vi.useFakeTimers();
            useGoals.mockReturnValue({
                goal: { _id: "g-1", title: "Test Goal", status: "active" },
                milestones: [],
                loading: false,
                error: null,
                saving: false,
                createGoal: mockCreateGoal,
                updateGoal: mockUpdateGoal,
                addMilestone: mockAddMilestone,
                toggleMilestone: mockToggleMilestone,
                deleteMilestone: mockDeleteMilestone,
            });
            useSessions.mockReturnValue({
                slots: [{ date: "2026-07-12", startTime: "10:00", status: "active" }],
                completedSlots: 0,
                totalSlots: 1,
                progress: 0,
            });

            render(<SharedGoalsTab />);
            fireEvent.click(screen.getByText("Complete Session Slot 2"));

            act(() => {
                vi.advanceTimersByTime(1200);
            });

            expect(screen.getByTestId("mock-feedback-modal")).toBeInTheDocument();

            fireEvent.click(screen.getByText("Submit Feedback From Modal"));
            expect(mockRefetchFeedback).toHaveBeenCalled();
            expect(screen.queryByTestId("mock-feedback-modal")).not.toBeInTheDocument();

            vi.useRealTimers();
        });
    });
});