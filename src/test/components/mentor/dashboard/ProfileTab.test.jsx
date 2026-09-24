import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import ProfileTab from "../../../../features/mentor/view/components/dashboard/ProfileTab";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock("../../../../features/mentor/view/components/dashboard/ProfileCard", () => ({
    default: ({ onEditClick }) => (
        <div data-testid="profile-card">
            <button onClick={onEditClick}>card-edit</button>
        </div>
    ),
}));
vi.mock(
    "../../../../features/mentor/view/components/dashboard/ProfessionalInfoCard",
    () => ({
        default: () => <div data-testid="professional-info-card" />,
    })
);
vi.mock("../../../../features/mentor/view/components/dashboard/SkillsCard", () => ({
    default: () => <div data-testid="skills-card" />,
}));
vi.mock(
    "../../../../features/mentor/view/components/dashboard/MentorshipPrefsCard",
    () => ({
        default: ({ variant }) => (
            <div data-testid="mentorship-prefs-card">{variant}</div>
        ),
    })
);
vi.mock("../../../../features/mentor/view/components/dashboard/SocialCard", () => ({
    default: () => <div data-testid="social-card" />,
}));

const renderTab = (props = {}) =>
    render(
        <BrowserRouter>
            <ProfileTab {...props} />
        </BrowserRouter>
    );

describe("ProfileTab", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the dashboard heading and subtext", () => {
        renderTab({ user: {}, profile: {} });

        expect(screen.getByText("Mentor Dashboard")).toBeInTheDocument();
        expect(
            screen.getByText("Manage your professional identity and preferences.")
        ).toBeInTheDocument();
    });

    it("renders all child cards", () => {
        renderTab({ user: {}, profile: {} });

        expect(screen.getByTestId("profile-card")).toBeInTheDocument();
        expect(screen.getByTestId("professional-info-card")).toBeInTheDocument();
        expect(screen.getByTestId("skills-card")).toBeInTheDocument();
        expect(screen.getByTestId("mentorship-prefs-card")).toBeInTheDocument();
        expect(screen.getByTestId("social-card")).toBeInTheDocument();
    });

    it("passes the 'mentor' variant to MentorshipPrefsCard", () => {
        renderTab({ user: {}, profile: {} });

        expect(screen.getByTestId("mentorship-prefs-card")).toHaveTextContent(
            "mentor"
        );
    });

    it("navigates to edit-profile when the header Edit Profile button is clicked", () => {
        renderTab({ user: {}, profile: {} });

        fireEvent.click(screen.getByText("Edit Profile"));

        expect(mockNavigate).toHaveBeenCalledWith(
            "/dashboard/mentor/edit-profile"
        );
    });

    it("passes an onEditClick handler down to ProfileCard that also navigates to edit-profile", () => {
        renderTab({ user: {}, profile: {} });

        fireEvent.click(screen.getByText("card-edit"));

        expect(mockNavigate).toHaveBeenCalledWith(
            "/dashboard/mentor/edit-profile"
        );
    });

    it("shows an em dash for last updated date when profile.updatedAt is missing", () => {
        renderTab({ user: {}, profile: {} });

        expect(screen.getByText(/Last profile update:/)).toHaveTextContent("—");
    });

    it("formats and displays profile.updatedAt when present", () => {
        renderTab({
            user: {},
            profile: { updatedAt: "2026-03-15T00:00:00.000Z" },
        });

        expect(screen.getByText(/Last profile update:/)).toHaveTextContent(
            "Mar 15, 2026"
        );
    });

    it("renders gracefully when user and profile props are undefined", () => {
        renderTab();

        expect(screen.getByText("Mentor Dashboard")).toBeInTheDocument();
        expect(screen.getByText(/Last profile update:/)).toHaveTextContent("—");
    });
});