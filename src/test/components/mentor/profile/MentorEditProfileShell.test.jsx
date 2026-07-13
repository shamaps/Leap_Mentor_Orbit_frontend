import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import MentorEditProfileShell from "../../../../components/mentor/profile/MentorEditProfileShell";

// ── Hook mock control state ──
const mockHandleChange = vi.fn();
const mockHandleSubmit = vi.fn((e) => e?.preventDefault?.());
let mockForm = { name: "Jane Doe" };
let mockLoading = false;
let mockFetchLoading = false;
let mockMsg = { type: "", text: "" };

vi.mock("../../../../hooks/useMentorEditProfile", () => ({
    default: () => ({
        form: mockForm,
        loading: mockLoading,
        fetchLoading: mockFetchLoading,
        msg: mockMsg,
        handleChange: mockHandleChange,
        handleSubmit: mockHandleSubmit,
    }),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

// ── Context mock: keep the real context object so Provider/consumer wiring
// still works, but we don't need consumers to assert on it directly here ──
vi.mock("../../../../context/MentorOnboardingFormContext", () => ({
    MentorOnboardingFormContext: React.createContext(null),
}));

// ── Section stubs ──
vi.mock("../../../../components/mentor/onboarding/PersonalInfoSection", () => ({
    default: () => <div data-testid="section-personal-info">Personal Info</div>,
}));
vi.mock("../../../../components/mentor/onboarding/ProfessionalInfoSection", () => ({
    default: () => <div data-testid="section-professional-info">Professional Info</div>,
}));
vi.mock("../../../../components/mentor/onboarding/SkillsSection", () => ({
    default: () => <div data-testid="section-skills">Skills</div>,
}));
vi.mock("../../../../components/mentor/onboarding/PreferencesSection", () => ({
    default: () => <div data-testid="section-preferences">Preferences</div>,
}));
vi.mock("../../../../components/mentor/onboarding/SocialLinksSection", () => ({
    default: () => <div data-testid="section-social-links">Social Links</div>,
}));

describe("MentorEditProfileShell Component Suite", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockForm = { name: "Jane Doe" };
        mockLoading = false;
        mockFetchLoading = false;
        mockMsg = { type: "", text: "" };
    });

    it("should render only the loading spinner and skip the form while the profile is being fetched", () => {
        mockFetchLoading = true;

        render(<MentorEditProfileShell />);

        expect(screen.queryByRole("heading", { name: /Update Your Profile/i })).not.toBeInTheDocument();
        expect(screen.queryByTestId("section-personal-info")).not.toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Save Changes/i })).not.toBeInTheDocument();
    });

    it("should render the header, all form sections, and the save button once fetching completes", () => {
        render(<MentorEditProfileShell />);

        expect(screen.getByRole("heading", { name: /Update Your Profile/i })).toBeInTheDocument();
        expect(screen.getByText("Edit Profile")).toBeInTheDocument();

        expect(screen.getByTestId("section-personal-info")).toBeInTheDocument();
        expect(screen.getByTestId("section-professional-info")).toBeInTheDocument();
        expect(screen.getByTestId("section-skills")).toBeInTheDocument();
        expect(screen.getByTestId("section-preferences")).toBeInTheDocument();
        expect(screen.getByTestId("section-social-links")).toBeInTheDocument();

        expect(screen.getByRole("button", { name: /Save Changes →/i })).toBeInTheDocument();
    });

    it("should navigate back to the mentor dashboard when the back button is clicked", () => {
        render(<MentorEditProfileShell />);

        fireEvent.click(screen.getByRole("button", { name: /Back to Dashboard/i }));

        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/mentor");
    });

    it("should display a success message with the affirmative styling when msg.type is success", () => {
        mockMsg = { type: "success", text: "Profile updated successfully." };

        render(<MentorEditProfileShell />);

        const message = screen.getByText("Profile updated successfully.");
        expect(message).toBeInTheDocument();
        expect(message.closest("div")).toHaveClass("text-[#16a34a]");
        expect(screen.getByText("✓")).toBeInTheDocument();
    });

    it("should display an error message with the destructive styling when msg.type is error", () => {
        mockMsg = { type: "error", text: "Something went wrong while saving." };

        render(<MentorEditProfileShell />);

        const message = screen.getByText("Something went wrong while saving.");
        expect(message).toBeInTheDocument();
        expect(message.closest("div")).toHaveClass("text-[#e11d48]");
        expect(screen.getByText("⚠")).toBeInTheDocument();
    });

    it("should not render a message block when msg.text is empty", () => {
        render(<MentorEditProfileShell />);

        expect(screen.queryByText("✓")).not.toBeInTheDocument();
        expect(screen.queryByText("⚠")).not.toBeInTheDocument();
    });

    it("should show the saving indicator and disable the submit button while loading is true", () => {
        mockLoading = true;

        render(<MentorEditProfileShell />);

        const button = screen.getByRole("button", { name: /Saving changes…/i });
        expect(button).toBeInTheDocument();
        expect(button).toBeDisabled();
        expect(screen.queryByText("Save Changes →")).not.toBeInTheDocument();
    });

    it("should invoke handleSubmit when the form is submitted", () => {
        render(<MentorEditProfileShell />);

        const submitButton = screen.getByRole("button", { name: /Save Changes →/i });
        fireEvent.click(submitButton);

        expect(mockHandleSubmit).toHaveBeenCalledTimes(1);
    });

    it("should render the helper text about editing the profile from the dashboard", () => {
        render(<MentorEditProfileShell />);

        expect(
            screen.getByText("You can always edit your profile from the dashboard.")
        ).toBeInTheDocument();
    });
});