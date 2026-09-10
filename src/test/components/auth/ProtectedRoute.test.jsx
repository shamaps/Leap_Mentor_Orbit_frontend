import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { useSelector } from "react-redux";
import ProtectedRoute from "../../../features/auth/view/components/ProtectedRoute";

vi.mock("react-redux", () => ({
    useSelector: vi.fn(),
}));

const renderWithRoute = (initialEntries = ["/protected"], role) => {
    return render(
        <MemoryRouter initialEntries={initialEntries}>
            <Routes>
                <Route
                    path="/protected"
                    element={
                        <ProtectedRoute role={role}>
                            <div>Protected Content</div>
                        </ProtectedRoute>
                    }
                />
                <Route path="/login" element={<div>Login Page</div>} />
                <Route path="/verify-email" element={<div>Verify Email Page</div>} />
                <Route path="/dashboard/mentor" element={<div>Mentor Dashboard</div>} />
                <Route path="/dashboard/mentee" element={<div>Mentee Dashboard</div>} />
            </Routes>
        </MemoryRouter>,
    );
};

describe("ProtectedRoute", () => {
    it("renders loader when isBootstrapping is true", () => {
        useSelector.mockReturnValue({ token: null, isBootstrapping: true, user: null });
        renderWithRoute();
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("redirects to /login when no token", () => {
        useSelector.mockReturnValue({ token: null, isBootstrapping: false, user: null });
        renderWithRoute();
        expect(screen.getByText("Login Page")).toBeInTheDocument();
    });

    it("redirects to /verify-email when email not verified", () => {
        useSelector.mockReturnValue({
            token: "abc",
            isBootstrapping: false,
            user: { isEmailVerified: false, email: "a@b.com", roles: ["mentee"] },
        });
        renderWithRoute();
        expect(screen.getByText("Verify Email Page")).toBeInTheDocument();
    });

    it("redirects to correct dashboard when role mismatches (mentor stored, mentee required)", () => {
        useSelector.mockReturnValue({
            token: "abc",
            isBootstrapping: false,
            user: { isEmailVerified: true, roles: ["mentor"] },
        });
        renderWithRoute(["/protected"], "mentee");
        expect(screen.getByText("Mentor Dashboard")).toBeInTheDocument();
    });

    it("renders children when token valid, verified, and role matches", () => {
        useSelector.mockReturnValue({
            token: "abc",
            isBootstrapping: false,
            user: { isEmailVerified: true, roles: ["mentor"] },
        });
        renderWithRoute(["/protected"], "mentor");
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("renders children when no role prop is passed (role check skipped)", () => {
        useSelector.mockReturnValue({
            token: "abc",
            isBootstrapping: false,
            user: { isEmailVerified: true, roles: ["mentee"] },
        });
        renderWithRoute(["/protected"]);
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("renders children when user has no roles array at all", () => {
        useSelector.mockReturnValue({
            token: "abc",
            isBootstrapping: false,
            user: { isEmailVerified: true },
        });
        renderWithRoute(["/protected"], "mentor");
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("renders children when user is null (storedRole stays null, role check skipped)", () => {
        useSelector.mockReturnValue({
            token: "abc",
            isBootstrapping: false,
            user: null,
        });
        renderWithRoute(["/protected"], "mentor");
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });
});