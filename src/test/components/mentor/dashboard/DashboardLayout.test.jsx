import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import DashboardLayout from "../../../../features/mentor/view/components/dashboard/DashboardLayout";
import useMentorDashboard from "../../../../features/mentor/presenter/useMentorDashboard";
import useUnreadCount from "../../../../features/shared-dashboard/presenter/useUnreadCount";

// Mock dependent hooks
vi.mock("../../../../features/mentor/presenter/useMentorDashboard", () => ({ default: vi.fn() }));
vi.mock("../../../../features/shared-dashboard/presenter/useUnreadCount", () => ({ default: vi.fn() }));
vi.mock("../../../../features/shared-dashboard/presenter/useSocketToast", () => ({ default: vi.fn() }));

// Mock subatomic common elements
vi.mock("../../../../shared/components/DashboardTopbar", () => ({
    default: ({ onMenuToggle, onLogoClick }) => (
        <div data-testid="topbar">
            <button onClick={onMenuToggle}>Open Menu</button>
            <button onClick={() => onLogoClick()}>Logo Click</button>
        </div>
    ),
}));

vi.mock("../../../../shared/components/DashboardSidebar", () => ({
    default: ({ setActiveTab, onClose, isOpen }) => (
        <div data-testid="sidebar">
            {isOpen && <p>Sidebar Is Open</p>}
            <button onClick={onClose}>Close Sidebar</button>
            <button onClick={() => setActiveTab("profile")}>Go Profile</button>
            <button onClick={() => setActiveTab("notifications")}>Go Notifications</button>
        </div>
    ),
}));

vi.mock("../../../../shared/components/ErrorState", () => ({
    default: ({ message, onAction }) => (
        <div data-testid="error-state">
            <p>{message}</p>
            <button onClick={onAction}>Retry</button>
        </div>
    ),
}));

// Mock Lazy Loaded Tabs
vi.mock("../../../../features/mentor/view/components/dashboard/MentorHomeTab", () => ({ default: () => <div data-testid="home-tab" /> }));
vi.mock("../../../../features/mentor/view/components/dashboard/ProfileTab", () => ({ default: () => <div data-testid="profile-tab" /> }));
vi.mock("../../../../features/notifications/view/NotificationsTabMentor", () => ({ default: () => <div data-testid="notifications-tab" /> }));

const mockRefetchProfile = vi.fn();
const mockClearBadge = vi.fn();

describe("DashboardLayout Component Suite", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        useMentorDashboard.mockReturnValue({
            user: { name: "Mentor Alex" },
            profile: {},
            loading: false,
            error: null,
            refetchProfile: mockRefetchProfile,
        });
        useUnreadCount.mockReturnValue({ unreadCount: 5, clearBadge: mockClearBadge });
    });

    const renderWithRouter = () => render(<BrowserRouter><DashboardLayout /></BrowserRouter>);

    it("should show shell level loading state spinner when dashboard is evaluating", () => {
        useMentorDashboard.mockReturnValueOnce({ loading: true });
        renderWithRouter();
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should present an error configuration pane if request hooks yield faults", () => {
        useMentorDashboard.mockReturnValueOnce({ error: "System Connection Error", refetchProfile: mockRefetchProfile });
        renderWithRouter();

        expect(screen.getByTestId("error-state")).toBeInTheDocument();
        expect(screen.getByText("System Connection Error")).toBeInTheDocument();

        fireEvent.click(screen.getByText("Retry"));
        expect(mockRefetchProfile).toHaveBeenCalled();
    });

    it("should parse deep link parameter configurations successfully on mount", async () => {
        window.history.replaceState({}, "", "/?tab=profile");
        renderWithRouter();

        expect(await screen.findByTestId("profile-tab")).toBeInTheDocument();
    });

    it("should switch between distinct active sub-tabs and manage badging indicators appropriately", async () => {
        window.history.replaceState({}, "", "/");
        renderWithRouter();

        expect(screen.getByTestId("home-tab")).toBeInTheDocument();

        // Trigger navigation shift to a badge clearing tab
        fireEvent.click(screen.getByText("Go Notifications"));

        expect(await screen.findByTestId("notifications-tab")).toBeInTheDocument();
        expect(mockClearBadge).toHaveBeenCalled();

        // Back to home
        fireEvent.click(screen.getByText("Logo Click"));
        expect(screen.getByTestId("home-tab")).toBeInTheDocument();
    });

    it("should cycle open and close layout visibility parameters on the sidebar shell drawer", () => {
        renderWithRouter();

        fireEvent.click(screen.getByText("Open Menu"));
        expect(screen.getByText("Sidebar Is Open")).toBeInTheDocument();

        fireEvent.click(screen.getByText("Close Sidebar"));
        expect(screen.queryByText("Sidebar Is Open")).not.toBeInTheDocument();
    });
});