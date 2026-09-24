// src/test/components/mentee/dashboard/history/HistoryTable.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import HistoryTable from "../../../../../features/mentee/view/components/dashboard/history/HistoryTable";

vi.mock("../../../../../shared/components/StatusBadge", () => ({
    default: ({ status }) => <div data-testid="mock-status-badge">{status}</div>,
}));

vi.mock("../../../../../shared/components/EmptyState", () => ({
    default: ({ message, subMessage }) => (
        <div data-testid="mock-empty-state">
            <p>{message}</p>
            <p>{subMessage}</p>
        </div>
    ),
}));

describe("HistoryTable Component Suite", () => {
    const mockSelect = vi.fn();
    const mockDelete = vi.fn();

    const baseRequest = {
        _id: "r1",
        mentor: { name: "Jordan Lee" },
        mentorProfile: { currentRole: "Staff Engineer" },
        status: "pending",
        requestedAt: "2026-08-01T00:00:00.000Z",
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render the empty state when requests is an empty array", () => {
        render(<HistoryTable requests={[]} selected={null} onSelect={mockSelect} onDelete={mockDelete} />);
        expect(screen.getByTestId("mock-empty-state")).toBeInTheDocument();
        expect(screen.getByText("No requests found")).toBeInTheDocument();
    });

    it("should render column headers and a row per request", () => {
        render(<HistoryTable requests={[baseRequest]} selected={null} onSelect={mockSelect} onDelete={mockDelete} />);

        ["Mentor", "Skill / Role", "Date Sent", "Status", "Actions"].forEach((col) => {
            expect(screen.getByText(col)).toBeInTheDocument();
        });
        expect(screen.getByText("Jordan Lee")).toBeInTheDocument();
        expect(screen.getByText("Staff Engineer")).toBeInTheDocument();
        expect(screen.getByTestId("mock-status-badge")).toHaveTextContent("pending");
    });

    it("should fall back to em dashes when mentor data is missing", () => {
        const bareRequest = { ...baseRequest, mentor: null, mentorProfile: null };
        render(<HistoryTable requests={[bareRequest]} selected={null} onSelect={mockSelect} onDelete={mockDelete} />);

        // mentorName becomes "—" (mentor?.name || "—"), so avatar initials, name, and role all render "—"
        expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(3);
    });

    it("should show 'View' by default and switch to 'Close' when the row is selected", () => {
        const { rerender } = render(
            <HistoryTable requests={[baseRequest]} selected={null} onSelect={mockSelect} onDelete={mockDelete} />
        );
        expect(screen.getByRole("button", { name: /View/i })).toBeInTheDocument();

        rerender(
            <HistoryTable requests={[baseRequest]} selected={{ _id: "r1" }} onSelect={mockSelect} onDelete={mockDelete} />
        );
        expect(screen.getByRole("button", { name: /Close/i })).toBeInTheDocument();
    });

    it("should call onSelect with the request when View is clicked, and null when already selected", () => {
        const { rerender } = render(
            <HistoryTable requests={[baseRequest]} selected={null} onSelect={mockSelect} onDelete={mockDelete} />
        );
        fireEvent.click(screen.getByRole("button", { name: /View/i }));
        expect(mockSelect).toHaveBeenCalledWith(baseRequest);

        rerender(
            <HistoryTable requests={[baseRequest]} selected={{ _id: "r1" }} onSelect={mockSelect} onDelete={mockDelete} />
        );
        fireEvent.click(screen.getByRole("button", { name: /Close/i }));
        expect(mockSelect).toHaveBeenCalledWith(null);
    });

    it("should call onDelete with the request id when the delete icon is clicked", () => {
        render(<HistoryTable requests={[baseRequest]} selected={null} onSelect={mockSelect} onDelete={mockDelete} />);
        fireEvent.click(screen.getByTitle("Delete request"));
        expect(mockDelete).toHaveBeenCalledWith("r1");
    });

    it("should render multiple rows for multiple requests", () => {
        const requests = [
            baseRequest,
            { ...baseRequest, _id: "r2", mentor: { name: "Casey Adams" } },
        ];
        render(<HistoryTable requests={requests} selected={null} onSelect={mockSelect} onDelete={mockDelete} />);
        expect(screen.getByText("Jordan Lee")).toBeInTheDocument();
        expect(screen.getByText("Casey Adams")).toBeInTheDocument();
    });
});