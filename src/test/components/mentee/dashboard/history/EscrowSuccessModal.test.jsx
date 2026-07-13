// src/test/components/mentee/dashboard/history/EscrowSuccessModal.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import EscrowSuccessModal from "../../../../../components/mentee/dashboard/history/EscrowSuccessModal";

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

    it("should call onDone when the header close button is clicked", () => {
        render(<EscrowSuccessModal totalAmount={100} mentorName="Alex" onDone={mockDone} />);
        fireEvent.click(screen.getAllByRole("button")[0]); // backdrop button is first
        expect(mockDone).toHaveBeenCalledTimes(1);
    });

    it("should call onDone when the Done button is clicked", () => {
        render(<EscrowSuccessModal totalAmount={100} mentorName="Alex" onDone={mockDone} />);
        fireEvent.click(screen.getByRole("button", { name: "Done" }));
        expect(mockDone).toHaveBeenCalledTimes(1);
    });

    it("should call onDone when the backdrop is clicked", () => {
        render(<EscrowSuccessModal totalAmount={100} mentorName="Alex" onDone={mockDone} />);
        fireEvent.click(screen.getByRole("button", { name: "Close" })); // backdrop has aria-label="Close"
        expect(mockDone).toHaveBeenCalledTimes(1);
    });

    it("should show the 'Secured in Escrow' badge", () => {
        render(<EscrowSuccessModal totalAmount={100} mentorName="Alex" onDone={mockDone} />);
        expect(screen.getByText("Secured in Escrow")).toBeInTheDocument();
    });
});