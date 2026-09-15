
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import DashboardTopbar from "../../../shared/components/DashboardTopbar";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

// ── Mock Framework Dependencies ──
vi.mock("react-router-dom", () => ({
    useNavigate: vi.fn(),
}));

vi.mock("react-redux", () => ({
    useDispatch: vi.fn(),
    useSelector: vi.fn(),
}));

vi.mock("../../../app/store/slices/authSlice", () => ({
    logoutUser: vi.fn(() => ({ type: "auth/logout-mock-action" })),
}));

vi.mock("../../../shared/constants/images", () => ({
    IMAGES: { logo: "mock-logo-url-filepath.png" },
}));

describe("DashboardTopbar Component Suite", () => {
    const mockNavigate = vi.fn();
    const mockDispatch = vi.fn(() => Promise.resolve());
    const mockOnMenuToggle = vi.fn();
    const mockOnLogoClick = vi.fn();

    const baseProps = {
        onMenuToggle: mockOnMenuToggle,
        onLogoClick: mockOnLogoClick,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useNavigate.mockReturnValue(mockNavigate);
        useDispatch.mockReturnValue(mockDispatch);
    });

    describe("Structural Elements & Actions Testing", () => {
        it("should render application identity details and trigger menu toggles correctly", () => {
            render(<DashboardTopbar {...baseProps} />);

            // Assert identity logo displays properties cleanly
            const logoImg = screen.getByAltText("LeapMentor logo");
            expect(logoImg).toHaveAttribute("src", "mock-logo-url-filepath.png");
            expect(screen.getByText("LeapMentor")).toBeInTheDocument();

            // Trigger hamburger mobile menu click actions
            const hamburgerBtn = screen.getByLabelText(/Open menu/i);
            fireEvent.click(hamburgerBtn);
            expect(mockOnMenuToggle).toHaveBeenCalled();
        });

        it("should execute customized callback redirection loops when clicking identity logo items", () => {
            render(<DashboardTopbar {...baseProps} />);

            const logoHomeBtn = screen.getByLabelText(/Go to Home/i);
            fireEvent.click(logoHomeBtn);
            expect(mockOnLogoClick).toHaveBeenCalled();
        });
    });

    describe("Asynchronous Secure Logout Process Pipeline", () => {
        it("should dispatch token eviction actions and redirect active routes straight into login portals on click", async () => {
            render(<DashboardTopbar {...baseProps} />);

            const logoutButton = screen.getByRole("button", { name: /Logout/i });
            fireEvent.click(logoutButton);

            // Wait until asynchronous side effects dispatch actions and alter window locations completely
            await waitFor(() => {
                expect(mockDispatch).toHaveBeenCalled();
                expect(mockNavigate).toHaveBeenCalledWith("/login");
            });
        });
    });
});