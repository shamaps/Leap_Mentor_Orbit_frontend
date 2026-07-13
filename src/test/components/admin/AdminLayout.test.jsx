import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import React from "react";
import { BrowserRouter, useNavigate } from "react-router-dom";
import AdminLayout from "../../../components/admin/AdminLayout";
import adminAxiosInstance from "../../../utils/adminAxiosInstance";

// Mock subcomponents and routing packages
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        Outlet: () => <div data-testid="mock-outlet">Mock Page Content</div>,
    };
});

vi.mock("../../../utils/adminAxiosInstance", () => ({
    default: {
        get: vi.fn((url) => {
            if (url === "/admin/auth/me") {
                return Promise.resolve({ data: { admin: { name: "Jane Admin", email: "jane@test.com" } } });
            }
            if (url === "/admin/leap-requests/pending-count") {
                return Promise.resolve({ data: { count: 12 } });
            }
            return Promise.resolve({ data: {} });
        }),
        post: vi.fn(() => Promise.resolve({})),
    },
}));

vi.mock("../../../utils/logger", () => ({
    default: {
        error: vi.fn(),
    },
}));

vi.mock("../../../constants/images", () => ({
    IMAGES: {
        logo: "mock-logo-url.png",
    },
}));

describe("AdminLayout Component Suite", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should mount structural sidebar navigation blocks and read user metadata info from API requests", async () => {
        render(
            <BrowserRouter>
                <AdminLayout />
            </BrowserRouter>
        );

        // Verify initial profile layout paints with server metadata values
        await waitFor(() => {
            expect(screen.getByText("Jane Admin")).toBeInTheDocument();
        });
        expect(screen.getByText("jane@test.com")).toBeInTheDocument();
        expect(screen.getByText("User Management")).toBeInTheDocument();
        expect(screen.getByTestId("mock-outlet")).toBeInTheDocument();
    });

    it("should toggle the sidebar visibility layers when mobile view buttons trigger click events", async () => {
        render(
            <BrowserRouter>
                <AdminLayout />
            </BrowserRouter>
        );

        // Sidebar overlay button shouldn't exist initially since state defaults to false
        expect(screen.queryByLabelText("Close sidebar")).not.toBeInTheDocument();

        // Trigger mobile hamburger button toggle to open the layout menu
        const burgerBtn = document.querySelector("header button");
        expect(burgerBtn).toBeInTheDocument();
        fireEvent.click(burgerBtn);

        // Verify backdrop overlay mounts correctly
        const closeBackdrop = screen.getByLabelText("Close sidebar");
        expect(closeBackdrop).toBeInTheDocument();

        // Click backdrop overlay to close side panel navigation drawer
        fireEvent.click(closeBackdrop);
        expect(screen.queryByLabelText("Close sidebar")).not.toBeInTheDocument();
    });

    it("should continuously re-poll the pending counts tracking endpoints via structured time intervals", async () => {
        vi.useFakeTimers();

        render(
            <BrowserRouter>
                <AdminLayout />
            </BrowserRouter>
        );

        expect(adminAxiosInstance.get).toHaveBeenCalledWith("/admin/leap-requests/pending-count");

        // Advance mock runtime clock by 60 seconds to force interval callback loop execution
        await act(async () => {
            vi.advanceTimersByTime(60000);
        });

        expect(adminAxiosInstance.get).toHaveBeenCalledTimes(3); // 1 for user info, 2 for badges
        vi.useRealTimers();
    });

    it("should hit logout thunk thunk thunk blocks and gracefully clear server auth cookies upon click events", async () => {
        adminAxiosInstance.post.mockResolvedValueOnce({});

        render(
            <BrowserRouter>
                <AdminLayout />
            </BrowserRouter>
        );

        // Use top header online logout button block to execute action paths
        const logoutBtns = screen.getAllByRole("button", { name: "Logout" });
        expect(logoutBtns.length).toBeGreaterThan(0);

        await act(async () => {
            fireEvent.click(logoutBtns[0]);
        });

        expect(adminAxiosInstance.post).toHaveBeenCalledWith("/admin/auth/logout");
        expect(mockNavigate).toHaveBeenCalledWith("/admin/login");
    });

    it("should redirect cleanly to login panel view if backend post request fails during sign-out", async () => {
        adminAxiosInstance.post.mockRejectedValueOnce(new Error("API Cookie Purge Error"));

        render(
            <BrowserRouter>
                <AdminLayout />
            </BrowserRouter>
        );

        const logoutBtns = screen.getAllByRole("button", { name: "Logout" });

        await act(async () => {
            fireEvent.click(logoutBtns[0]);
        });

        // Validates that state engines drop users to login pages regardless of background api faults
        expect(mockNavigate).toHaveBeenCalledWith("/admin/login");
    });
});