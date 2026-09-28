// src/test/components/mentee/dashboard/history/EscrowSuccessModal.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import EscrowSuccessModal from "../../../../../features/mentee/view/components/dashboard/history/EscrowSuccessModal";

describe("EscrowSuccessModal Component Suite", () => {
    const mockDone = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should display the total amount and mentor name in the confirmation copy", () => {
        render(<EscrowSuccessModal totalAmount={240} mentorName="Priya Sharma" onDone={mockDone} />);
        expect(screen.getByText("240 tokens locked in escrow")).toBeInTheDocument();
        expect(screen.getByText("Priya Sharma")).toBeInTheDocument();
    });

    it("should call onDone exactly once when the X (close) button is clicked", () => {
        render(<EscrowSuccessModal totalAmount={100} mentorName="Alex" onDone={mockDone} />);
        fireEvent.click(screen.getByRole("button", { name: "Close" }));
        expect(mockDone).toHaveBeenCalledTimes(1);
    });

    it("should not call onDone a second time if the X button is clicked again after the first dismiss", () => {
        render(<EscrowSuccessModal totalAmount={100} mentorName="Alex" onDone={mockDone} />);
        const closeButton = screen.getByRole("button", { name: "Close" });

        fireEvent.click(closeButton);
        fireEvent.click(closeButton);

        expect(mockDone).toHaveBeenCalledTimes(1);
    });

    it("should call onDone exactly once when the Done button is clicked", () => {
        render(<EscrowSuccessModal totalAmount={100} mentorName="Alex" onDone={mockDone} />);
        fireEvent.click(screen.getByRole("button", { name: "Done" }));
        expect(mockDone).toHaveBeenCalledTimes(1);
    });

    it("should call onDone exactly once when Escape is pressed", () => {
        render(<EscrowSuccessModal totalAmount={100} mentorName="Alex" onDone={mockDone} />);
        fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
        expect(mockDone).toHaveBeenCalledTimes(1);
    });

    it("should not call onDone twice even if both a dismiss path and a direct click race (X then Done)", () => {
        render(<EscrowSuccessModal totalAmount={100} mentorName="Alex" onDone={mockDone} />);
        fireEvent.click(screen.getByRole("button", { name: "Close" }));
        fireEvent.click(screen.getByRole("button", { name: "Done" }));
        expect(mockDone).toHaveBeenCalledTimes(1);
    });

    it("should show the 'Secured in Escrow' badge", () => {
        render(<EscrowSuccessModal totalAmount={100} mentorName="Alex" onDone={mockDone} />);
        expect(screen.getByText("Secured in Escrow")).toBeInTheDocument();
    });
});