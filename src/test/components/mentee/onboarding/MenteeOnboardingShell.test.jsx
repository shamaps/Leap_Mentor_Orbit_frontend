// components/mentee/onboarding/MenteeOnboardingShell.test.jsx
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MenteeOnboardingShell from "../../../../components/mentee/onboarding/MenteeOnboardingShell";


const mockUseMenteeOnboarding = vi.fn();
vi.mock("@/hooks/useMenteeOnboarding", () => ({
    default: (...args) => mockUseMenteeOnboarding(...args),
}));

const mockGetFieldErrorMap = vi.fn();
vi.mock("@/schemas/onboardingSchemas", () => ({
    menteeOnboardingSchema: {},
    getFieldErrorMap: (...args) => mockGetFieldErrorMap(...args),
}));

vi.mock("@/ui/OnboardingProgressBar", () => ({
    default: () => <div data-testid="progress-bar" />,
}));

vi.mock("@/components/common/FullScreenLoader", () => ({
    default: ({ message }) => <div data-testid="fullscreen-loader">{message}</div>,
}));

vi.mock("@/constants/images", () => ({
    IMAGES: { logo: "/logo.png" },
}));

vi.mock("@/config/onboardingFields", () => ({
    MENTEE_ONBOARDING_FIELDS: [],
}));

// Static stubs — each renders a real DOM node carrying the name/data-field
// attributes the shell's scrollToFirstError logic looks for, without needing
// to reach into the real context.
vi.mock("@/components/mentee/onboarding/PersonalInfoSection", () => ({
    default: () => <input name="bio" data-testid="personal-info-stub" />,
}));
vi.mock("@/components/mentee/onboarding/ProfessionalDetailsSection", () => ({
    default: () => <input name="currentRole" data-testid="professional-details-stub" />,
}));
vi.mock("@/components/mentee/onboarding/InterestedFieldsSection", () => ({
    default: React.forwardRef((_, ref) => (
        <div ref={ref} data-field="interestedFields" data-testid="interested-fields-stub" />
    )),
}));
vi.mock("@/components/mentee/onboarding/MentorshipPrefsSection", () => ({
    default: () => <div data-testid="mentorship-prefs-stub" />,
}));
vi.mock("@/components/mentee/onboarding/SocialLinksSection", () => ({
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
});
