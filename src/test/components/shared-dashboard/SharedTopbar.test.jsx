// src/test/components/shared-dashboard/SharedTopbar.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import SharedTopbar from "../../../features/shared-dashboard/view/components/SharedTopbar";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock("../../../shared/constants/images", () => ({
    IMAGES: { logo: "logo.png" },
}));

describe("SharedTopbar", () => {
    beforeEach(() => {
        mockNavigate.mockReset();
    });

    it("renders the logo and 'Shared Session' badge", () => {
        render(
            <SharedTopbar
                viewerRole="mentee"
                onMenuToggle={vi.fn()}
                onLogoClick={vi.fn()}
            />,
        );
        expect(screen.getByAltText("LeapMentor logo")).toBeInTheDocument();
        expect(screen.getByText("LeapMentor")).toBeInTheDocument();
        expect(screen.getByText("Shared Session")).toBeInTheDocument();
        expect(screen.getByText("Live")).toBeInTheDocument();
    });

    it("calls onMenuToggle when the hamburger button is clicked", () => {
        const onMenuToggle = vi.fn();
        render(
            <SharedTopbar
                viewerRole="mentee"
                onMenuToggle={onMenuToggle}
                onLogoClick={vi.fn()}
            />,
        );
        const hamburger = document.querySelector(".shared-hamburger");
        act(() => {
            hamburger.click();
        });
        expect(onMenuToggle).toHaveBeenCalled();
    });

    it("calls onLogoClick when the logo button is clicked", () => {
        const onLogoClick = vi.fn();
        render(
            <SharedTopbar
                viewerRole="mentee"
                onMenuToggle={vi.fn()}
                onLogoClick={onLogoClick}
            />,
        );
        act(() => {
            screen.getByText("LeapMentor").closest("button").click();
        });
        expect(onLogoClick).toHaveBeenCalled();
    });

    it("navigates to /dashboard/mentee when back button clicked for a mentee viewer", () => {
        render(
            <SharedTopbar
                viewerRole="mentee"
                onMenuToggle={vi.fn()}
                onLogoClick={vi.fn()}
            />,
        );
        const backButtons = screen.getAllByText("Back");
        act(() => {
            backButtons[0].closest("button").click();
        });
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/mentee");
    });

    it("navigates to /dashboard/mentor when back button clicked for a mentor viewer", () => {
        render(
            <SharedTopbar
                viewerRole="mentor"
                onMenuToggle={vi.fn()}
                onLogoClick={vi.fn()}
            />,
        );
        const backButtons = screen.getAllByText("Back");
        act(() => {
            backButtons[0].closest("button").click();
        });
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/mentor");
    });

    it("changes background color on mouse enter and leave of the back button", () => {
        render(
            <SharedTopbar
                viewerRole="mentee"
                onMenuToggle={vi.fn()}
                onLogoClick={vi.fn()}
            />,
        );
        const backButtons = screen.getAllByText("Back");
        const backButton = backButtons[0].closest("button");

        expect(backButton).toHaveStyle({ backgroundColor: "#1e3a8a" });

        fireEvent.mouseEnter(backButton);
        expect(backButton).toHaveStyle({ backgroundColor: "#1e40af" });

        fireEvent.mouseLeave(backButton);
        expect(backButton).toHaveStyle({ backgroundColor: "#1e3a8a" });
    });
});