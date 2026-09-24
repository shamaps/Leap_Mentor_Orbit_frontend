import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import SocialLinksSection from "../../../../features/mentor/view/components/onboarding/SocialLinksSection";

const mockOnChange = vi.fn();
const mockOnBlur = vi.fn();
let mockForm = { portfolioUrl: "", linkedInUrl: "" };

vi.mock("../../../../features/mentor/context/MentorOnboardingFormContext", () => ({
    useMentorOnboardingForm: () => ({
        form: mockForm,
        onChange: mockOnChange,
        onBlur: mockOnBlur,
    }),
}));

vi.mock("@/shared/components/FormField", () => ({
    default: ({ label, name, value, onChange, onBlur, placeholder, icon }) => (
        <div>
            <label htmlFor={name}>{label}</label>
            {icon}
            <input
                id={name}
                name={name}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder={placeholder}
            />
        </div>
    ),
}));

describe("SocialLinksSection Component Suite", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockForm = { portfolioUrl: "", linkedInUrl: "" };
    });

    it("should render both the portfolio and linkedin fields", () => {
        render(<SocialLinksSection />);
        expect(screen.getByLabelText("Portfolio or Personal Website URL")).toBeInTheDocument();
        expect(screen.getByLabelText("LinkedIn Profile URL")).toBeInTheDocument();
    });

    it("should call onChange when the portfolio URL field changes", () => {
        render(<SocialLinksSection />);
        fireEvent.change(screen.getByLabelText("Portfolio or Personal Website URL"), {
            target: { value: "https://me.dev" },
        });
        expect(mockOnChange).toHaveBeenCalled();
    });

    it("should call onChange when the linkedin URL field changes", () => {
        render(<SocialLinksSection />);
        fireEvent.change(screen.getByLabelText("LinkedIn Profile URL"), {
            target: { value: "https://linkedin.com/in/me" },
        });
        expect(mockOnChange).toHaveBeenCalled();
    });

    it("should call onBlur for both fields", () => {
        render(<SocialLinksSection />);
        fireEvent.blur(screen.getByLabelText("Portfolio or Personal Website URL"));
        fireEvent.blur(screen.getByLabelText("LinkedIn Profile URL"));
        expect(mockOnBlur).toHaveBeenCalledTimes(2);
    });

    it("should reflect existing form values in the inputs", () => {
        mockForm = { portfolioUrl: "https://existing.dev", linkedInUrl: "https://linkedin.com/in/existing" };
        render(<SocialLinksSection />);
        expect(screen.getByLabelText("Portfolio or Personal Website URL")).toHaveValue("https://existing.dev");
        expect(screen.getByLabelText("LinkedIn Profile URL")).toHaveValue("https://linkedin.com/in/existing");
    });

    it("should render the section heading", () => {
        render(<SocialLinksSection />);
        expect(screen.getByText("Social Links")).toBeInTheDocument();
    });
});