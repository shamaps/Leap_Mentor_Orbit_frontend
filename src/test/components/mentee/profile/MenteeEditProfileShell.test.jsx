import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import MenteeEditProfileShell from "../../../../components/mentee/profile/MenteeEditProfileShell";
import useMenteeEditProfile from "../../../../hooks/useMenteeEditProfile";

// Mock the custom react hook
vi.mock("../../../../hooks/useMenteeEditProfile", () => ({
    default: vi.fn(),
}));

// Mock the react-router useNavigate hook
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock child form sections to keep the test focused on the Shell
vi.mock("../../../../components/mentee/onboarding/PersonalInfoSection", () => ({ default: () => <div data-testid="personal-info" /> }));
vi.mock("../../../../components/mentee/onboarding/ProfessionalDetailsSection", () => ({ default: () => <div data-testid="professional-details" /> }));
vi.mock("../../../../components/mentee/onboarding/InterestedFieldsSection", () => ({ default: () => <div data-testid="interested-fields" /> }));
vi.mock("../../../../components/mentee/onboarding/MentorshipPrefsSection", () => ({ default: () => <div data-testid="mentorship-prefs" /> }));
vi.mock("../../../../components/mentee/onboarding/SocialLinksSection", () => ({ default: () => <div data-testid="social-links" /> }));

describe("MenteeEditProfileShell Component", () => {
    let mockHandleChange;
    let mockHandleSubmit;

    beforeEach(() => {
        vi.clearAllMocks();
        mockHandleChange = vi.fn();
        mockHandleSubmit = vi.fn((e) => e.preventDefault());

        // Setup initial default return hook values
        useMenteeEditProfile.mockReturnValue({
            form: { name: "Test User" },
            loading: false,
            fetchLoading: false,
            msg: { text: "", type: "" },
            handleChange: mockHandleChange,
            handleSubmit: mockHandleSubmit,
        });
    });

    const renderWithRouter = (ui) => {
        return render(<BrowserRouter>{ui}</BrowserRouter>);
    };

    it("should render a full screen loader spinner when fetching profile data initially", () => {
        useMenteeEditProfile.mockReturnValueOnce({
            form: null,
            loading: false,
            fetchLoading: true,
            msg: { text: "", type: "" },
            handleChange: mockHandleChange,
            handleSubmit: mockHandleSubmit,
        });

        const { container } = renderWithRouter(<MenteeEditProfileShell />);

        const spinner = container.querySelector(".animate-spin");
        expect(spinner).toBeInTheDocument();
        expect(screen.queryByText("Edit Profile")).not.toBeInTheDocument();
    });

    it("should render headers, headings, and all nested onboarding child sub-sections on success", () => {
        renderWithRouter(<MenteeEditProfileShell />);

        expect(screen.getByText("Edit Profile")).toBeInTheDocument();
        expect(screen.getByText("Update Your Profile")).toBeInTheDocument();

        expect(screen.getByTestId("personal-info")).toBeInTheDocument();
        expect(screen.getByTestId("professional-details")).toBeInTheDocument();
        expect(screen.getByTestId("interested-fields")).toBeInTheDocument();
        expect(screen.getByTestId("mentorship-prefs")).toBeInTheDocument();
        expect(screen.getByTestId("social-links")).toBeInTheDocument();

        expect(screen.getByRole("button", { name: "Save Changes →" })).toBeInTheDocument();
    });

    it("should navigate back to the mentee dashboard if dashboard button link is triggered", async () => {
        const user = userEvent.setup();
        renderWithRouter(<MenteeEditProfileShell />);

        const backBtn = screen.getByRole("button", { name: /Back to Dashboard/i });
        await user.click(backBtn);

        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/mentee");
    });

    it("should render an emerald success notice box when success alert messages settle", () => {
        useMenteeEditProfile.mockReturnValueOnce({
            form: { name: "Test User" },
            loading: false,
            fetchLoading: false,
            msg: { text: "Profile updated successfully!", type: "success" },
            handleChange: mockHandleChange,
            handleSubmit: mockHandleSubmit,
        });

        renderWithRouter(<MenteeEditProfileShell />);

        const successMsg = screen.getByText("Profile updated successfully!");
        expect(successMsg).toBeInTheDocument();

        // Explicitly check classes on the text node parent
        expect(successMsg).toHaveClass("text-emerald-700");
        expect(successMsg).toHaveClass("bg-emerald-50");
        expect(screen.getByText("✓")).toBeInTheDocument();
    });

    it("should render a crimson warning error notice box when error alert messages return", () => {
        useMenteeEditProfile.mockReturnValueOnce({
            form: { name: "Test User" },
            loading: false,
            fetchLoading: false,
            msg: { text: "Something went wrong on the server.", type: "error" },
            handleChange: mockHandleChange,
            handleSubmit: mockHandleSubmit,
        });

        renderWithRouter(<MenteeEditProfileShell />);

        const errorMsg = screen.getByText("Something went wrong on the server.");
        expect(errorMsg).toBeInTheDocument();

        // Explicitly check classes on the text node parent
        expect(errorMsg).toHaveClass("text-red-600");
        expect(errorMsg).toHaveClass("bg-red-50");
        expect(screen.getByText("⚠")).toBeInTheDocument();
    });

    it("should invoke form submit action and toggle a disabled loader status text while saving is active", async () => {
        const user = userEvent.setup();
        useMenteeEditProfile.mockReturnValueOnce({
            form: { name: "Test User" },
            loading: true,
            fetchLoading: false,
            msg: { text: "", type: "" },
            handleChange: mockHandleChange,
            handleSubmit: mockHandleSubmit,
        });

        renderWithRouter(<MenteeEditProfileShell />);

        const submitBtn = screen.getByRole("button", { name: /Saving changes\.\.\./i });
        expect(submitBtn).toBeDisabled();

        const formElement = submitBtn.closest("form");
        fireEvent.submit(formElement);

        expect(mockHandleSubmit).toHaveBeenCalled();
    });
});