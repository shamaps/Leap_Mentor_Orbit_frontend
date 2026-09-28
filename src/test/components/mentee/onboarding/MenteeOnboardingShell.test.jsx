// components/mentee/onboarding/MenteeOnboardingShell.test.jsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MenteeOnboardingShell from "../../../../features/mentee/view/components/onboarding/MenteeOnboardingShell";
import { MenteeOnboardingFormContext } from "../../../../features/mentee/context/MenteeOnboardingFormContext";


const mockUseMenteeOnboarding = vi.fn();
vi.mock("@/features/mentee/presenter/useMenteeOnboarding", () => ({
    default: (...args) => mockUseMenteeOnboarding(...args),
}));

const mockGetFieldErrorMap = vi.fn();
vi.mock("@/features/mentee/schemas/onboardingSchemas", () => ({
    menteeOnboardingSchema: {},
    getFieldErrorMap: (...args) => mockGetFieldErrorMap(...args),
}));

vi.mock("@/shared/marketing/OnboardingProgressBar", () => ({
    default: () => <div data-testid="progress-bar" />,
}));

vi.mock("@/shared/components/FullScreenLoader", () => ({
    default: ({ message }) => <div data-testid="fullscreen-loader">{message}</div>,
}));

vi.mock("@/shared/constants/images", () => ({
    IMAGES: { logo: "/logo.png" },
}));

vi.mock("@/features/mentee/config/onboardingFields", () => ({
    MENTEE_ONBOARDING_FIELDS: [],
}));

// Static stubs — each renders a real DOM node carrying the name/data-field
// attributes the shell's scrollToFirstError logic looks for, without needing
// to reach into the real context.
vi.mock("@/features/mentee/view/components/onboarding/PersonalInfoSection", () => ({
    default: function PersonalInfoSectionStub() {
        const { handleChange, onBlur, errors = {} } = React.useContext(MenteeOnboardingFormContext);
        return (
            <input
                name="bio"
                data-testid="personal-info-stub"
                aria-invalid={Boolean(errors.bio)}
                onChange={handleChange}
                onBlur={onBlur}
            />
        );
    },
}));
vi.mock("@/features/mentee/view/components/onboarding/ProfessionalDetailsSection", () => ({
    default: () => <input name="currentRole" data-testid="professional-details-stub" />,
}));
vi.mock("@/features/mentee/view/components/onboarding/InterestedFieldsSection", () => ({
    default: React.forwardRef(function InterestedFieldsStub(_, ref) {
        return <div ref={ref} data-field="interestedFields" data-testid="interested-fields-stub" />;
    }),
}));
vi.mock("@/features/mentee/view/components/onboarding/MentorshipPrefsSection", () => ({
    default: () => <div data-testid="mentorship-prefs-stub" />,
}));
vi.mock("@/features/mentee/view/components/onboarding/SocialLinksSection", () => ({
    default: () => <div data-testid="social-links-stub" />,
}));

const setup = (overrides = {}) => {
    const ctx = {
        form: {},
        loading: false,
        msg: { text: "", type: "" },
        redirecting: false,
        handleChange: vi.fn(),
        handleSubmit: vi.fn((e) => e?.preventDefault?.()),
        ...overrides,
    };
    mockUseMenteeOnboarding.mockReturnValue(ctx);
    return ctx;
};

beforeEach(() => {
    vi.clearAllMocks();
    mockGetFieldErrorMap.mockReturnValue({});
    Element.prototype.scrollIntoView = vi.fn();
});

describe("MenteeOnboardingShell", () => {
    it("renders the header, title, and all sections", () => {
        setup();
        render(<MenteeOnboardingShell />);
        expect(screen.getByText("Leapmentor")).toBeInTheDocument();
        expect(screen.getByText("Mentee Onboarding")).toBeInTheDocument();
        expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
        expect(screen.getByTestId("personal-info-stub")).toBeInTheDocument();
        expect(screen.getByTestId("professional-details-stub")).toBeInTheDocument();
        expect(screen.getByTestId("interested-fields-stub")).toBeInTheDocument();
        expect(screen.getByTestId("mentorship-prefs-stub")).toBeInTheDocument();
        expect(screen.getByTestId("social-links-stub")).toBeInTheDocument();
    });

    it("does not render the FullScreenLoader when not redirecting", () => {
        setup({ redirecting: false });
        render(<MenteeOnboardingShell />);
        expect(screen.queryByTestId("fullscreen-loader")).not.toBeInTheDocument();
    });

    it("renders the FullScreenLoader when redirecting is true", () => {
        setup({ redirecting: true });
        render(<MenteeOnboardingShell />);
        expect(screen.getByTestId("fullscreen-loader")).toHaveTextContent(
            "Setting up your profile..."
        );
    });

    it("shows a success-styled message when msg.type is 'success'", () => {
        setup({ msg: { text: "Saved!", type: "success" } });
        render(<MenteeOnboardingShell />);
        const msg = screen.getByText("Saved!");
        expect(msg.className).toMatch(/emerald/);
    });

    it("shows an error-styled message when msg.type is not 'success'", () => {
        setup({ msg: { text: "Failed!", type: "error" } });
        render(<MenteeOnboardingShell />);
        const msg = screen.getByText("Failed!");
        expect(msg.className).toMatch(/red/);
    });

    it("does not render a message block when msg.text is empty", () => {
        setup({ msg: { text: "", type: "" } });
        render(<MenteeOnboardingShell />);
        expect(screen.queryByText("⚠️")).not.toBeInTheDocument();
        expect(screen.queryByText("✓")).not.toBeInTheDocument();
    });

    it("shows the default submit label when not loading", () => {
        setup({ loading: false });
        render(<MenteeOnboardingShell />);
        const button = screen.getByRole("button", { name: /Complete Profile/ });
        expect(button).not.toBeDisabled();
    });

    it("disables the submit button and shows the saving state while loading", () => {
        setup({ loading: true });
        render(<MenteeOnboardingShell />);
        expect(screen.getByText("Saving profile...")).toBeInTheDocument();
        const button = screen.getByText("Saving profile...").closest("button");
        expect(button).toBeDisabled();
    });

    it("submits the form and calls handleSubmit when there are no validation errors", async () => {
        const user = userEvent.setup();
        const ctx = setup();
        mockGetFieldErrorMap.mockReturnValue({});
        render(<MenteeOnboardingShell />);
        await user.click(screen.getByRole("button", { name: /Complete Profile/ }));
        expect(ctx.handleSubmit).toHaveBeenCalledTimes(1);
        expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    });

    it("blocks submit and scrolls to a field matched by name attribute when validation fails", async () => {
        const user = userEvent.setup();
        const ctx = setup();
        mockGetFieldErrorMap.mockReturnValue({ currentRole: true });
        render(<MenteeOnboardingShell />);
        await user.click(screen.getByRole("button", { name: /Complete Profile/ }));
        expect(ctx.handleSubmit).not.toHaveBeenCalled();
        expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
    });

    it("scrolls to a field matched by data-field attribute when no name attribute matches", async () => {
        const user = userEvent.setup();
        setup();
        mockGetFieldErrorMap.mockReturnValue({ interestedFields: true });
        render(<MenteeOnboardingShell />);
        await user.click(screen.getByRole("button", { name: /Complete Profile/ }));
        expect(Element.prototype.scrollIntoView).toHaveBeenCalledTimes(1);
    });

    it("does not throw when the first error key has no matching element or ref", async () => {
        const user = userEvent.setup();
        setup();
        mockGetFieldErrorMap.mockReturnValue({ someUnmappedField: true });
        render(<MenteeOnboardingShell />);
        await user.click(screen.getByRole("button", { name: /Complete Profile/ }));
        expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    });

    it("does not attempt to scroll when there are no error keys at all", async () => {
        const user = userEvent.setup();
        setup();
        mockGetFieldErrorMap.mockReturnValue({});
        render(<MenteeOnboardingShell />);
        await user.click(screen.getByRole("button", { name: /Complete Profile/ }));
        expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled();
    });

    it("sets a field error on blur and clears it on change", () => {
        const ctx = setup();
        mockGetFieldErrorMap.mockReturnValue({ bio: true });
        render(<MenteeOnboardingShell />);
        const input = screen.getByTestId("personal-info-stub");

        fireEvent.blur(input);
        expect(input).toHaveAttribute("aria-invalid", "true");

        fireEvent.change(input, { target: { name: "bio", value: "A" } });
        expect(ctx.handleChange).toHaveBeenCalled();
        expect(input).toHaveAttribute("aria-invalid", "false");
    });


    it("leaves fields unmarked when blur validation reports no error", () => {
        setup();
        mockGetFieldErrorMap.mockReturnValue({});
        render(<MenteeOnboardingShell />);
        const input = screen.getByTestId("personal-info-stub");
        fireEvent.blur(input);
        expect(input).toHaveAttribute("aria-invalid", "false");
    });

});
