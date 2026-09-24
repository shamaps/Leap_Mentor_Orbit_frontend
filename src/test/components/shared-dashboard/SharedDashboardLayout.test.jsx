// src/test/components/shared-dashboard/SharedDashboardLayout.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import SharedDashboardLayout from "../../../features/shared-dashboard/view/components/SharedDashboardLayout";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

const mockDispatch = vi.fn();
let mockState;
vi.mock("react-redux", () => ({
    useSelector: (selectorFn) => selectorFn(mockState),
    useDispatch: () => mockDispatch,
}));

const mockUseSocketToast = vi.fn();
vi.mock("../../../features/shared-dashboard/presenter/useSocketToast", () => ({
    default: (...args) => mockUseSocketToast(...args),
}));

vi.mock("../../../features/shared-dashboard/view/components/SharedTopbar", () => ({
    default: ({ viewerRole, onMenuToggle, onLogoClick }) => (
        <div>
            <span>topbar-viewer-role:{viewerRole}</span>
            <button onClick={onMenuToggle}>trigger-menu-toggle</button>
            <button onClick={onLogoClick}>trigger-logo-click</button>
        </div>
    ),
}));

vi.mock("../../../features/shared-dashboard/view/components/SharedSidebar", () => ({
    default: ({ activeTab, setActiveTab, isOpen, onClose, viewerRole }) => (
        <div>
            <span>sidebar-active-tab:{activeTab}</span>
            <span>sidebar-is-open:{String(isOpen)}</span>
            <span>sidebar-viewer-role:{viewerRole}</span>
            <button onClick={() => setActiveTab("chat")}>trigger-set-tab</button>
            <button onClick={onClose}>trigger-sidebar-close</button>
        </div>
    ),
}));

vi.mock("../../../features/shared-dashboard/view/components/tabs/SharedHomeTab", () => ({
    default: ({ onTabChange }) => (
        <div>
            <span>home-tab</span>
            <button onClick={() => onTabChange("goals")}>home-tab-change</button>
        </div>
    ),
}));

vi.mock("../../../features/shared-dashboard/view/components/tabs/SharedChatTab", () => ({
    default: () => <div>chat-tab</div>,
}));

vi.mock("../../../features/shared-dashboard/view/components/tabs/SharedGoalsTab", () => ({
    default: ({ onAllComplete }) => (
        <div>
            <span>goals-tab</span>
            <button onClick={onAllComplete}>goals-tab-complete</button>
        </div>
    ),
}));

vi.mock("../../../features/shared-dashboard/view/components/tabs/SharedNotesTab", () => ({
    default: () => <div>notes-tab</div>,
}));

vi.mock("../../../features/shared-dashboard/view/components/tabs/SharedAdditionalSessionTab", () => ({
    default: ({ onTabChange }) => (
        <div>
            <span>add-session-tab</span>
            <button onClick={() => onTabChange("overview")}>add-session-tab-change</button>
        </div>
    ),
}));

const makeState = (overrides = {}) => ({
    sharedConnect: { connect: { viewerRole: "mentee" } },
    ...overrides,
});

describe("SharedDashboardLayout", () => {
    beforeEach(() => {
        mockNavigate.mockReset();
        mockDispatch.mockReset();
        mockUseSocketToast.mockReset();
        mockState = makeState();
    });

    it("defaults activeTab to 'overview' when activeTab prop is not provided", () => {
        render(<SharedDashboardLayout setActiveTab={vi.fn()} />);
        expect(screen.getByText("home-tab")).toBeInTheDocument();
        expect(screen.getByText("sidebar-active-tab:overview")).toBeInTheDocument();
    });

    it("uses the provided activeTab prop when given", () => {
        render(<SharedDashboardLayout activeTab="chat" setActiveTab={vi.fn()} />);
        expect(screen.getByText("sidebar-active-tab:chat")).toBeInTheDocument();
    });

    it("defaults viewerRole to 'mentee' when connect is missing", () => {
        mockState = makeState({ sharedConnect: { connect: null } });
        render(<SharedDashboardLayout setActiveTab={vi.fn()} />);
        expect(screen.getByText("topbar-viewer-role:mentee")).toBeInTheDocument();
        expect(screen.getByText("sidebar-viewer-role:mentee")).toBeInTheDocument();
    });

    it("uses viewerRole from the connect selector when present", () => {
        mockState = makeState({ sharedConnect: { connect: { viewerRole: "mentor" } } });
        render(<SharedDashboardLayout setActiveTab={vi.fn()} />);
        expect(screen.getByText("topbar-viewer-role:mentor")).toBeInTheDocument();
    });

    it("navigates to /dashboard/mentee on logo click for a mentee viewer", () => {
        render(<SharedDashboardLayout setActiveTab={vi.fn()} />);
        act(() => {
            screen.getByText("trigger-logo-click").click();
        });
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/mentee");
    });

    it("navigates to /dashboard/mentor on logo click for a mentor viewer", () => {
        mockState = makeState({ sharedConnect: { connect: { viewerRole: "mentor" } } });
        render(<SharedDashboardLayout setActiveTab={vi.fn()} />);
        act(() => {
            screen.getByText("trigger-logo-click").click();
        });
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/mentor");
    });

    it("opens the sidebar when the menu toggle is clicked", () => {
        render(<SharedDashboardLayout setActiveTab={vi.fn()} />);
        expect(screen.getByText("sidebar-is-open:false")).toBeInTheDocument();
        act(() => {
            screen.getByText("trigger-menu-toggle").click();
        });
        expect(screen.getByText("sidebar-is-open:true")).toBeInTheDocument();
    });

    it("closes the sidebar when the sidebar's onClose is triggered", () => {
        render(<SharedDashboardLayout setActiveTab={vi.fn()} />);
        act(() => {
            screen.getByText("trigger-menu-toggle").click();
        });
        expect(screen.getByText("sidebar-is-open:true")).toBeInTheDocument();
        act(() => {
            screen.getByText("trigger-sidebar-close").click();
        });
        expect(screen.getByText("sidebar-is-open:false")).toBeInTheDocument();
    });

    it("calls setActiveTab (from sidebar) with the new tab", () => {
        const setActiveTab = vi.fn();
        render(<SharedDashboardLayout setActiveTab={setActiveTab} />);
        act(() => {
            screen.getByText("trigger-set-tab").click();
        });
        expect(setActiveTab).toHaveBeenCalledWith("chat");
    });

    it("passes setActiveTab through to SharedHomeTab's onTabChange", () => {
        const setActiveTab = vi.fn();
        render(<SharedDashboardLayout setActiveTab={setActiveTab} />);
        act(() => {
            screen.getByText("home-tab-change").click();
        });
        expect(setActiveTab).toHaveBeenCalledWith("goals");
    });

    it("passes onAllComplete through to SharedGoalsTab", () => {
        const onAllComplete = vi.fn();
        render(
            <SharedDashboardLayout
                activeTab="goals"
                setActiveTab={vi.fn()}
                onAllComplete={onAllComplete}
            />,
        );
        act(() => {
            screen.getByText("goals-tab-complete").click();
        });
        expect(onAllComplete).toHaveBeenCalled();
    });

    it("passes setActiveTab through to SharedAdditionalSessionTab's onTabChange", () => {
        const setActiveTab = vi.fn();
        render(
            <SharedDashboardLayout activeTab="addSession" setActiveTab={setActiveTab} />,
        );
        act(() => {
            screen.getByText("add-session-tab-change").click();
        });
        expect(setActiveTab).toHaveBeenCalledWith("overview");
    });

    it("renders all tab panels regardless of activeTab (mounted, just hidden)", () => {
        render(<SharedDashboardLayout setActiveTab={vi.fn()} />);
        expect(screen.getByText("home-tab")).toBeInTheDocument();
        expect(screen.getByText("chat-tab")).toBeInTheDocument();
        expect(screen.getByText("goals-tab")).toBeInTheDocument();
        expect(screen.getByText("notes-tab")).toBeInTheDocument();
        expect(screen.getByText("add-session-tab")).toBeInTheDocument();
    });

    it("shows the notes tab as active when activeTab is 'notes'", () => {
        render(<SharedDashboardLayout activeTab="notes" setActiveTab={vi.fn()} />);
        expect(screen.getByText("notes-tab")).toBeInTheDocument();
        expect(screen.getByText("sidebar-active-tab:notes")).toBeInTheDocument();
    });

    it("calls useSocketToast on render", () => {
        render(<SharedDashboardLayout setActiveTab={vi.fn()} />);
        expect(mockUseSocketToast).toHaveBeenCalled();
    });
});