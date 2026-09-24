import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Home from "../../shared/marketing/Home";
import { selectAuthToken, selectAuthUser } from "../../app/store/selectors";

vi.mock("react-router-dom", () => ({
    useNavigate: vi.fn(),
}));

vi.mock("react-redux", () => ({
    useSelector: vi.fn(),
}));

describe("Home Component Suite", () => {
    let mockNavigate;

    beforeEach(() => {
        vi.clearAllMocks();
        mockNavigate = vi.fn();
        useNavigate.mockReturnValue(mockNavigate);
    });

    it("should render full static content modules if user token is completely absent", () => {
        useSelector.mockImplementation((selector) => {
            if (selector === selectAuthToken) return null;
            if (selector === selectAuthUser) return null;
            return null;
        });

        render(<Home />);
        expect(screen.getAllByText("LeapMentor").length).toBeGreaterThan(0);
        expect(screen.getByRole("button", { name: /Login/i })).toBeInTheDocument();
        expect(screen.getByText(/Empower Your/i)).toBeInTheDocument();
        expect(screen.getByText(/Expert Mentorship/i)).toBeInTheDocument();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("should securely redirect active mentor profile tokens immediately to mentor dashboards", () => {
        useSelector.mockImplementation((selector) => {
            if (selector === selectAuthToken) return "mock-valid-token-string";
            if (selector === selectAuthUser) return { roles: ["user", "mentor"] };
            return null;
        });

        render(<Home />);

        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/mentor", { replace: true });
    });

    it("should securely redirect active mentee profile tokens immediately to mentee dashboards", () => {
        useSelector.mockImplementation((selector) => {
            if (selector === selectAuthToken) return "mock-valid-token-string";
            if (selector === selectAuthUser) return { roles: ["mentee"] };
            return null;
        });

        render(<Home />);

        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/mentee", { replace: true });
    });

    it("should remain on the base marketing page layout if token is active but roles index resolves to null", () => {
        useSelector.mockImplementation((selector) => {
            if (selector === selectAuthToken) return "mock-valid-token-string";
            if (selector === selectAuthUser) return { roles: null };
            return null;
        });

        render(<Home />);

        expect(mockNavigate).not.toHaveBeenCalled();
        expect(screen.getByText(/Expert Mentorship/i)).toBeInTheDocument();
    });

    it("should handle unrecognized edge profiles gracefully without dashboard path matching", () => {
        useSelector.mockImplementation((selector) => {
            if (selector === selectAuthToken) return "mock-valid-token-string";
            if (selector === selectAuthUser) return { roles: ["unrecognized-guest-type"] };
            return null;
        });

        render(<Home />);

        expect(mockNavigate).not.toHaveBeenCalled();
    });
});