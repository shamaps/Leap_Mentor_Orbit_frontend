// src/test/components/mentee/dashboard/findMentors/ConnectSuccessModal.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import ConnectSuccessModal from "../../../../../components/mentee/dashboard/findMentors/ConnectSucessModal";

describe("ConnectSuccessModal Component Suite", () => {
    const mockBack = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should display the mentor's name inside the confirmation copy", () => {
        render(<ConnectSuccessModal mentorName="Priya Sharma" onBackToDashboard={mockBack} />);
        expect(screen.getByText("Priya Sharma")).toBeInTheDocument();
    });

    it("should fall back to 'the mentor' when no mentorName is provided", () => {
        render(<ConnectSuccessModal onBackToDashboard={mockBack} />);
        expect(screen.getByText("the mentor")).toBeInTheDocument();
    });

    it("should render the success heading and call onBackToDashboard when clicked", () => {
        render(<ConnectSuccessModal mentorName="Rahul" onBackToDashboard={mockBack} />);
        expect(screen.getByText("Request Sent!")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /Back to Dashboard/i }));
        expect(mockBack).toHaveBeenCalledTimes(1);
    });
});