import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import ProfileCard from "../../../../features/mentor/view/components/dashboard/ProfileCard";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

let mockMentorProfile;

vi.mock("../../../../app/store/selectors", () => ({
    selectMentorProfile: () => mockMentorProfile,
}));

vi.mock("react-redux", () => ({
    useSelector: (selectorFn) => selectorFn(),
}));

const renderCard = (props = {}) =>
    render(
        <BrowserRouter>
            <ProfileCard {...props} />
        </BrowserRouter>
    );

describe("ProfileCard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockMentorProfile = {
            user: { name: "Jordan Rivera" },
            profile: {
                currentRole: "Senior Engineer",
                company: "Acme Corp",
                bio: "Helping developers grow their careers.",
                profilePicture: "",
                verificationStatus: "unverified",
            },
        };
    });

    it("renders the mentor's name, role and company", () => {
        renderCard();

        expect(screen.getByText("Jordan Rivera")).toBeInTheDocument();
        expect(screen.getByText("Senior Engineer & Acme Corp")).toBeInTheDocument();
    });

    it("shows a fallback initial avatar when no profile picture is present", () => {
        renderCard();

        expect(screen.getByText("J")).toBeInTheDocument();
    });

    it("renders the profile picture and swaps to fallback on image error", () => {
        mockMentorProfile.profile.profilePicture = "https://example.com/avatar.png";
        renderCard();

        const img = screen.getByAltText("Jordan Rivera");
        expect(img).toBeInTheDocument();

        fireEvent.error(img);

        expect(screen.getByText("J")).toBeInTheDocument();
    });

    it("renders the bio when present", () => {
        renderCard();

        expect(screen.getByText("BIO")).toBeInTheDocument();
        expect(
            screen.getByText("Helping developers grow their careers.")
        ).toBeInTheDocument();
    });

    it("does not render a bio section when bio is missing", () => {
        mockMentorProfile.profile.bio = "";
        renderCard();

        expect(screen.queryByText("BIO")).not.toBeInTheDocument();
    });

    it("shows the Unverified badge and upload CTA when verificationStatus is unverified", () => {
        renderCard();

        expect(screen.getByText("Unverified")).toBeInTheDocument();
        expect(
            screen.getByText("Upload Verification Documents")
        ).toBeInTheDocument();
    });

    it("shows the Under Review badge and hides upload CTA when status is pending", () => {
        mockMentorProfile.profile.verificationStatus = "pending";
        renderCard();

        expect(screen.getByText("Under Review")).toBeInTheDocument();
        expect(
            screen.queryByText("Upload Verification Documents")
        ).not.toBeInTheDocument();
    });

    it("shows the Verified badge and hides upload CTA when status is verified", () => {
        mockMentorProfile.profile.verificationStatus = "verified";
        renderCard();

        expect(screen.getByText("Verified")).toBeInTheDocument();
        expect(
            screen.queryByText("Upload Verification Documents")
        ).not.toBeInTheDocument();
    });

    it("navigates to verify-documents when the upload CTA is clicked", () => {
        renderCard();

        fireEvent.click(screen.getByText("Upload Verification Documents"));

        expect(mockNavigate).toHaveBeenCalledWith(
            "/onboarding/mentor/verify-documents"
        );
    });

    it("falls back to em dash and 'M' initial when user/profile data is missing", () => {
        mockMentorProfile = { user: {}, profile: {} };
        renderCard();

        const dashes = screen.getAllByText("—");
        expect(dashes.length).toBe(2); // name heading + role/company line
        expect(screen.getByText("M")).toBeInTheDocument();
    });
});