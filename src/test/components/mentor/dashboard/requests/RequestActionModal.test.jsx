// src/test/components/mentor/dashboard/requests/RequestActionModal.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RequestActionModal from "../../../../../features/mentor/view/components/dashboard/requests/RequestActionModal";

describe("RequestActionModal Component Suite", () => {
    it("should render the accepted state with emerald styling and calendar note", () => {
        render(<RequestActionModal type="accepted" menteeName="Priya" onBack={vi.fn()} />);
        expect(screen.getByText("Request Accepted!")).toBeInTheDocument();
        expect(
            screen.getByText((_, node) => node?.textContent === "You have accepted Priya's mentorship request."),
        ).toBeInTheDocument();
        expect(screen.getByText(/A calendar invite has been sent to both you and Priya/)).toBeInTheDocument();
    });

    it("should render the rejected state without the calendar note", () => {
        render(<RequestActionModal type="rejected" menteeName="Priya" onBack={vi.fn()} />);
        expect(screen.getByText("Request Rejected")).toBeInTheDocument();
        expect(
            screen.getByText((_, node) => node?.textContent === "You have rejected Priya's mentorship request."),
        ).toBeInTheDocument();
        expect(screen.queryByText(/calendar invite/)).not.toBeInTheDocument();
    });

    it("should call onBack when the back button is clicked", () => {
        const onBack = vi.fn();
        render(<RequestActionModal type="accepted" menteeName="Priya" onBack={onBack} />);
        fireEvent.click(screen.getByRole("button", { name: "Back to Requests" }));
        expect(onBack).toHaveBeenCalled();
    });
});