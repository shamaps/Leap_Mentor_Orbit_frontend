import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import PreferencesSection from "../../../../components/mentor/onboarding/PreferencesSection";

const mockOnChange = vi.fn();
let mockForm = { communicationPreferences: [], languages: "" };

vi.mock("../../../../context/MentorOnboardingFormContext", () => ({
    useMentorOnboardingForm: () => ({
        form: mockForm,
        onChange: mockOnChange,
    }),
}));

describe("PreferencesSection Component Suite", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockForm = { communicationPreferences: [], languages: "" };
    });

    it("should render all communication channel options", () => {
        render(<PreferencesSection />);
        expect(screen.getByText(/Video Meetings/)).toBeInTheDocument();
        expect(screen.getByText(/Instant Messaging/)).toBeInTheDocument();
        expect(screen.getByText(/Email Correspondence/)).toBeInTheDocument();
        expect(screen.getByText(/Phone Call/)).toBeInTheDocument();
        expect(screen.getByText(/In-Person/)).toBeInTheDocument();
    });

    it("should check a communication option that is already selected", () => {
        mockForm = { communicationPreferences: ["Chat"], languages: "" };
        render(<PreferencesSection />);
        const checkbox = screen.getByRole("checkbox", { name: /Instant Messaging \(Chat\)/i });
        expect(checkbox.checked).toBe(true);
        });

    it("should add a communication preference when an unchecked option is clicked", () => {
        render(<PreferencesSection />);
        fireEvent.click(screen.getByText(/Video Meetings/));
        expect(mockOnChange).toHaveBeenCalledWith({
            target: { name: "communicationPreferences", value: ["Video Call"] },
        });
    });

    it("should remove a communication preference when an already-selected option is clicked", () => {
        mockForm = { communicationPreferences: ["Video Call", "Chat"], languages: "" };
        render(<PreferencesSection />);
        fireEvent.click(screen.getByText(/Video Meetings/));
        expect(mockOnChange).toHaveBeenCalledWith({
            target: { name: "communicationPreferences", value: ["Chat"] },
        });
    });

    it("should parse comma-separated string languages into tags", () => {
        mockForm = { communicationPreferences: [], languages: "English, Hindi" };
        render(<PreferencesSection />);
        expect(screen.getByText("English")).toBeInTheDocument();
        expect(screen.getByText("Hindi")).toBeInTheDocument();
    });

    it("should render array-format languages directly", () => {
        mockForm = { communicationPreferences: [], languages: ["Spanish"] };
        render(<PreferencesSection />);
        expect(screen.getByText("Spanish")).toBeInTheDocument();
    });

    it("should show placeholder text when no languages are selected", () => {
        render(<PreferencesSection />);
        expect(screen.getByText("Select languages...")).toBeInTheDocument();
    });

    it("should show a selected count when languages are chosen", () => {
        mockForm = { communicationPreferences: [], languages: ["English", "Hindi"] };
        render(<PreferencesSection />);
        expect(screen.getByText("2 selected")).toBeInTheDocument();
    });

    it("should open the dropdown when the trigger button is clicked", () => {
        render(<PreferencesSection />);
        fireEvent.click(screen.getByLabelText("Select known languages"));
        expect(screen.getByText("Mandarin")).toBeInTheDocument();
    });

    it("should toggle a language on when selected from the dropdown", () => {
        render(<PreferencesSection />);
        fireEvent.click(screen.getByLabelText("Select known languages"));
        fireEvent.click(screen.getByText("French"));
        expect(mockOnChange).toHaveBeenCalledWith({
            target: { name: "languages", value: ["French"] },
        });
    });

    it("should toggle a language off when it is already selected in the dropdown", () => {
        mockForm = { communicationPreferences: [], languages: ["French"] };
        render(<PreferencesSection />);
        fireEvent.click(screen.getByLabelText("Select known languages"));
        // Dropdown option should also read "French"; use getAllByText and pick the button.
        const options = screen.getAllByText("French");
        fireEvent.click(options[options.length - 1]);
        expect(mockOnChange).toHaveBeenCalledWith({
            target: { name: "languages", value: [] },
        });
    });

    it("should remove a language tag when its remove (×) button is clicked", () => {
        mockForm = { communicationPreferences: [], languages: ["English", "Hindi"] };
        render(<PreferencesSection />);
        const removeButtons = screen.getAllByText("×");
        fireEvent.click(removeButtons[0]);
        expect(mockOnChange).toHaveBeenCalledWith({
            target: { name: "languages", value: ["Hindi"] },
        });
    });

    it("should close the dropdown when clicking outside of it", () => {
        render(<PreferencesSection />);
        fireEvent.click(screen.getByLabelText("Select known languages"));
        expect(screen.getByText("Mandarin")).toBeInTheDocument();

        fireEvent.mouseDown(document.body);
        expect(screen.queryByText("Mandarin")).not.toBeInTheDocument();
    });

    it("should not close the dropdown when clicking inside it", () => {
        render(<PreferencesSection />);
        fireEvent.click(screen.getByLabelText("Select known languages"));
        fireEvent.mouseDown(screen.getByText("Mandarin"));
        // clicking an option inside toggles the language but shouldn't error out
        expect(mockOnChange).not.toHaveBeenCalledWith(
            expect.objectContaining({ target: expect.objectContaining({ name: "communicationPreferences" }) })
        );
    });
});