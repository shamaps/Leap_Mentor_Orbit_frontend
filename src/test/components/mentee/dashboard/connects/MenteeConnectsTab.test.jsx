// src/test/components/mentee/dashboard/connects/MenteeConnectsTab.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import MenteeConnectsTab from "../../../../../features/connects/view/MenteeConnectsTab";
import useOngoingConnects from "../../../../../features/mentee/presenter/useOngoingConnects";

// ── Mock router ──
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

// ── Mock data hook ──
vi.mock("../../../../../features/mentee/presenter/useOngoingConnects", () => ({
    default: vi.fn(),
}));

// ── Mock layout: expose props via testids so we can assert on them ──
vi.mock("../../../../../features/connects/view/ConnectsLayout", () => ({
    default: ({
        title,
        subtitle,
        count,
        loading,
        error,
        completedCount,
        emptyState,
        completedChildren,
        children,
    }) => (
        <div data-testid="mock-connects-layout">
            <p data-testid="layout-title">{title}</p>
            <p data-testid="layout-subtitle">{subtitle}</p>
            <p data-testid="layout-count">{count}</p>
            <p data-testid="layout-completed-count">{completedCount}</p>
            <p data-testid="layout-loading">{String(loading)}</p>
            <p data-testid="layout-error">{error ? String(error) : ""}</p>
            <button
                data-testid="empty-state-action"
                onClick={emptyState?.onAction}
            >
                {emptyState?.actionLabel}
            </button>
            <p data-testid="empty-state-message">{emptyState?.message}</p>
            <p data-testid="empty-state-submessage">{emptyState?.subMessage}</p>
            <div data-testid="ongoing-children">{children}</div>
            <div data-testid="completed-children">{completedChildren}</div>
        </div>
    ),
}));

// ── Mock card: expose props for assertion + trigger dashboard click ──
vi.mock("../../../../../features/connects/view/ConnectCard", () => ({
    default: ({ name, tokenLabel, isCompleted, onDashboardClick }) => (
        <div data-testid="mock-connect-card">
            <span>{name}</span>
            <span>{tokenLabel}</span>
            <span>{String(isCompleted)}</span>
            <button onClick={onDashboardClick}>Go to Dashboard</button>
        </div>
    ),
}));

describe("MenteeConnectsTab Component Suite", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const makeConnect = (overrides = {}) => ({
        _id: "connect-1",
        mentor: { name: "Alice Mentor" },
        mentorProfile: { title: "Senior Engineer" },
        totalAmount: 500,
        ...overrides,
    });

    it("should pass loading and error states straight through to the layout", () => {
        useOngoingConnects.mockReturnValue({
            ongoing: [],
            completed: [],
            loading: true,
            error: "Something broke",
        });

        render(<MenteeConnectsTab />);

        expect(screen.getByTestId("layout-loading")).toHaveTextContent("true");
        expect(screen.getByTestId("layout-error")).toHaveTextContent("Something broke");
    });

    it("should render title, subtitle, and counts based on hook data", () => {
        useOngoingConnects.mockReturnValue({
            ongoing: [makeConnect({ _id: "c1" }), makeConnect({ _id: "c2" })],
            completed: [makeConnect({ _id: "c3" })],
            loading: false,
            error: null,
        });

        render(<MenteeConnectsTab />);

        expect(screen.getByTestId("layout-title")).toHaveTextContent("Active Connects");
        expect(screen.getByTestId("layout-subtitle")).toHaveTextContent(
            "Manage your ongoing mentorship sessions and review progress."
        );
        expect(screen.getByTestId("layout-count")).toHaveTextContent("2");
        expect(screen.getByTestId("layout-completed-count")).toHaveTextContent("1");
    });

    it("should render ongoing connects as non-completed cards with escrow token labels", () => {
        useOngoingConnects.mockReturnValue({
            ongoing: [makeConnect({ _id: "c1", totalAmount: 300 })],
            completed: [],
            loading: false,
            error: null,
        });

        render(<MenteeConnectsTab />);

        const ongoingSection = screen.getByTestId("ongoing-children");
        expect(ongoingSection).toHaveTextContent("Alice Mentor");
        expect(ongoingSection).toHaveTextContent("300 tokens in escrow");
        expect(ongoingSection).toHaveTextContent("false");
    });

    it("should render completed connects as completed cards with released token labels", () => {
        useOngoingConnects.mockReturnValue({
            ongoing: [],
            completed: [makeConnect({ _id: "c9", totalAmount: 750 })],
            loading: false,
            error: null,
        });

        render(<MenteeConnectsTab />);

        const completedSection = screen.getByTestId("completed-children");
        expect(completedSection).toHaveTextContent("Alice Mentor");
        expect(completedSection).toHaveTextContent("750 tokens released");
        expect(completedSection).toHaveTextContent("true");
    });

    it("should fall back to 'Mentor' when mentor name is missing", () => {
        useOngoingConnects.mockReturnValue({
            ongoing: [makeConnect({ _id: "c1", mentor: null })],
            completed: [],
            loading: false,
            error: null,
        });

        render(<MenteeConnectsTab />);

        expect(screen.getByTestId("ongoing-children")).toHaveTextContent("Mentor");
    });

    it("should navigate to the shared dashboard route when a card's dashboard action fires", () => {
        useOngoingConnects.mockReturnValue({
            ongoing: [makeConnect({ _id: "abc-123" })],
            completed: [],
            loading: false,
            error: null,
        });

        render(<MenteeConnectsTab />);

        const [goButton] = screen.getAllByRole("button", { name: "Go to Dashboard" });
        fireEvent.click(goButton);

        expect(mockNavigate).toHaveBeenCalledWith("/shared-dashboard/abc-123");
    });

    it("should surface the correct empty state copy and dispatch a tab-switch event on action", () => {
        useOngoingConnects.mockReturnValue({
            ongoing: [],
            completed: [],
            loading: false,
            error: null,
        });

        const dispatchSpy = vi.spyOn(globalThis, "dispatchEvent");

        render(<MenteeConnectsTab />);

        expect(screen.getByTestId("empty-state-message")).toHaveTextContent(
            "No active connections yet"
        );
        expect(screen.getByTestId("empty-state-submessage")).toHaveTextContent(
            "Once a mentor accepts your request and you complete escrow payment, your active sessions will appear here."
        );
        expect(screen.getByTestId("empty-state-action")).toHaveTextContent("Find Mentors");

        fireEvent.click(screen.getByTestId("empty-state-action"));

        expect(dispatchSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "setDashboardTab",
                detail: "findMentors",
            })
        );

        dispatchSpy.mockRestore();
    });
});