import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import MentorshipPrefsCard from "../../../../features/mentor/view/components/dashboard/MentorshipPrefsCard";

let mockMentorProfile;

vi.mock("../../../../app/store/selectors", () => ({
    selectMentorProfile: () => mockMentorProfile,
}));

vi.mock("react-redux", () => ({
    useSelector: (selectorFn) => selectorFn(),
}));

vi.mock("../../../../shared/constants/mentorshipPrefs", () => ({
    COMM_ICONS: {
        email: "📧",
        chat: "💬",
    },
}));

vi.mock("../../../../shared/components/PrefsCardHeader", () => ({
    default: () => <div data-testid="prefs-card-header" />,
}));

describe("MentorshipPrefsCard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockMentorProfile = {
            profile: {
                communicationPreferences: ["email", "chat"],
                languages: ["English", "Spanish"],
            },
        };
    });

    it("renders the header component and section labels", () => {
        render(<MentorshipPrefsCard />);

        expect(screen.getByTestId("prefs-card-header")).toBeInTheDocument();
        expect(screen.getByText("Communication Channels")).toBeInTheDocument();
        expect(screen.getByText("Languages")).toBeInTheDocument();
    });

    it("falls back to the Redux mentor profile when no profile prop is passed", () => {
        render(<MentorshipPrefsCard />);

        expect(screen.getByText("email")).toBeInTheDocument();
        expect(screen.getByText("chat")).toBeInTheDocument();
        expect(screen.getByText("English, Spanish")).toBeInTheDocument();
    });

    it("uses the profile prop override when provided instead of the Redux store", () => {
        const overrideProfile = {
            communicationPreferences: ["video"],
            languages: ["French"],
        };

        render(<MentorshipPrefsCard profile={overrideProfile} variant="mentee" />);

        expect(screen.getByText("video")).toBeInTheDocument();
        expect(screen.getByText("French")).toBeInTheDocument();
        expect(screen.queryByText("email")).not.toBeInTheDocument();
    });

    it("renders known icons for communication preferences and a default for unknown ones", () => {
        mockMentorProfile.profile.communicationPreferences = ["email", "video"];
        render(<MentorshipPrefsCard />);

        const emailBadge = screen.getByText("email").closest("span");
        expect(emailBadge).toHaveTextContent("📧");

        const videoBadge = screen.getByText("video").closest("span");
        expect(videoBadge).toHaveTextContent("💬");
    });

    it("shows em dash placeholders when there are no communication prefs or languages", () => {
        mockMentorProfile.profile.communicationPreferences = [];
        mockMentorProfile.profile.languages = [];
        render(<MentorshipPrefsCard />);

        const dashes = screen.getAllByText("—");
        expect(dashes.length).toBe(2);
    });

    it("handles a completely missing profile without crashing", () => {
        mockMentorProfile = {};
        render(<MentorshipPrefsCard />);

        expect(screen.getByText("Communication Channels")).toBeInTheDocument();
        expect(screen.getAllByText("—").length).toBe(2);
    });
});