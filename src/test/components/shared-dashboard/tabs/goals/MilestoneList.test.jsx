import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import React from "react";
import MilestoneList from "../../../../../features/shared-dashboard/view/components/tabs/goals/MilestoneList";

describe("MilestoneList Components Coverage Suite", () => {
    const mockGoal = { _id: "goal-101" };
    const mockAdd = vi.fn();
    const mockToggle = vi.fn();
    const mockDelete = vi.fn();

    const activeMilestonesCollection = [
        { _id: "m-1", title: "Complete System Authentication Architecture", isCompleted: false, dueDate: "2026-07-01" },
        { _id: "m-2", title: "Refactor Application State Trees", isCompleted: true, dueDate: "2026-07-20" },
        { _id: "m-3", title: "Deploy Continuous Integration Actions Pipeline", isCompleted: false, dueDate: "2026-09-30" }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        // Freeze system timeline explicitly on July 12, 2026 to systematically test relative date branches securely
        vi.setSystemTime(new Date("2026-07-12T12:00:00"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("Progress Tracker Analytics & Empty States", () => {
        it("should display a simple empty placeholder banner notice frame if milestone collection returns blank", () => {
            render(
                <MilestoneList
                    goal={mockGoal}
                    milestones={[]}
                    onAdd={mockAdd}
                    onToggle={mockToggle}
                    onDelete={mockDelete}
                />
            );

            expect(screen.getByText("No milestones yet")).toBeInTheDocument();
            expect(screen.getByText("Break your goal into smaller, checkable steps.")).toBeInTheDocument();
        });

        it("should print proper tracking counts and display specific completion notifications when all milestones finish", () => {
            const completedList = [
                { _id: "m-5", title: "Finished Task", isCompleted: true, dueDate: "" }
            ];

            render(
                <MilestoneList
                    goal={mockGoal}
                    milestones={completedList}
                    onAdd={mockAdd}
                    onToggle={mockToggle}
                    onDelete={mockDelete}
                />
            );

            expect(screen.getByText("1 / 1")).toBeInTheDocument();
            expect(screen.getByText("100%")).toBeInTheDocument();
            expect(screen.getByText("All milestones completed!")).toBeInTheDocument();
        });
    });

    describe("Add Milestone Interactive Forms Operations", () => {
        it("should drive element toggle visibilities, field changes, and support cancel updates smoothly", () => {
            render(
                <MilestoneList
                    goal={mockGoal}
                    milestones={[]}
                    onAdd={mockAdd}
                    onToggle={mockToggle}
                    onDelete={mockDelete}
                />
            );

            const addBtn = screen.getByRole("button", { name: /Add Milestone/i });
            fireEvent.click(addBtn);

            const textInput = screen.getByPlaceholderText("Milestone title...");
            expect(textInput).toBeInTheDocument();

            const submitBtn = screen.getByRole("button", { name: "Add" });
            expect(submitBtn).toBeDisabled();

            fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
            expect(screen.queryByPlaceholderText("Milestone title...")).not.toBeInTheDocument();
        });

        it("should process structural add functions when submissions activate via enter keyboard presses", async () => {
            mockAdd.mockResolvedValueOnce({ success: true });
            render(
                <MilestoneList
                    goal={mockGoal}
                    milestones={[]}
                    onAdd={mockAdd}
                    onToggle={mockToggle}
                    onDelete={mockDelete}
                />
            );

            fireEvent.click(screen.getByRole("button", { name: /Add Milestone/i }));
            const input = screen.getByPlaceholderText("Milestone title...");

            fireEvent.change(input, { target: { value: "Natively Injected Title String" } });

            //  Wrap keyboard submit state updates inside act to clear the stderr warnings[cite: 8]
            await act(async () => {
                fireEvent.keyDown(input, { key: "Enter" });
            });

            expect(mockAdd).toHaveBeenCalledWith(mockGoal._id, { title: "Natively Injected Title String" });
        });

        it("should execute addition pipelines when direct mouse click events fire on confirm buttons", async () => {
            mockAdd.mockResolvedValueOnce({ success: true });
            render(
                <MilestoneList
                    goal={mockGoal}
                    milestones={[]}
                    onAdd={mockAdd}
                    onToggle={mockToggle}
                    onDelete={mockDelete}
                    saving={false}
                />
            );

            fireEvent.click(screen.getByRole("button", { name: /Add Milestone/i }));
            fireEvent.change(screen.getByPlaceholderText("Milestone title..."), { target: { value: "Click Action Test" } });

            const addFormConfirmBtn = screen.getByRole("button", { name: "Add" });
            await act(async () => {
                fireEvent.click(addFormConfirmBtn);
            });

            expect(mockAdd).toHaveBeenCalledWith(mockGoal._id, { title: "Click Action Test" });
        });
    });

    describe("Milestone Rows Status Styles & Badges Matrix", () => {
        it("should correctly distinguish past timeline bounds and output Overdue tags beside matching text elements", () => {
            render(
                <MilestoneList
                    goal={mockGoal}
                    milestones={activeMilestonesCollection}
                    onAdd={mockAdd}
                    onToggle={mockToggle}
                    onDelete={mockDelete}
                />
            );

            expect(screen.getByText(/Overdue/i)).toBeInTheDocument();
            // Query text contents using regex layout matching to isolate combined string templates safely[cite: 8]
            expect(screen.getByText(/Jul 1/i)).toBeInTheDocument();
        });

        it("should send correct payload values when user checkbox toggle handles trigger updates", () => {
            render(
                <MilestoneList
                    goal={mockGoal}
                    milestones={activeMilestonesCollection}
                    onAdd={mockAdd}
                    onToggle={mockToggle}
                    onDelete={mockDelete}
                />
            );

            const checkboxBtn = screen.getAllByRole("button").find(b => b.className.includes("rounded-md"));
            fireEvent.click(checkboxBtn);

            expect(mockToggle).toHaveBeenCalledWith("m-1", true);
        });
    });

    describe("Delete Confirmation Modals Actions", () => {
        it("should open warning dialog containers and dismiss them when target wrapper drop zones capture hits", () => {
            render(
                <MilestoneList
                    goal={mockGoal}
                    milestones={activeMilestonesCollection}
                    onAdd={mockAdd}
                    onToggle={mockToggle}
                    onDelete={mockDelete}
                />
            );

            const deleteTrashBtn = screen.getAllByRole("button").find(b => b.className.includes("text-slate-600"));
            fireEvent.click(deleteTrashBtn);

            expect(screen.getByText("Delete Milestone?")).toBeInTheDocument();

            const modalPresentationMask = screen.getByRole("presentation");
            fireEvent.click(modalPresentationMask);
            expect(screen.queryByText("Delete Milestone?")).not.toBeInTheDocument();
        });

        it("should correctly handle keyboard Escape key operations inside presenting dialog frames safely", () => {
            render(
                <MilestoneList
                    goal={mockGoal}
                    milestones={activeMilestonesCollection}
                    onAdd={mockAdd}
                    onToggle={mockToggle}
                    onDelete={mockDelete}
                />
            );

            fireEvent.click(screen.getAllByRole("button").find(b => b.className.includes("text-slate-600")));
            const structuralModal = screen.getByRole("presentation");

            fireEvent.keyDown(structuralModal, { key: "Escape" });
            expect(screen.queryByText("Delete Milestone?")).not.toBeInTheDocument();
        });

        it("should trigger deletion hooks when internal validation button elements confirm updates", async () => {
            mockDelete.mockResolvedValueOnce({ success: true });
            render(
                <MilestoneList
                    goal={mockGoal}
                    milestones={activeMilestonesCollection}
                    onAdd={mockAdd}
                    onToggle={mockToggle}
                    onDelete={mockDelete}
                />
            );

            fireEvent.click(screen.getAllByRole("button").find(b => b.className.includes("text-slate-600")));

            const modalConfirmDeleteBtn = screen.getByRole("button", { name: "Delete" });
            await act(async () => {
                fireEvent.click(modalConfirmDeleteBtn);
            });

            expect(mockDelete).toHaveBeenCalledWith("m-1");
            expect(screen.queryByText("Delete Milestone?")).not.toBeInTheDocument();
        });
    });
});