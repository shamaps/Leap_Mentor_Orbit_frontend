import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { Navigate } from "react-router-dom";
import AdminRoute from "../../../features/admin/view/components/AdminRoute";
import adminAxiosInstance from "../../../shared/utils/axiosInstance";

// Mock Navigate to trace routing redirects cleanly
vi.mock("react-router-dom", () => ({
    Navigate: vi.fn(({ to }) => <div data-testid="mock-navigate" data-to={to} />),
}));

// Mock custom admin axios instance pipelines
vi.mock("../../../shared/utils/axiosInstance", () => ({
    default: {
        get: vi.fn(() => Promise.resolve({ data: {} })),
    },
}));

describe("AdminRoute Component Suite", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should display a loading screen while verifying admin sessions", () => {
        // Keep backend verification request permanently pending
        adminAxiosInstance.get.mockReturnValueOnce(new Promise(() => { }));

        render(
            <AdminRoute>
                <div data-testid="admin-child">Protected Content</div>
            </AdminRoute>
        );

        expect(screen.getByText("Verifying admin session...")).toBeInTheDocument();
        expect(screen.queryByTestId("admin-child")).not.toBeInTheDocument();
    });

    it("should render protected children if backend cookie validation succeeds", async () => {
        adminAxiosInstance.get.mockResolvedValueOnce({
            data: { admin: { name: "Super Admin", email: "admin@leapmentor.com" } },
        });

        render(
            <AdminRoute>
                <div data-testid="admin-child">Protected Content</div>
            </AdminRoute>
        );

        await waitFor(() => {
            expect(screen.getByTestId("admin-child")).toBeInTheDocument();
        });
        expect(screen.queryByText("Verifying admin session...")).not.toBeInTheDocument();
        expect(screen.queryByTestId("mock-navigate")).not.toBeInTheDocument();
    });

    it("should securely redirect to admin login view if authentication fails", async () => {
        adminAxiosInstance.get.mockRejectedValueOnce({
            response: { status: 401, data: { message: "Unauthorized Session" } },
        });

        render(
            <AdminRoute>
                <div data-testid="admin-child">Protected Content</div>
            </AdminRoute>
        );

        await waitFor(() => {
            expect(screen.getByTestId("mock-navigate")).toBeInTheDocument();
        });
        expect(screen.getByTestId("mock-navigate")).toHaveAttribute("data-to", "/admin/login");
        expect(screen.queryByTestId("admin-child")).not.toBeInTheDocument();
    });
});