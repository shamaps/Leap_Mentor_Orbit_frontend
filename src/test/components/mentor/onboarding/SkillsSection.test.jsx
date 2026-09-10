import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import SkillsSection from "../../../../features/mentor/view/components/onboarding/SkillsSection";

const mockOnChange = vi.fn();
let mockForm = { skills: [] };
let mockErrors = {};

vi.mock("../../../../features/mentor/context/MentorOnboardingFormContext", () => ({
    useMentorOnboardingForm: () => ({
        form: mockForm,
        onChange: mockOnChange,
        errors: mockErrors,
    }),
}));

describe("SkillsSection Component Suite", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockForm = { skills: [] };
        mockErrors = {};
    });

    it("should render existing skills as tags", () => {
        mockForm = { skills: ["React", "Node"] };
        render(<SkillsSection />);
        expect(screen.getByText("React")).toBeInTheDocument();
        expect(screen.getByText("Node")).toBeInTheDocument();
    });

    it("should not render the tag list when there are no skills", () => {
        render(<SkillsSection />);
        expect(screen.queryByText("×")).not.toBeInTheDocument();
    });

    it("should add a trimmed skill via the Add button", () => {
        render(<SkillsSection />);
        const input = screen.getByPlaceholderText("Type a skill and press enter...");
        fireEvent.change(input, { target: { value: "  Python  " } });
        fireEvent.click(screen.getByText("Add"));
        expect(mockOnChange).toHaveBeenCalledWith({
            target: { name: "skills", value: ["Python"] },
        });
    });

    it("should not add an empty/whitespace-only skill", () => {
        render(<SkillsSection />);
        const input = screen.getByPlaceholderText("Type a skill and press enter...");
        fireEvent.change(input, { target: { value: "   " } });
        fireEvent.click(screen.getByText("Add"));
        expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("should not add a duplicate skill", () => {
        mockForm = { skills: ["Python"] };
        render(<SkillsSection />);
        const input = screen.getByPlaceholderText("Type a skill and press enter...");
        fireEvent.change(input, { target: { value: "Python" } });
        fireEvent.click(screen.getByText("Add"));
        expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("should add a skill when Enter is pressed", () => {
        render(<SkillsSection />);
        const input = screen.getByPlaceholderText("Type a skill and press enter...");
        fireEvent.change(input, { target: { value: "Go" } });
        fireEvent.keyDown(input, { key: "Enter" });
        expect(mockOnChange).toHaveBeenCalledWith({
            target: { name: "skills", value: ["Go"] },
        });
    });

    it("should not react to non-Enter key presses", () => {
        render(<SkillsSection />);
        const input = screen.getByPlaceholderText("Type a skill and press enter...");
        fireEvent.change(input, { target: { value: "Go" } });
        fireEvent.keyDown(input, { key: "Tab" });
        expect(mockOnChange).not.toHaveBeenCalled();
    });

    it("should add a skill on blur", () => {
        render(<SkillsSection />);
        const input = screen.getByPlaceholderText("Type a skill and press enter...");
        fireEvent.change(input, { target: { value: "Rust" } });
        fireEvent.blur(input);
        expect(mockOnChange).toHaveBeenCalledWith({
            target: { name: "skills", value: ["Rust"] },
        });
    });

    it("should remove a skill when its × button is clicked", () => {
        mockForm = { skills: ["React", "Node"] };
        render(<SkillsSection />);
        const removeButtons = screen.getAllByText("×");
        fireEvent.click(removeButtons[0]);
        expect(mockOnChange).toHaveBeenCalledWith({
            target: { name: "skills", value: ["Node"] },
        });
    });

    it("should show the validation error message when errors.skills is set", () => {
        mockErrors = { skills: true };
        render(<SkillsSection />);
        expect(screen.getByText("Please add at least one skill.")).toBeInTheDocument();
    });

    it("should show the helper text when there is no error", () => {
        render(<SkillsSection />);
        expect(screen.getByText("Press Enter or click Add to add a skill")).toBeInTheDocument();
    });

    it("should forward a ref and set the data-field attribute for scroll targeting", () => {
        const ref = React.createRef();
        render(<SkillsSection ref={ref} />);
        expect(ref.current).not.toBeNull();
        expect(ref.current).toHaveAttribute("data-field", "skills");
    });
});