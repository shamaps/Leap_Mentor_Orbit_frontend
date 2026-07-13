import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import React from "react";
import AdminSupportMessages from "../../../components/admin/AdminSupportMessages";
import adminAxiosInstance from "../../../utils/adminAxiosInstance";

// Mock admin axios network pipelines
vi.mock("../../../utils/adminAxiosInstance", () => ({
    default: {
        get: vi.fn(() => Promise.resolve({ data: { messages: [] } })),
        patch: vi.fn(() => Promise.resolve({ data: {} })),
    },
}));


vi.mock("../../../components/common/ErrorState", () => ({
    default: ({ message, onAction }) => (
        <div data-testid="mock-error-state">
            <p>{message}</p>
            <button onClick={onAction}>Retry</button>
        </div>
    ),
}));

vi.mock("../../../components/common/FilterTabs", () => ({
    default: ({ options, active, onChange }) => (
        <div data-testid="mock-filter-tabs">
            {options.map((opt) => (
                <button
                    key={opt}
                    onClick={() => onChange(opt)}
                    data-active={active === opt}
                >
                    {opt}
                </button>
            ))}
        </div>
    ),
}));

describe("AdminSupportMessages Component Suite", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(window, "alert").mockImplementation(() => { });
    });

    const createMockMessages = () => [
        {
            _id: "msg-1",
            role: "mentor",
            subject: "Payout Delay Issue",
            email: "mentor@test.com",
            message: "My scheduled payment has not arrived yet.",
            status: "open",
            createdAt: "2026-05-10T10:00:00.000Z",
        },
        {
            _id: "msg-2",
            role: "mentee",
            subject: "Unable to Book Session",
            email: "mentee@test.com",
            message: "The calendar throws a network timeout error.",
            status: "resolved",
            createdAt: "2026-05-11T14:30:00.000Z",
        },
        {
            _id: "msg-3",
            role: null,
            subject: "Anonymous Feedback",
            email: "guest@test.com",
            message: "Great interface improvements!",
            status: "open",
            createdAt: "2026-05-12T09:15:00.000Z",
        },
    ];

    describe("Loading Boundary States", () => {
        it("should mount and show loading text before data resolves", () => {
            adminAxiosInstance.get.mockReturnValueOnce(new Promise(() => { }));
            render(<AdminSupportMessages />);
            expect(screen.getByText("Loading messages...")).toBeInTheDocument();
        });
    });

    describe("Error Boundary Catch States", () => {
        it("should display custom error state components when fetch pipelines reject", async () => {
            adminAxiosInstance.get.mockRejectedValueOnce({
                response: { data: { message: "Server database drop exception" } },
            });

            render(<AdminSupportMessages />);

            await waitFor(() => {
                expect(screen.getByTestId("mock-error-state")).toBeInTheDocument();
            });
            expect(screen.getByText("Server database drop exception")).toBeInTheDocument();

            adminAxiosInstance.get.mockRejectedValueOnce(new Error("Fallback error string message"));
            fireEvent.click(screen.getByText("Retry"));

            await waitFor(() => {
                expect(screen.getByText("Fallback error string message")).toBeInTheDocument();
            });
        });
    });

    describe("Empty Collection fallbacks", () => {
        it("should render clean notice layouts if messages array resolves empty", async () => {
            adminAxiosInstance.get.mockResolvedValueOnce({ data: { messages: [] } });
            render(<AdminSupportMessages />);

            await waitFor(() => {
                expect(screen.getByText("No messages yet.")).toBeInTheDocument();
            });
        });
    });

    describe("Data Render Layout & Matrix Metrics", () => {
        it("should accurately summarize support ticket state balances inside the upper metric cards", async () => {
            adminAxiosInstance.get.mockResolvedValueOnce({ data: { messages: createMockMessages() } });
            render(<AdminSupportMessages />);

            await waitFor(() => {
                expect(screen.getByText("Payout Delay Issue")).toBeInTheDocument();
            });

            expect(screen.getByText("3")).toBeInTheDocument();
            expect(screen.getByText("2")).toBeInTheDocument();
            expect(screen.getByText("1")).toBeInTheDocument();
            expect(screen.getByText("user")).toBeInTheDocument();
        });
    });

    describe("Tab Filtering Mechanics", () => {
        it("should filter the visible array blocks as tabs report changes", async () => {
            adminAxiosInstance.get.mockResolvedValueOnce({ data: { messages: createMockMessages() } });
            render(<AdminSupportMessages />);

            await waitFor(() => {
                expect(screen.getByText("Payout Delay Issue")).toBeInTheDocument();
            });

            const openFilterBtn = screen.getByRole("button", { name: "open" });
            const resolvedFilterBtn = screen.getByRole("button", { name: "resolved" });

            fireEvent.click(openFilterBtn);
            expect(screen.getByText("Payout Delay Issue")).toBeInTheDocument();
            expect(screen.queryByText("Unable to Book Session")).not.toBeInTheDocument();

            fireEvent.click(resolvedFilterBtn);
            expect(screen.queryByText("Payout Delay Issue")).not.toBeInTheDocument();
            expect(screen.getByText("Unable to Book Session")).toBeInTheDocument();
        });

        it("should render alternative message texts when active filters map to blank content sets", async () => {
            // ✅ Isolated test rendering a subset with missing status structures to invoke lines 60-64
            const singleResolvedMock = [
                {
                    _id: "msg-2",
                    role: "mentee",
                    subject: "Unable to Book Session",
                    email: "mentee@test.com",
                    message: "The calendar throws a network timeout error.",
                    status: "resolved",
                    createdAt: "2026-05-11T14:30:00.000Z",
                }
            ];

            adminAxiosInstance.get.mockResolvedValueOnce({ data: { messages: singleResolvedMock } });
            render(<AdminSupportMessages />);

            await waitFor(() => {
                expect(screen.getByText("Unable to Book Session")).toBeInTheDocument();
            });

            // Switch to open filter where length is 0 to trigger alternative empty label text
            fireEvent.click(screen.getByRole("button", { name: "open" }));
            expect(screen.getByText("No open messages yet.")).toBeInTheDocument();
        });
    });

    describe("Expansion and Status Mutation Pipelines", () => {
        it("should expand details, collapse on click updates, and patch status values cleanly", async () => {
            adminAxiosInstance.get.mockResolvedValue({ data: { messages: createMockMessages() } });
            adminAxiosInstance.patch.mockResolvedValueOnce({ data: {} });

            render(<AdminSupportMessages />);

            await waitFor(() => {
                expect(screen.getByText("Payout Delay Issue")).toBeInTheDocument();
            });

            const openTicketBtn = screen.getByRole("button", { name: /mentor Payout Delay Issue/i });

            fireEvent.click(openTicketBtn);
            expect(screen.getByText("My scheduled payment has not arrived yet.")).toBeInTheDocument();

            fireEvent.click(openTicketBtn);
            expect(screen.queryByText("My scheduled payment has not arrived yet.")).not.toBeInTheDocument();

            fireEvent.click(openTicketBtn);
            const resolveActionBtn = screen.getByText("Mark as Resolved");

            await act(async () => {
                fireEvent.click(resolveActionBtn);
            });

            expect(adminAxiosInstance.patch).toHaveBeenCalledWith("/support/messages/msg-1/resolve");
        });

        it("should catch updating failures and issue an alert prompt to the window shell gracefully", async () => {
            adminAxiosInstance.get.mockResolvedValue({ data: { messages: createMockMessages() } });
            adminAxiosInstance.patch.mockRejectedValueOnce(new Error("Network disconnect"));

            render(<AdminSupportMessages />);

            await waitFor(() => {
                expect(screen.getByText("Payout Delay Issue")).toBeInTheDocument();
            });

            fireEvent.click(screen.getByRole("button", { name: /mentor Payout Delay Issue/i }));
            const resolveActionBtn = screen.getByText("Mark as Resolved");

            await act(async () => {
                fireEvent.click(resolveActionBtn);
            });

            //  Await resolution window limits safely inside waitFor
            await waitFor(() => {
                expect(window.alert).toHaveBeenCalledWith("Failed to update status");
            });
        });
    });
});