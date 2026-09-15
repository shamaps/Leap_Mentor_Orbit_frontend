import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import TrackEarningsTab from "../../../../../features/mentor/view/components/dashboard/earnings/TrackEarningsTab";
import useTrackEarnings from "../../../../../features/mentor/presenter/useTrackEarnings";

// ── Mock Recharts Components to Completely Silencing Casing Warnings ──
vi.mock("recharts", () => ({
    ResponsiveContainer: ({ children }) => <div data-testid="recharts-container">{children}</div>,
    AreaChart: ({ children }) => <div data-testid="mock-area-chart">{children}</div>,
    Area: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
}));

// ── Mock Local Custom Hook State Machine ──
vi.mock("../../../../../features/mentor/presenter/useTrackEarnings", () => ({
    default: vi.fn(),
}));

// ── Mock Shared UI Common Elements ──
vi.mock("../../../../../shared/components/ErrorState", () => ({
    default: ({ message, onAction }) => (
        <div data-testid="mock-error-state">
            <span>{message}</span>
            <button onClick={onAction}>Retry Fetch</button>
        </div>
    ),
}));

vi.mock("@/shared/components/StatusBadge", () => ({
    default: ({ status, variant }) => <span data-testid="mock-status-badge" data-variant={variant}>{status}</span>,
}));

vi.mock("@/shared/components/StatCard", () => ({
    default: ({ label, value, sub }) => (
        <div data-testid={`stat-${label.replace(/\s+/g, "-").toLowerCase()}`}>
            <h3>{label}</h3>
            <span>{value}</span>
            {sub}
        </div>
    ),
}));

vi.mock("../../../../../shared/components/EmptyState", () => ({
    default: ({ message, subMessage }) => (
        <div data-testid="mock-empty-state">
            <h3>{message}</h3>
            <p>{subMessage}</p>
        </div>
    ),
}));

describe("TrackEarningsTab Component Suite", () => {
    const mockHandleChartPeriod = vi.fn();
    const mockGoNext = vi.fn();
    const mockGoPrev = vi.fn();
    const mockSetSearch = vi.fn();
    const mockFetchStats = vi.fn();

    const mockDefaultStats = {
        totalEarnings: 15450.75,
        sessionsThisMonth: 12,
        avgRating: 4.8, // Explicit single digit float assignment to ensure safe cross-environment calculations
        pendingPayout: 320.00,
    };

    const mockChartData = [
        { label: "Jan", amount: 4000 },
        { label: "Feb", amount: 5000 },
    ];

    const mockPayouts = [
        { id: "p-1", date: "2026-07-10", menteeName: "David Miller", sessionType: "Video Call", duration: "60 min", amount: 120.00, status: "paid" },
        { id: "p-2", date: "2026-07-12", menteeName: "Emma Watson", sessionType: "Chat", duration: "30 min", amount: 50.00, status: "pending" },
    ];

    const baseHookValue = {
        stats: mockDefaultStats,
        loadingStats: false,
        chartData: mockChartData,
        chartPeriod: "monthly",
        loadingChart: false,
        payouts: mockPayouts,
        loadingPayouts: false,
        search: "",
        setSearch: mockSetSearch,
        page: 1,
        hasMore: true,
        totalCount: 2,
        error: null,
        handleChartPeriod: mockHandleChartPeriod,
        goNext: mockGoNext,
        goPrev: mockGoPrev,
        fetchStats: mockFetchStats,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Initial Compilation & Metric Card Presentation", () => {
        it("should process custom stat values into matching formats and configure indicators safely", () => {
            useTrackEarnings.mockReturnValue(baseHookValue);
            render(<TrackEarningsTab />);

            expect(screen.getByText("Track Earnings")).toBeInTheDocument();
            expect(screen.getByTestId("stat-total-earnings")).toHaveTextContent("15,450.75");
            expect(screen.getByTestId("stat-sessions-this-month")).toHaveTextContent("12");
            expect(screen.getByTestId("stat-average-rating")).toHaveTextContent("4.8/5.0");
            expect(screen.getByTestId("stat-pending-payout")).toHaveTextContent("320.00");
        });

        it("should project placeholder skeleton cards when loadingStats resolves to true", () => {
            useTrackEarnings.mockReturnValue({
                ...baseHookValue,
                loadingStats: true,
            });

            const { container } = render(<TrackEarningsTab />);
            expect(container.querySelectorAll(".h-24")).toHaveLength(4);
        });
    });

    describe("Interactive Chart Controls", () => {
        it("should toggle active period modifiers when selection button arrays receive click inputs", () => {
            useTrackEarnings.mockReturnValue(baseHookValue);
            render(<TrackEarningsTab />);

            const weeklyBtn = screen.getByRole("button", { name: "Weekly" });
            fireEvent.click(weeklyBtn);
            expect(mockHandleChartPeriod).toHaveBeenCalledWith("weekly");
        });

        it("should render placeholder loading slots inside the graph block when loadingChart is true", () => {
            useTrackEarnings.mockReturnValue({
                ...baseHookValue,
                loadingChart: true,
            });

            render(<TrackEarningsTab />);
            expect(screen.queryByTestId("mock-area-chart")).not.toBeInTheDocument();
        });
    });

    describe("Payout Table Rendering Loops & Edge Cases", () => {
        it("should render row details cleanly and configure status badges using dynamic rules", () => {
            useTrackEarnings.mockReturnValue(baseHookValue);
            render(<TrackEarningsTab />);

            expect(screen.getByText("David Miller")).toBeInTheDocument();
            expect(screen.getByText("Emma Watson")).toBeInTheDocument();

            const statusBadges = screen.getAllByTestId("mock-status-badge");
            expect(statusBadges[0]).toHaveTextContent("completed");
            expect(statusBadges[1]).toHaveTextContent("pending");
        });

        it("should map loading table structures dynamically when loadingPayouts evaluates to true", () => {
            useTrackEarnings.mockReturnValue({
                ...baseHookValue,
                loadingPayouts: true,
                payouts: [],
            });

            const { container } = render(<TrackEarningsTab />);
            expect(container.querySelectorAll("tbody tr")).toHaveLength(4);
        });

        it("should render an empty state panel if payout items return empty", () => {
            useTrackEarnings.mockReturnValue({
                ...baseHookValue,
                payouts: [],
                search: "Unmatched Mentee",
            });

            render(<TrackEarningsTab />);
            expect(screen.getByTestId("mock-empty-state")).toBeInTheDocument();
            expect(screen.getByText('No results for "Unmatched Mentee"')).toBeInTheDocument();
        });

        it("should render generic empty states if search parameters are falsy", () => {
            useTrackEarnings.mockReturnValue({
                ...baseHookValue,
                payouts: [],
                search: "",
            });

            render(<TrackEarningsTab />);
            expect(screen.getByText("Completed sessions will appear here.")).toBeInTheDocument();
        });
    });

    describe("Global Error Boundary Triggers", () => {
        it("should output error banners and hook functional retry clicks dynamically", () => {
            useTrackEarnings.mockReturnValue({
                ...baseHookValue,
                error: "Failed to establish database synchronization layer link",
            });

            render(<TrackEarningsTab />);
            expect(screen.getByTestId("mock-error-state")).toBeInTheDocument();

            const retryBtn = screen.getByRole("button", { name: /Retry Fetch/i });
            fireEvent.click(retryBtn);
            expect(mockFetchStats).toHaveBeenCalled();
        });
    });

    describe("Pagination Operations & Input Filters", () => {
        it("should capture text typing sequences and alter search states accordingly", () => {
            useTrackEarnings.mockReturnValue(baseHookValue);
            render(<TrackEarningsTab />);

            const searchInput = screen.getByPlaceholderText("Search mentee...");
            fireEvent.change(searchInput, { target: { value: "John" } });
            expect(mockSetSearch).toHaveBeenCalledWith("John");
        });

        it("should direct callback loops cleanly when navigation triggers are executed", () => {
            useTrackEarnings.mockReturnValue({
                ...baseHookValue,
                page: 2,
                hasMore: true,
            });

            render(<TrackEarningsTab />);

            const prevBtn = screen.getByRole("button", { name: "Previous" });
            const nextBtn = screen.getByRole("button", { name: "Next" });

            expect(prevBtn).not.toBeDisabled();
            expect(nextBtn).not.toBeDisabled();

            fireEvent.click(prevBtn);
            expect(mockGoPrev).toHaveBeenCalled();

            fireEvent.click(nextBtn);
            expect(mockGoNext).toHaveBeenCalled();
        });
    });
});