// components/mentee/dashboard/__tests__/ProfileTab.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useSelector } from "react-redux";
import ProfileTab from "../../../../features/mentee/view/components/dashboard/ProfileTab";

vi.mock("react-redux", () => ({
    useSelector: vi.fn(),
}));

vi.mock("../../../../app/store/selectors", () => ({
    selectMenteeProfile: vi.fn((state) => state),
}));
vi.mock("react-router-dom", () => ({
    useNavigate: vi.fn(() => vi.fn()),
}));
vi.mock("../../../../features/mentee/view/components/dashboard/ProfileHeroCard", () => ({
    default: ({ user, profile }) => (
        <div data-testid="hero-card">{user?.name ?? "no-user"}|{profile?.bio ?? "no-bio"}</div>
    ),
}));
vi.mock("../../../../features/mentee/view/components/dashboard/ProfessionalDetailsCard", () => ({
    default: ({ profile }) => (
        <div data-testid="professional-card">{profile?.currentRole ?? "no-role"}</div>
    ),
}));
vi.mock("../../../../features/mentee/view/components/dashboard/InterestedFieldsCard", () => ({
    default: ({ profile }) => (
        <div data-testid="interested-fields-card">
            {profile?.interestedFields?.join(",") ?? "no-fields"}
        </div>
    ),
}));
vi.mock("../../../../features/mentee/view/components/dashboard/SocialPresenceCard", () => ({
    default: ({ profile }) => (
        <div data-testid="social-card">{profile?.linkedInUrl ?? "no-linkedin"}</div>
    ),
}));
vi.mock("@/features/mentor/view/components/dashboard/MentorshipPrefsCard", () => ({
    default: ({ profile }) => (
        <div data-testid="mentorship-prefs-card">{profile?.timezone ?? "no-timezone"}</div>
    ),
}));

describe("ProfileTab", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders the heading and passes user/profile down to child cards", () => {
        useSelector.mockReturnValue({
            user: { name: "Shama Kausar" },
            profile: {
                bio: "Building LeapMentor",
                currentRole: "SDE Intern",
                interestedFields: ["AI/ML"],
                linkedInUrl: "https://linkedin.com/in/shama",
                timezone: "IST",
            },
        });

        render(<ProfileTab />);

        expect(screen.getByText("Mentee Dashboard")).toBeInTheDocument();
        expect(screen.getByTestId("hero-card")).toHaveTextContent(
            "Shama Kausar|Building LeapMentor",
        );
        expect(screen.getByTestId("professional-card")).toHaveTextContent(
            "SDE Intern",
        );
        expect(screen.getByTestId("interested-fields-card")).toHaveTextContent(
            "AI/ML",
        );
        expect(screen.getByTestId("social-card")).toHaveTextContent(
            "https://linkedin.com/in/shama",
        );
        expect(screen.getByTestId("mentorship-prefs-card")).toHaveTextContent(
            "IST",
        );
    });

    it("renders an em-dash for the last-updated date when profile.updatedAt is absent", () => {
        useSelector.mockReturnValue({ user: {}, profile: {} });

        render(<ProfileTab />);

        expect(screen.getByText(/Last profile update:/)).toHaveTextContent("—");
    });

    it("formats profile.updatedAt into a readable date when present", () => {
        useSelector.mockReturnValue({
            user: {},
            profile: { updatedAt: "2026-03-15T00:00:00.000Z" },
        });

        render(<ProfileTab />);

        const expected = new Date("2026-03-15T00:00:00.000Z").toLocaleDateString(
            "en-US",
            { month: "short", day: "numeric", year: "numeric" },
        );
        expect(screen.getByText(/Last profile update:/)).toHaveTextContent(
            expected,
        );
    });

    it("handles a completely undefined user and profile gracefully", () => {
        useSelector.mockReturnValue({ user: undefined, profile: undefined });

        render(<ProfileTab />);

        expect(screen.getByTestId("hero-card")).toHaveTextContent(
            "no-user|no-bio",
        );
        expect(screen.getByTestId("professional-card")).toHaveTextContent(
            "no-role",
        );
    });
});