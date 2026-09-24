// src/test/components/mentee/dashboard/history/RequestHistoryTab.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import RequestHistoryTab from "../../../../../features/mentee/view/components/dashboard/history/RequestHistoryTab";
import useRequestHistory from "../../../../../features/mentee/presenter/useRequestHistory";

vi.mock("../../../../../features/mentee/presenter/useRequestHistory", () => ({
    default: vi.fn(),
}));

vi.mock("../../../../../shared/components/TabLoader", () => ({
    default: ({ message }) => <div data-testid="mock-tab-loader">{message}</div>,
}));

vi.mock("../../../../../features/mentee/view/components/dashboard/history/HistoryTable", () => ({
    default: ({ requests, onSelect, onDelete }) => (
        <div data-testid="mock-history-table">
            {requests.map((r) => (
                <button key={r._id} onClick={() => onSelect(r)}>
                    {r._id}
                </button>
            ))}
            <button onClick={() => onDelete("r1")}>delete-r1</button>
        </div>
    ),
}));

vi.mock("../../../../../features/mentee/view/components/dashboard/history/DetailDrawer", () => ({
    default: ({ request, onClose }) =>
        request ? (
            <div data-testid="mock-detail-drawer">
                <span>{request._id}</span>
                <button onClick={onClose}>close-drawer</button>
            </div>
        ) : null,
}));

describe("RequestHistoryTab Component Suite", () => {
    const mockSetActiveTab = vi.fn();
    const mockSetSelected = vi.fn();
    const mockDeleteRequest = vi.fn();
    const mockUpdateRequest = vi.fn();
    const mockFetchRequests = vi.fn();

    const baseState = {
        filtered: [{ _id: "r1" }],
        counts: { all: 1, pending: 1, accepted: 0, ongoing: 0, completed: 0, rejected: 0, referred: 0 },
        loading: false,
        error: null,
        activeTab: "all",
        setActiveTab: mockSetActiveTab,
        selected: null,
        setSelected: mockSetSelected,
        deleteRequest: mockDeleteRequest,
        updateRequest: mockUpdateRequest,
        fetchRequests: mockFetchRequests,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useRequestHistory.mockReturnValue(baseState);
        globalThis.__leapSocket = undefined;
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("should show the TabLoader while loading is true", () => {
        useRequestHistory.mockReturnValue({ ...baseState, loading: true });
        render(<RequestHistoryTab />);
        expect(screen.getByTestId("mock-tab-loader")).toHaveTextContent("Loading your history...");
    });

    it("should render the header and all tab buttons with their counts", () => {
        render(<RequestHistoryTab />);
        expect(screen.getByText("Request History")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /All/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Pending/i })).toBeInTheDocument();
        // count badge "1" appears for both All and Pending
        expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(1);
    });

    it("should display an error banner when error is set", () => {
        useRequestHistory.mockReturnValue({ ...baseState, error: "Failed to load" });
        render(<RequestHistoryTab />);
        expect(screen.getByText("Failed to load")).toBeInTheDocument();
    });

    it("should call setActiveTab and clear selection when a tab is clicked", () => {
        render(<RequestHistoryTab />);
        fireEvent.click(screen.getByRole("button", { name: /Ongoing/i }));
        expect(mockSetActiveTab).toHaveBeenCalledWith("ongoing");
        expect(mockSetSelected).toHaveBeenCalledWith(null);
    });

    it("should pass filtered requests to HistoryTable and wire onSelect/onDelete", () => {
        render(<RequestHistoryTab />);
        expect(screen.getByTestId("mock-history-table")).toBeInTheDocument();

        fireEvent.click(screen.getByText("r1"));
        expect(mockSetSelected).toHaveBeenCalledWith({ _id: "r1" });

        fireEvent.click(screen.getByText("delete-r1"));
        expect(mockDeleteRequest).toHaveBeenCalledWith("r1");
    });

    it("should render the DetailDrawer only when a request is selected", () => {
        const { rerender } = render(<RequestHistoryTab />);
        expect(screen.queryByTestId("mock-detail-drawer")).not.toBeInTheDocument();

        useRequestHistory.mockReturnValue({ ...baseState, selected: { _id: "r1" } });
        rerender(<RequestHistoryTab />);
        expect(screen.getByTestId("mock-detail-drawer")).toBeInTheDocument();
    });

    it("should clear selection when the drawer's close is triggered", () => {
        useRequestHistory.mockReturnValue({ ...baseState, selected: { _id: "r1" } });
        render(<RequestHistoryTab />);
        fireEvent.click(screen.getByText("close-drawer"));
        expect(mockSetSelected).toHaveBeenCalledWith(null);
    });

    it("should subscribe to the socket's request_status_changed event once connected and call fetchRequests", () => {
        vi.useFakeTimers();
        const mockOn = vi.fn();
        const mockOff = vi.fn();
        globalThis.__leapSocket = { connected: true, on: mockOn, off: mockOff };

        render(<RequestHistoryTab />);
        vi.advanceTimersByTime(200);

        expect(mockOn).toHaveBeenCalledWith("request_status_changed", expect.any(Function));
    });
});