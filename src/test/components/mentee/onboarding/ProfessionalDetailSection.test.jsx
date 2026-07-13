// components/mentee/onboarding/ProfessionalDetailsSection.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProfessionalDetailsSection from "../../../../components/mentee/onboarding/ProfessionalDetailsSection";

const mockUseMenteeOnboardingForm = vi.fn();
vi.mock("../../../../context/MenteeOnboardingFormContext", () => ({
    useMenteeOnboardingForm: (...args) => mockUseMenteeOnboardingForm(...args),
}));

vi.mock("@/components/common/FormField", () => ({
    default: ({ as, label, required, name, value, onChange, onBlur, placeholder, error, children }) => (
        <div data-testid={`field-${name}`}>
            <label htmlFor={name}>
                {label}
                {required ? " *" : ""}
            </label>
            {as === "select" ? (
                <select id={name} name={name} value={value} onChange={onChange} onBlur={onBlur}>
                    {children}
                </select>
            ) : (
                <input
                    id={name}
                    name={name}
                    value={value}
                    placeholder={placeholder}
                    onChange={onChange}
                    onBlur={onBlur}
                />
            )}
            {error && <span data-testid={`error-${name}`}>{error}</span>}
        </div>
    ),
}));

const setup = (overrides = {}) => {
    const ctx = {
        form: { currentRole: "", yearsOfExperience: "", company: "", industry: "" },
        handleChange: vi.fn(),
        onBlur: vi.fn(),
        errors: {},
        ...overrides,
    };
    mockUseMenteeOnboardingForm.mockReturnValue(ctx);
    return ctx;
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe("ProfessionalDetailsSection", () => {
    it("renders all four fields with labels", () => {
        setup();
        render(<ProfessionalDetailsSection />);
        expect(screen.getByText("Current Role *")).toBeInTheDocument();
        expect(screen.getByText("Years of Experience *")).toBeInTheDocument();
        expect(screen.getByText("Company / Organization")).toBeInTheDocument();
        expect(screen.getByText("Industry *")).toBeInTheDocument();
    });

    it("renders the correct number of options for experience and industry selects", () => {
        setup();
        render(<ProfessionalDetailsSection />);
        const experienceSelect = document.querySelector("#yearsOfExperience");
        const industrySelect = document.querySelector("#industry");
        // +1 for the "Select..." placeholder option
        expect(experienceSelect.querySelectorAll("option").length).toBe(7);
        expect(industrySelect.querySelectorAll("option").length).toBe(12);
    });

    it("calls handleChange and onBlur for the currentRole text field", async () => {
        const user = userEvent.setup();
        const ctx = setup();
        render(<ProfessionalDetailsSection />);
        const input = document.querySelector("#currentRole");
        await user.type(input, "a");
        expect(ctx.handleChange).toHaveBeenCalled();
        await user.tab();
        expect(ctx.onBlur).toHaveBeenCalled();
    });

    it("shows error messages for currentRole, yearsOfExperience, and industry when present", () => {
        setup({
            errors: {
                currentRole: true,
                yearsOfExperience: true,
                industry: true,
            },
        });
        render(<ProfessionalDetailsSection />);
        expect(screen.getByTestId("error-currentRole")).toHaveTextContent(
            "Current role is required."
        );
        expect(screen.getByTestId("error-yearsOfExperience")).toHaveTextContent(
            "Please select your experience."
        );
        expect(screen.getByTestId("error-industry")).toHaveTextContent(
            "Please select an industry."
        );
    });

    it("does not show error messages when there are no errors", () => {
        setup();
        render(<ProfessionalDetailsSection />);
        expect(screen.queryByTestId("error-currentRole")).not.toBeInTheDocument();
        expect(screen.queryByTestId("error-yearsOfExperience")).not.toBeInTheDocument();
        expect(screen.queryByTestId("error-industry")).not.toBeInTheDocument();
    });

    it("company field has no required marker or error prop wired", () => {
        setup({ errors: { company: true } });
        render(<ProfessionalDetailsSection />);
        expect(screen.getByText("Company / Organization")).toBeInTheDocument();
        expect(screen.queryByTestId("error-company")).not.toBeInTheDocument();
    });

    it("falls back to empty string when yearsOfExperience/industry are null/undefined", () => {
        setup({ form: { currentRole: "", yearsOfExperience: null, company: "", industry: undefined } });
        render(<ProfessionalDetailsSection />);
        expect(document.querySelector("#yearsOfExperience").value).toBe("");
        expect(document.querySelector("#industry").value).toBe("");
    });
});