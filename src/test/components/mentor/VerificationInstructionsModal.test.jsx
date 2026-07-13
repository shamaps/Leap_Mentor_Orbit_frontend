import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import VerificationInstructionsModal from "../../../components/mentor/VerificationInstructionsModal";

describe("VerificationInstructionsModal Component Suite", () => {
    it("should iterate through the instruction steps and call onClose when completed", () => {
        const mockClose = vi.fn();
        render(<VerificationInstructionsModal onClose={mockClose} />);

        expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();
        expect(screen.getByText("Phone & Resume")).toBeInTheDocument();

        // Advance forward through pagination flow indicators
        const nextBtn = screen.getByRole("button", { name: /Next →/i });
        fireEvent.click(nextBtn);
        expect(screen.getByText("Step 2 of 4")).toBeInTheDocument();

        // Verify historical trace back capabilities retain index memory pointers
        const backBtn = screen.getByRole("button", { name: /← Back/i });
        fireEvent.click(backBtn);
        expect(screen.getByText("Step 1 of 4")).toBeInTheDocument();

        // Fast forward directly into terminal indexes to mount conditional confirmation panels
        fireEvent.click(screen.getByRole("button", { name: /Next →/i }));
        fireEvent.click(screen.getByRole("button", { name: /Next →/i }));
        fireEvent.click(screen.getByRole("button", { name: /Next →/i }));

        expect(screen.getByText("Step 4 of 4")).toBeInTheDocument();
        expect(screen.getByText(/Your documents are stored securely/i)).toBeInTheDocument();

        const actionFinishBtn = screen.getByRole("button", { name: /Got it, let's go →/i });
        fireEvent.click(actionFinishBtn);
        expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it("should trigger onClose workflows directly if skip controls are activated", () => {
        const mockClose = vi.fn();
        render(<VerificationInstructionsModal onClose={mockClose} />);

        const skipBtn = screen.getByRole("button", { name: /Skip/i });
        fireEvent.click(skipBtn);
        expect(mockClose).toHaveBeenCalledTimes(1);
    });

    it("should close the instruction modal when clicking on the presentation layer background backdrop", () => {
        const mockClose = vi.fn();
        render(<VerificationInstructionsModal onClose={mockClose} />);

        const backdropMaskBtn = screen.getByRole("button", { name: /Close/i });
        fireEvent.click(backdropMaskBtn);
        expect(mockClose).toHaveBeenCalledTimes(1);
    });
});