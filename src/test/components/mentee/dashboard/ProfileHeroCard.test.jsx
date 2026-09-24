// components/mentee/dashboard/__tests__/ProfileHeroCard.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProfileHeroCard from "../../../../features/mentee/view/components/dashboard/ProfileHeroCard";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

describe("ProfileHeroCard", () => {
    beforeEach(() => {
        mockNavigate.mockClear();
    });

    it("renders the fallback avatar initial when there is no profile picture", () => {
        render(
            <ProfileHeroCard user={{ name: "Shama Kausar" }} profile={{}} />,
        );
        expect(screen.getByText("S")).toBeInTheDocument();
    });

    it("falls back to 'M' initial when there is no user name and no picture", () => {
        render(<ProfileHeroCard user={{}} profile={{}} />);
        expect(screen.getByText("M")).toBeInTheDocument();
    });

    it("renders '—' for the name when user is undefined", () => {
        render(<ProfileHeroCard profile={{}} />);
        expect(screen.getByText("—")).toBeInTheDocument();
        expect(screen.getByText("M")).toBeInTheDocument();
    });

    it("prefers profilePicture160 over profilePicture when both are present", () => {
        const profile = {
            profilePicture: "full.jpg",
            profilePicture160: "thumb.jpg",
        };
        render(<ProfileHeroCard user={{ name: "Shama" }} profile={profile} />);

        const img = screen.getByRole("img");
        expect(img).toHaveAttribute("src", "thumb.jpg");
    });

    it("falls back to profilePicture when profilePicture160 is absent", () => {
        const profile = { profilePicture: "full.jpg" };
        render(<ProfileHeroCard user={{ name: "Shama" }} profile={profile} />);

        const img = screen.getByRole("img");
        expect(img).toHaveAttribute("src", "full.jpg");
    });

    it("shows the fallback initial after the image fails to load", () => {
        const profile = { profilePicture: "broken.jpg" };
        render(<ProfileHeroCard user={{ name: "Shama" }} profile={profile} />);

        const img = screen.getByRole("img");
        fireEvent.error(img);

        expect(screen.queryByRole("img")).not.toBeInTheDocument();
        expect(screen.getByText("S")).toBeInTheDocument();
    });

    it("renders the bio when present", () => {
        render(
            <ProfileHeroCard
                user={{ name: "Shama" }}
                profile={{ bio: "Full-stack developer intern." }}
            />,
        );
        expect(
            screen.getByText("Full-stack developer intern."),
        ).toBeInTheDocument();
    });

    it("does not render a bio paragraph when bio is absent", () => {
        render(<ProfileHeroCard user={{ name: "Shama" }} profile={{}} />);
        expect(screen.getByText("Bio")).toBeInTheDocument();
        // Only the "Bio" label paragraph should exist, no separate bio text node
        expect(screen.queryByText(/intern/i)).not.toBeInTheDocument();
    });

    it("navigates to the edit-profile route when the Edit Profile button is clicked", () => {
        render(<ProfileHeroCard user={{ name: "Shama" }} profile={{}} />);

        fireEvent.click(screen.getByRole("button", { name: /edit profile/i }));

        expect(mockNavigate).toHaveBeenCalledWith(
            "/dashboard/mentee/edit-profile",
        );
    });
});