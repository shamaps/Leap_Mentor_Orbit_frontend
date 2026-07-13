import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import React from "react";
import { z } from "zod";
import GoalForm from "../../../../../components/shared-dashboard/tabs/goals/GoalForm";

// ✅ Re-create a real, structurally operational Zod validation schema definition
vi.mock("../../../../../schemas/miscSchemas", () => {
    const schema = z.object({
        title: z.string().min(1, "Goal title is required description."),
        description: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
    }).superRefine((data, ctx) => {
        if (data.startDate && data.endDate && data.endDate < data.startDate) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "End date cannot precede start date.",
                path: ["endDate"],
            });
        }
    });
    return { goalSchema: schema };
});

// Mock Spinner subcomponent layout alignment
vi.mock("../../../../../components/common/Spinner", () => ({
    default: () => <span data-testid="mock-spinner-element" />
}));
describe("GoalForm Components Coverage Suite", () => {
    const mockSave = vi.fn();
    const mockCancel = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Form Inceptions & Defaults Handling", () => {
        it("should populate layout entries with empty fallback string structures when initialization fields remain blank", () => {
            render(<GoalForm onSave={mockSave} onCancel={mockCancel} />);

            expect(screen.getByLabelText(/Goal Title/i)).toHaveValue("");
            expect(screen.getByPlaceholderText(/Describe what success looks like/i)).toHaveValue("");
            expect(screen.getByLabelText(/Start Date/i)).toHaveValue("");
            expect(screen.getByLabelText(/End Date/i)).toHaveValue("");
        });

        it("should seed form parameters perfectly when custom initial values are explicitly passed down", () => {
            const customInitial = {
                title: "Master Frontend Engineering Frameworks",
                description: "Focus heavily on React profiling pipelines.",
                startDate: "2026-07-15",
                endDate: "2026-12-20"
            };

            render(<GoalForm initial={customInitial} onSave={mockSave} onCancel={mockCancel} />);

            expect(screen.getByLabelText(/Goal Title/i)).toHaveValue(customInitial.title);
            expect(screen.getByPlaceholderText(/Describe what success looks like/i)).toHaveValue(customInitial.description);
            expect(screen.getByLabelText(/Start Date/i)).toHaveValue(customInitial.startDate);
            expect(screen.getByLabelText(/End Date/i)).toHaveValue(customInitial.endDate);
        });
    });

    describe("Interactive Watchers and Operations Locking", () => {
        it("should keep the save action handle button disabled if the text title input maps to empty whitespaces", () => {
            render(<GoalForm onSave={mockSave} onCancel={mockCancel} />);

            const titleInput = screen.getByLabelText(/Goal Title/i);
            const submitBtn = screen.getByRole("button", { name: /Save Goal/i });

            expect(submitBtn).toBeDisabled();
            expect(submitBtn).toHaveClass("bg-slate-100");

            fireEvent.change(titleInput, { target: { value: "   " } });
            expect(submitBtn).toBeDisabled();
        });

        it("should trigger cancel workflows directly if the dismiss trigger component captures mouse click hits", () => {
            render(<GoalForm onSave={mockSave} onCancel={mockCancel} />);

            const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
            fireEvent.click(cancelBtn);

            expect(mockCancel).toHaveBeenCalled();
        });

        it("should lock button attributes and inject structural spinners when saving parameter evaluates to true", async () => {
            render(<GoalForm onSave={mockSave} onCancel={mockCancel} saving={true} initial={{ title: "Valid Seeded Title" }} />);

            // ✅ Update the target element dynamically to trigger watch updates before asserting the layout state change
            const titleInput = screen.getByLabelText(/Goal Title/i);
            fireEvent.change(titleInput, { target: { value: "Valid Seeded Title" } });

            await waitFor(() => {
                expect(screen.getByText("Saving...")).toBeInTheDocument();
                expect(screen.getByTestId("mock-spinner-element")).toBeInTheDocument();
            });

            expect(screen.getByRole("button", { name: /Cancel/i })).toBeDisabled();
            expect(screen.getByRole("button", { name: /Saving.../i })).toBeDisabled();
        });
    });

    describe("Validation Warnings Output & Submissions Pipeline", () => {
        it("should render error texts beneath input grids if title validation flags catch programmatic errors", async () => {
            render(<GoalForm onSave={mockSave} onCancel={mockCancel} />);

            const titleInput = screen.getByLabelText(/Goal Title/i);

            fireEvent.change(titleInput, { target: { value: "A" } });
            fireEvent.change(titleInput, { target: { value: "" } });

            const formElement = screen.getByLabelText(/Goal Title/i).form;

            await act(async () => {
                fireEvent.submit(formElement);
            });

            await waitFor(() => {
                expect(screen.getByText("Goal title is required description.")).toBeInTheDocument();
            });
            expect(mockSave).not.toHaveBeenCalled();
        });
        it("should render error warnings for end dates when constraints report timing sequence faults", async () => {
            render(<GoalForm onSave={mockSave} onCancel={mockCancel} />);

            fireEvent.change(screen.getByLabelText(/Goal Title/i), { target: { value: "Valid Title Loop" } });
            fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: "2026-07-12" } });
            fireEvent.change(screen.getByLabelText(/End Date/i), { target: { value: "2026-01-01" } }); // valid format, precedes start

            const formElement = screen.getByLabelText(/Goal Title/i).form;

            await act(async () => {
                fireEvent.submit(formElement);
            });

            await waitFor(() => {
                expect(screen.getByText("End date cannot precede start date.")).toBeInTheDocument();
            });
        });

        it("should submit validated fields cleanly and apply parameter whitespace trim calls beforehand", async () => {
            render(<GoalForm onSave={mockSave} onCancel={mockCancel} />);

            fireEvent.change(screen.getByLabelText(/Goal Title/i), { target: { value: "  Clean Target Goal Name   " } });
            fireEvent.change(screen.getByPlaceholderText(/Describe what success looks like/i), { target: { value: "  Detailed notes description string.  " } });
            fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: "2026-07-12" } });
            fireEvent.change(screen.getByLabelText(/End Date/i), { target: { value: "2026-10-15" } });

            const formElement = screen.getByLabelText(/Goal Title/i).form;

            await act(async () => {
                fireEvent.submit(formElement);
            });

            await waitFor(() => {
                expect(mockSave).toHaveBeenCalledWith({
                    title: "Clean Target Goal Name",
                    description: "Detailed notes description string.",
                    startDate: "2026-07-12",
                    endDate: "2026-10-15"
                });
            });
        });
    });
});