// components/mentee/dashboard/__tests__/DashboardLayout.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import useMenteeDashboard from "../../../../hooks/useMenteeDashboard";
import useUnreadCount from "../../../../hooks/useUnreadCount";
import useSocketToast from "../../../../hooks/useSocketToast";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "../../../../components/mentee/dashboard/DashboardLayout";

vi.mock("../../../../hooks/useMenteeDashboard");
vi.mock("../../../../hooks/useUnreadCount");
vi.mock("../../../../hooks/useSocketToast");

const mockSetSearchParams = vi.fn();
let mockSearchParamsValue = new URLSearchParams();

vi.mock("react-router-dom", () => ({
    useSearchParams: vi.fn(),
}));

vi.mock("../../../../components/common/DashboardTopbar", () => ({
    default: ({ onMenuToggle, onLogoClick }) => (
        <div data-testid="topbar">
            <button onClick={onMenuToggle}>menu</button>
            <button onClick={onLogoClick}>logo</button>
        </div>
    ),
}));
vi.mock("../../../../components/mentee/dashboard/HomeTab", () => ({
    default: () => <div data-testid="home-tab">HomeTab</div>,
}));
vi.mock("../../../../components/mentee/dashboard/ProfileTab", () => ({
    default: () => <div data-testid="profile-tab">ProfileTab</div>,
}));
vi.mock("../../../../components/mentee/notifications/NotificationsTab", () => ({
    default: ({ setActiveTab }) => (
        <div data-testid="notifications-tab">
            <button onClick={() => setActiveTab("history")}>go-to-history</button>
        </div>
    ),
}));

vi.mock("../../../../components/mentee/dashboard/findMentors/FindMentorsTab", () => ({
    default: () => <div data-testid="find-mentors-tab">FindMentorsTab</div>,
}));
vi.mock("../../../../components/mentee/dashboard/history/RequestHistoryTab", () => ({
    default: () => <div data-testid="history-tab">RequestHistoryTab</div>,
}));

vi.mock("../../../../components/mentee/dashboard/connects/MenteeConnectsTab", () => ({
    default: () => <div data-testid="connects-tab">MenteeConnectsTab</div>,
}));
vi.mock("../../../../components/common/HelpCenter", () => ({
    default: () => <div data-testid="help-center">HelpCenter</div>,
}));
vi.mock("../../../../components/common/DashboardSidebar", () => ({
    default: ({ navItems, activeTab, setActiveTab, isOpen, onClose }) => (
        <div data-testid="sidebar" data-open={isOpen} data-active={activeTab}>
            {navItems.map((item) => (
                <button key={item.key} onClick={() => setActiveTab(item.key)}>
                    nav-{item.key}
                </button>
            ))}
            <button onClick={onClose}>close-sidebar</button>
        </div>
    ),
}));
vi.mock("../../../../components/common/ErrorState", () => ({
    default: ({ message, onAction }) => (
        <div data-testid="error-state">
            <p>{message}</p>
            <button onClick={onAction}>retry</button>
        </div>
    ),
}));
vi.mock("react-router-dom", () => ({
    useSearchParams: vi.fn(),
    useNavigate: vi.fn(() => vi.fn()),
}));

vi.mock("react-redux", () => ({
    useDispatch: vi.fn(() => vi.fn()),
}));
const clearBadge = vi.fn();

describe("DashboardLayout", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockSearchParamsValue = new URLSearchParams();
        useSearchParams.mockImplementation(() => [
            mockSearchParamsValue,
            mockSetSearchParams,
        ]);
        useUnreadCount.mockReturnValue({ unreadCount: 3, clearBadge });
        useSocketToast.mockReturnValue(undefined);
    });

    it("renders a loading spinner while the dashboard is loading", () => {
        useMenteeDashboard.mockReturnValue({ loading: true, error: null });
        render(<DashboardLayout />);

        expect(screen.getByText("Loading your dashboard…")).toBeInTheDocument();
        expect(screen.queryByTestId("sidebar")).not.toBeInTheDocument();
    });

    it("renders an error state and reloads on retry", () => {
        useMenteeDashboard.mockReturnValue({
            loading: false,
            error: "Failed to load dashboard",
        });
        const reloadSpy = vi.fn();
        const originalLocation = globalThis.location;
        Object.defineProperty(globalThis, "location", {
            value: { ...originalLocation, reload: reloadSpy },
            writable: true,
        });

        render(<DashboardLayout />);

        expect(screen.getByText("Failed to load dashboard")).toBeInTheDocument();
        fireEvent.click(screen.getByText("retry"));
        expect(reloadSpy).toHaveBeenCalled();

        Object.defineProperty(globalThis, "location", {
            value: originalLocation,
            writable: true,
        });
    });

    it("renders the home tab by default", () => {
        useMenteeDashboard.mockReturnValue({ loading: false, error: null });
        render(<DashboardLayout />);

        expect(screen.getByTestId("home-tab")).toBeInTheDocument();
        expect(screen.getByTestId("sidebar")).toHaveAttribute(
            "data-active",
            "home",
        );
    });

    it("switches to the profile tab and clears the query param when navigating home again", () => {
        useMenteeDashboard.mockReturnValue({ loading: false, error: null });
        render(<DashboardLayout />);

        fireEvent.click(screen.getByText("nav-profile"));
        expect(screen.getByTestId("profile-tab")).toBeInTheDocument();
        expect(mockSetSearchParams).toHaveBeenCalledWith(
            { tab: "profile" },
            { replace: true },
        );

        fireEvent.click(screen.getByText("nav-home"));
        expect(screen.getByTestId("home-tab")).toBeInTheDocument();
        expect(mockSetSearchParams).toHaveBeenCalledWith(
            {},
            { replace: true },
        );
    });

    it("clears the notifications badge when the notifications tab becomes active", () => {
        useMenteeDashboard.mockReturnValue({ loading: false, error: null });
        render(<DashboardLayout />);

        fireEvent.click(screen.getByText("nav-notifications"));
        expect(screen.getByTestId("notifications-tab")).toBeInTheDocument();
        expect(clearBadge).toHaveBeenCalled();
    });

    it("renders find mentors, history, connects, and help tabs when selected", () => {
        useMenteeDashboard.mockReturnValue({ loading: false, error: null });
        render(<DashboardLayout />);

        fireEvent.click(screen.getByText("nav-findMentors"));
        expect(screen.getByTestId("find-mentors-tab")).toBeInTheDocument();

        fireEvent.click(screen.getByText("nav-history"));
        expect(screen.getByTestId("history-tab")).toBeInTheDocument();

        fireEvent.click(screen.getByText("nav-connects"));
        expect(screen.getByTestId("connects-tab")).toBeInTheDocument();
    });

    it("navigates from notifications to history via the setActiveTab callback prop", () => {
        useMenteeDashboard.mockReturnValue({ loading: false, error: null });
        render(<DashboardLayout />);

        fireEvent.click(screen.getByText("nav-notifications"));
        fireEvent.click(screen.getByText("go-to-history"));

        expect(screen.getByTestId("history-tab")).toBeInTheDocument();
    });

    it("navigates home when the topbar logo is clicked", () => {
        useMenteeDashboard.mockReturnValue({ loading: false, error: null });
        render(<DashboardLayout />);

        fireEvent.click(screen.getByText("nav-profile"));
        fireEvent.click(screen.getByText("logo"));

        expect(screen.getByTestId("home-tab")).toBeInTheDocument();
    });

    it("opens the sidebar via the topbar menu toggle", () => {
        useMenteeDashboard.mockReturnValue({ loading: false, error: null });
        render(<DashboardLayout />);

        expect(screen.getByTestId("sidebar")).toHaveAttribute(
            "data-open",
            "false",
        );
        fireEvent.click(screen.getByText("menu"));
        expect(screen.getByTestId("sidebar")).toHaveAttribute(
            "data-open",
            "true",
        );
    });

    it("closes the sidebar when a nav item is selected", () => {
        useMenteeDashboard.mockReturnValue({ loading: false, error: null });
        render(<DashboardLayout />);

        fireEvent.click(screen.getByText("menu"));
        fireEvent.click(screen.getByText("nav-history"));

        expect(screen.getByTestId("sidebar")).toHaveAttribute(
            "data-open",
            "false",
        );
    });

    it("responds to the global setDashboardTab custom event", () => {
        useMenteeDashboard.mockReturnValue({ loading: false, error: null });
        render(<DashboardLayout />);

        act(() => {
            globalThis.dispatchEvent(
                new CustomEvent("setDashboardTab", { detail: "connects" }),
            );
        });

        expect(screen.getByTestId("connects-tab")).toBeInTheDocument();
    });

    it("reads a valid ?tab= deep link from the URL on mount", () => {
        mockSearchParamsValue = new URLSearchParams("tab=history");
        useMenteeDashboard.mockReturnValue({ loading: false, error: null });
        render(<DashboardLayout />);

        expect(screen.getByTestId("history-tab")).toBeInTheDocument();
    });

    it("ignores an invalid ?tab= deep link and stays on the default tab", () => {
        mockSearchParamsValue = new URLSearchParams("tab=not-a-real-tab");
        useMenteeDashboard.mockReturnValue({ loading: false, error: null });
        render(<DashboardLayout />);

        expect(screen.getByTestId("home-tab")).toBeInTheDocument();
    });

    it("accepts the help deep-link tab", () => {
        mockSearchParamsValue = new URLSearchParams("tab=help");
        useMenteeDashboard.mockReturnValue({ loading: false, error: null });
        render(<DashboardLayout />);

        expect(screen.getByTestId("help-center")).toBeInTheDocument();
    });
});