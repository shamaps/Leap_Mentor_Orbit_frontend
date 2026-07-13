import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import ProfessionalInfoSection from "../../../../components/mentor/onboarding/ProfessionalInfoSection";

const mockOnChange = vi.fn();
let mockForm = {
    currentRole: "",
    industry: "",
    company: "",
    education: "",
    yearsOfExperience: "",
    hourlyRate: "",
};
let mockErrors = {};

vi.mock("../../../../context/MentorOnboardingFormContext", () => ({
    useMentorOnboardingForm: () => ({
        form: mockForm,
        onChange: mockOnChange,
        errors: mockErrors,
    }),
}));

describe("ProfessionalInfoSection Component Suite", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockForm = {
            currentRole: "",
            industry: "",
            company: "",
            education: "",
            yearsOfExperience: "",
            hourlyRate: "",
        };
        mockErrors = {};
    });

    it("should render all professional fields", () => {
        render(<ProfessionalInfoSection />);
        expect(screen.getByLabelText(/Current Role/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Industry/)).toBeInTheDocument();
        expect(screen.getByLabelText("Company")).toBeInTheDocument();
        expect(screen.getByLabelText("Educational Qualifications")).toBeInTheDocument();
        expect(screen.getByLabelText(/Years of Experience/)).toBeInTheDocument();
        expect(screen.getByText(/Session Rate/)).toBeInTheDocument();
    });

    it("should call onChange when the current role input changes", () => {
        render(<ProfessionalInfoSection />);
        fireEvent.change(screen.getByLabelText(/Current Role/), { target: { value: "PM" } });
        expect(mockOnChange).toHaveBeenCalled();
    });

    it("should call onChange when the industry select changes", () => {
        render(<ProfessionalInfoSection />);
        fireEvent.change(screen.getByLabelText(/Industry/), { target: { value: "Finance" } });
        expect(mockOnChange).toHaveBeenCalled();
    });

    it("should render all industry options", () => {
        render(<ProfessionalInfoSection />);
        [
            "Technology", "Finance", "Healthcare", "Education", "Design",
            "Marketing", "Legal", "Consulting", "Media", "Engineering", "Other",
        ].forEach((opt) => {
            expect(screen.getByRole("option", { name: opt })).toBeInTheDocument();
        });
    });

    it("should call onChange for company, education, years of experience and hourly rate", () => {
        render(<ProfessionalInfoSection />);
        fireEvent.change(screen.getByLabelText("Company"), { target: { value: "Acme" } });
        fireEvent.change(screen.getByLabelText("Educational Qualifications"), { target: { value: "B.Tech" } });
        fireEvent.change(screen.getByLabelText(/Years of Experience/), { target: { value: "5" } });
        fireEvent.change(screen.getByPlaceholderText("e.g. 50"), { target: { value: "60" } });
        expect(mockOnChange).toHaveBeenCalledTimes(4);
    });

    it("should show currentRole validation error", () => {
        mockErrors = { currentRole: true };
        render(<ProfessionalInfoSection />);
        expect(screen.getByText("Current role is required.")).toBeInTheDocument();
    });

    it("should show industry validation error", () => {
        mockErrors = { industry: true };
        render(<ProfessionalInfoSection />);
        expect(screen.getByText("Please select an industry.")).toBeInTheDocument();
    });

    it("should show years of experience validation error", () => {
        mockErrors = { yearsOfExperience: true };
        render(<ProfessionalInfoSection />);
        expect(screen.getByText("Years of experience is required.")).toBeInTheDocument();
    });

    it("should apply the filled-value select styling when industry has a value", () => {
        mockForm = { ...mockForm, industry: "Technology" };
        render(<ProfessionalInfoSection />);
        expect(screen.getByLabelText(/Industry/)).toHaveValue("Technology");
    });

    it("should render an empty string for education when undefined", () => {
        mockForm = { ...mockForm, education: undefined };
        render(<ProfessionalInfoSection />);
        expect(screen.getByLabelText("Educational Qualifications")).toHaveValue("");
    });

    it("should forward a ref to the root container", () => {
        const ref = React.createRef();
        render(<ProfessionalInfoSection ref={ref} />);
        expect(ref.current).not.toBeNull();
        expect(ref.current.tagName).toBe("DIV");
    });
});