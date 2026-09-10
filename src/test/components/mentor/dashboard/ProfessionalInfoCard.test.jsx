import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ProfessionalInfoCard from "../../../../features/mentor/view/components/dashboard/ProfessionalInfoCard";

let mockMentorProfile;

vi.mock("../../../../app/store/selectors", () => ({
    selectMentorProfile: () => mockMentorProfile,
}));

vi.mock("react-redux", () => ({
    useSelector: (selectorFn) => selectorFn(),
}));

describe("ProfessionalInfoCard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockMentorProfile = {
            profile: {
                currentRole: "Product Manager",
                industry: "Fintech",
                company: "Nova Bank",
                yearsOfExperience: 6,
                hourlyRate: 0,
                avgRating: 0,
            },
        };
    });

    it("renders the card heading", () => {
        render(<ProfessionalInfoCard />);
        expect(screen.getByText("Professional Info")).toBeInTheDocument();
    });

    it("renders core professional fields", () => {
        render(<ProfessionalInfoCard />);

        expect(screen.getByText("Current Role")).toBeInTheDocument();
        expect(screen.getByText("Product Manager")).toBeInTheDocument();
        expect(screen.getByText("Industry")).toBeInTheDocument();
        expect(screen.getByText("Fintech")).toBeInTheDocument();
        expect(screen.getByText("Company")).toBeInTheDocument();
        expect(screen.getByText("Nova Bank")).toBeInTheDocument();
    });

    it("formats years of experience with a '+' suffix", () => {
        render(<ProfessionalInfoCard />);

        expect(screen.getByText("Experience")).toBeInTheDocument();
        expect(screen.getByText("6+ Years")).toBeInTheDocument();
    });

    it("shows em dash for experience when not provided", () => {
        mockMentorProfile.profile.yearsOfExperience = 0;
        render(<ProfessionalInfoCard />);

        const experienceLabel = screen.getByText("Experience");
        expect(experienceLabel.parentElement).toHaveTextContent("—");
    });

    it("does not render Session Rate when hourlyRate is 0", () => {
        render(<ProfessionalInfoCard />);
        expect(screen.queryByText("Session Rate")).not.toBeInTheDocument();
    });

    it("renders Session Rate when hourlyRate is greater than 0", () => {
        mockMentorProfile.profile.hourlyRate = 50;
        render(<ProfessionalInfoCard />);

        expect(screen.getByText("Session Rate")).toBeInTheDocument();
        expect(screen.getByText("50 LP")).toBeInTheDocument();
    });

    it("does not render Rating when avgRating is 0", () => {
        render(<ProfessionalInfoCard />);
        expect(screen.queryByText("Rating")).not.toBeInTheDocument();
    });

    it("renders Rating formatted to one decimal when avgRating is greater than 0", () => {
        mockMentorProfile.profile.avgRating = 4.567;
        render(<ProfessionalInfoCard />);

        expect(screen.getByText("Rating")).toBeInTheDocument();
        expect(screen.getByText("⭐ 4.6 / 5")).toBeInTheDocument();
    });

    it("renders em dashes when profile fields are missing", () => {
        mockMentorProfile = { profile: {} };
        render(<ProfessionalInfoCard />);

        const dashes = screen.getAllByText("—");
        expect(dashes.length).toBeGreaterThan(0);
    });

    it("handles a completely undefined profile gracefully", () => {
        mockMentorProfile = {};
        render(<ProfessionalInfoCard />);

        expect(screen.getByText("Professional Info")).toBeInTheDocument();
        expect(screen.getAllByText("—").length).toBe(4);
    });
});