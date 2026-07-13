import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import MentorConnectsTab from "../../../../../components/mentor/dashboard/connects/MentorConnectsTab";
import useOngoingConnects from "../../../../../hooks/useOngoingConnects";

// ── Mock Dependency Hooks ──
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock("../../../../../hooks/useOngoingConnects", () => ({
    default: vi.fn(),
}));

// ── Mock Layout Subcomponents to isolate testing target cleanly ──
vi.mock("../../../../../components/ui/connects/ConnectsLayout", () => ({
    default: ({ children, completedChildren, title, loading, error }) => (
        <div data-testid="mock-layout">
            <h1>{title}</h1>
            {loading && <div data-testid="loading-state">Loading...</div>}
            {error && <div data-testid="error-state">{error}</div>}
            <div data-testid="ongoing-container">{children}</div>
            <div data-testid="completed-container">{completedChildren}</div>
        </div>
    ),
}));

vi.mock("../../../../../components/ui/connects/ConnectCard", () => ({
    default: ({ name, tokenLabel, onDashboardClick }) => (
        <div data-testid="mock-card">
            <p>{name}</p>
            <span>{tokenLabel}</span>
            <button onClick={onDashboardClick}>Open Dashboard</button>
        </div>
    ),
}));

describe("MentorConnectsTab Component Suite", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Async Network Status Trees", () => {
        it("should pipe loading flags accurately down into layout view controllers", () => {
            useOngoingConnects.mockReturnValue({
                ongoing: [],
                completed: [],
                loading: true,
                error: null,
            });

            render(<MentorConnectsTab />);
            expect(screen.getByTestId("loading-state")).toBeInTheDocument();
        });

        it("should render error texts when fetching functions return communication failures", () => {
            useOngoingConnects.mockReturnValue({
                ongoing: [],
                completed: [],
                loading: false,
                error: "Database ledger disconnect exception",
            });

            render(<MentorConnectsTab />);
            expect(screen.getByTestId("error-state")).toHaveTextContent("Database ledger disconnect exception");
        });
    });

    describe("Children Lists & Redirection Triggers Matrix", () => {
        const mockOngoingList = [
            { _id: "conn-111", totalAmount: 50, mentee: { name: "Alex Mentee" }, menteeProfile: {} },
        ];
        const mockCompletedList = [
            { _id: "conn-222", totalAmount: 100, mentee: null, menteeProfile: {} }, // Test fallback name branch boundary[cite: 21]
        ];

        it("should mount records into correct section nodes and execute redirection workflows cleanly on click", () => {
            useOngoingConnects.mockReturnValue({
                ongoing: mockOngoingList,
                completed: mockCompletedList,
                loading: false,
                error: null,
            });

            render(<MentorConnectsTab />);

            // Verify header details[cite: 21]
            expect(screen.getByRole("heading", { name: "Active Connects" })).toBeInTheDocument();

            // Verify Ongoing Children components are parsed cleanly[cite: 21]
            const ongoingBox = screen.getByTestId("ongoing-container");
            expect(ongoingBox).toHaveTextContent("Alex Mentee");
            expect(ongoingBox).toHaveTextContent("50 tokens pending release");

            // Verify Completed Children components fallback correctly and sort inside dedicated slots[cite: 21]
            const completedBox = screen.getByTestId("completed-container");
            expect(completedBox).toHaveTextContent("Mentee");
            expect(completedBox).toHaveTextContent("100 tokens received");

            // Assert click events route active parameters safely to correct shared dashboards[cite: 21]
            const dashboardActionBtns = screen.getAllByRole("button", { name: /Open Dashboard/i });
            fireEvent.click(dashboardActionBtns[0]);
            expect(mockNavigate).toHaveBeenCalledWith("/shared-dashboard/conn-111");

            fireEvent.click(dashboardActionBtns[1]);
            expect(mockNavigate).toHaveBeenCalledWith("/shared-dashboard/conn-222");
        });
    });
});