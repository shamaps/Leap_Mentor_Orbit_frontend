// components/mentee/onboarding/SocialLinksSection.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SocialLinksSection from "../../../../components/mentee/onboarding/SocialLinksSection";

const mockUseMenteeOnboardingForm = vi.fn();
vi.mock("../../../../context/MenteeOnboardingFormContext", () => ({
    useMenteeOnboardingForm: (...args) => mockUseMenteeOnboardingForm(...args),
}));

vi.mock("@/components/common/FormField", () => ({
    default: ({ label, name, value, onChange, onBlur, placeholder, icon }) => (
        <div data-testid={`field-${name}`}>
            <label htmlFor={name}>{label}</label>
            {icon}
            <input id={name} name={name} value={value} placeholder={placeholder} onChange={onChange} onBlur={onBlur} />
        </div>
    ),
}));

const setup = (overrides = {}) => {
    const ctx = {
        form: { linkedInUrl: "", portfolioUrl: "" },
        handleChange: vi.fn(),
        onBlur: vi.fn(),
        ...overrides,
    };
    mockUseMenteeOnboardingForm.mockReturnValue(ctx);
    return ctx;
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe("SocialLinksSection", () => {
    it("renders section title and both fields", () => {
        setup();
        render(<SocialLinksSection />);
        expect(screen.getByText("Social Links")).toBeInTheDocument();
        expect(screen.getByText("LinkedIn URL")).toBeInTheDocument();
        expect(screen.getByText("Portfolio URL")).toBeInTheDocument();
    });

    it("renders current form values in each field", () => {
        setup({ form: { linkedInUrl: "https://linkedin.com/in/x", portfolioUrl: "https://portfolio.dev" } });
        render(<SocialLinksSection />);
        expect(document.querySelector("#linkedInUrl").value).toBe("https://linkedin.com/in/x");
        expect(document.querySelector("#portfolioUrl").value).toBe("https://portfolio.dev");
    });

    it("calls handleChange when typing into the LinkedIn field", async () => {
        const user = userEvent.setup();
        const ctx = setup();
        render(<SocialLinksSection />);
        await user.type(document.querySelector("#linkedInUrl"), "a");
        expect(ctx.handleChange).toHaveBeenCalled();
    });

    it("calls handleChange when typing into the Portfolio field", async () => {
        const user = userEvent.setup();
        const ctx = setup();
        render(<SocialLinksSection />);
        await user.type(document.querySelector("#portfolioUrl"), "a");
        expect(ctx.handleChange).toHaveBeenCalled();
    });

    it("calls onBlur when a field loses focus", async () => {
        const user = userEvent.setup();
        const ctx = setup();
        render(<SocialLinksSection />);
        document.querySelector("#linkedInUrl").focus();
        await user.tab();
        expect(ctx.onBlur).toHaveBeenCalled();
    });
});