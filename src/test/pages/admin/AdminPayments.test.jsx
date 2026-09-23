// src/test/pages/admin/AdminPayments.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { useToast } from "../../../shared/context/ToastContext";
import { getPaymentStats, getPaymentChart, getPaymentTransactions } from "../../../features/admin/model/admin.api";
import { adminPaymentsLoader } from "../../../features/admin/model/adminPayments.loader";
import AdminPayments from "../../../features/admin/view/pages/AdminPayments";

vi.mock("../../../shared/context/ToastContext");
vi.mock("../../../shared/utils/logger", () => ({
    default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("../../../features/admin/model/admin.api");

// AdminPayments's data now comes from adminPaymentsLoader (a route loader),
// and filters/search/pagination navigate via setSearchParams rather than
// calling the API again directly — so this renders through a REAL
// MemoryRouter with the REAL loader wired to a single "/payments" route.
// A filter click causes a real navigation, which causes React Router to
// actually re-run the loader — exercising the same integration path
// production uses, rather than a static per-test mock of useLoaderData
// that can't react to navigation.
const renderPage = (initialPath = "/payments") => {
    const router = createMemoryRouter(
        [{ path: "/payments", loader: adminPaymentsLoader, element: <AdminPayments /> }],
        { initialEntries: [initialPath] },
    );
    return render(<RouterProvider router={router} />);
};

const baseStats = {
    totalRevenue: 50000,
    platformCommission: 5000,
    commissionRate: 10,
    pendingPayouts: 3,
    refundedRequests: 1,
};

const baseChart = [
    { label: "Jan", amount: 1000 },
    { label: "Feb", amount: 2500 },
    { label: "Mar", amount: 1800 },
];

const baseTx = {
    id: "tx-1",
    txId: "TXN-001",
    user: { name: "Alice Mentor", email: "alice@leapmentor.com" },
    amount: 1234.5,
    type: "commission_deduct",
    date: "2026-06-01",
    status: "completed",
};

const mockTxResponse = (transactions, pagination) => ({
    data: {
        transactions,
        pagination: pagination || { totalCount: transactions.length, currentPage: 1, totalPages: 1 },
    },
});

describe("AdminPayments", () => {
    let showToast;

    beforeEach(() => {
        vi.clearAllMocks();
        showToast = vi.fn();
        useToast.mockReturnValue({ showToast });
        getPaymentStats.mockResolvedValue({ data: baseStats });
        getPaymentChart.mockResolvedValue({ data: baseChart });
        getPaymentTransactions.mockResolvedValue(mockTxResponse([baseTx]));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("fetches stats, chart, and transactions on mount (via the loader)", async () => {
        renderPage();

        await waitFor(() => expect(screen.getByText("TXN-001")).toBeInTheDocument());

        expect(getPaymentStats).toHaveBeenCalled();
        expect(getPaymentChart).toHaveBeenCalled();
        expect(getPaymentTransactions).toHaveBeenCalledWith({ page: 1, limit: 15 });
        expect(screen.getByText("Total Revenue")).toBeInTheDocument();
    });

    it("shows a toast error when transactions fail to load", async () => {
        getPaymentTransactions.mockRejectedValue(new Error("fail"));

        renderPage();

        await waitFor(() => {
            expect(showToast).toHaveBeenCalledWith({ message: "Failed to load transactions.", type: "error" });
        });
    });

    it("still renders the page when stats fail to load (non-fatal, just logged)", async () => {
        getPaymentStats.mockRejectedValue(new Error("fail"));

        renderPage();

        await waitFor(() => expect(screen.getByText("TXN-001")).toBeInTheDocument());
        expect(showToast).not.toHaveBeenCalledWith(expect.objectContaining({ type: "error" }));
    });

    it("still renders the page when the chart fails to load (non-fatal, just logged)", async () => {
        getPaymentChart.mockRejectedValue(new Error("fail"));

        renderPage();

        await waitFor(() => expect(screen.getByText("TXN-001")).toBeInTheDocument());
        expect(showToast).not.toHaveBeenCalledWith(expect.objectContaining({ type: "error" }));
    });

    it("defaults chartData to an empty array when the response has no data", async () => {
        getPaymentChart.mockResolvedValue({ data: null });

        const { container } = renderPage();
        await waitFor(() => expect(screen.getByText("TXN-001")).toBeInTheDocument());

        expect(container.querySelector("#revGrad")).not.toBeInTheDocument();
    });

    it("defaults transactions to an empty array when the response omits transactions", async () => {
        getPaymentTransactions.mockResolvedValue({
            data: { pagination: { totalCount: 0, currentPage: 1, totalPages: 1 } },
        });

        renderPage();

        expect(await screen.findByText("No transactions found.")).toBeInTheDocument();
    });

    it("renders the chart when chartData is present", async () => {
        const { container } = renderPage();
        await waitFor(() => expect(screen.getByText("TXN-001")).toBeInTheDocument());

        expect(container.querySelector("#revGrad")).toBeInTheDocument();
    });

    it("renders no chart when chartData is empty", async () => {
        getPaymentChart.mockResolvedValue({ data: [] });

        const { container } = renderPage();
        await waitFor(() => expect(screen.getByText("TXN-001")).toBeInTheDocument());

        expect(container.querySelector("#revGrad")).not.toBeInTheDocument();
    });

    it("renders TypeBadge fallback for an unknown transaction type", async () => {
        const unknownTypeTx = { ...baseTx, id: "tx-2", type: "some_unknown_type" };
        getPaymentTransactions.mockResolvedValue(mockTxResponse([unknownTypeTx]));

        renderPage();

        expect(await screen.findByText("some_unknown_type")).toBeInTheDocument();
    });

    it("renders TxStatusBadge fallback for an unknown status", async () => {
        const unknownStatusTx = { ...baseTx, id: "tx-3", status: "weird_status" };
        getPaymentTransactions.mockResolvedValue(mockTxResponse([unknownStatusTx]));

        renderPage();

        expect(await screen.findByText("WEIRD_STATUS")).toBeInTheDocument();
    });

    it("shows '—' for commission rate sub-label when commissionRate is null", async () => {
        getPaymentStats.mockResolvedValue({ data: { ...baseStats, commissionRate: null } });

        renderPage();

        expect(await screen.findByText("—")).toBeInTheDocument();
    });

    it("renders the Avatar initials from a full name and a '?' fallback with no name", async () => {
        const noNameTx = { ...baseTx, id: "tx-4", user: { name: null, email: "x@y.com" } };
        getPaymentTransactions.mockResolvedValue(mockTxResponse([noNameTx]));

        renderPage();

        expect(await screen.findByText("?")).toBeInTheDocument();
    });

    it("debounces search input and navigates with the query, re-running the loader", async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        renderPage();
        await waitFor(() => expect(screen.getByText("TXN-001")).toBeInTheDocument());

        getPaymentTransactions.mockClear();
        await user.type(screen.getByPlaceholderText("Search user..."), "alice");

        act(() => {
            vi.advanceTimersByTime(400);
        });

        await waitFor(() => {
            expect(getPaymentTransactions).toHaveBeenCalledWith({ page: 1, limit: 15, search: "alice" });
        });
    });

    it("filters by transaction type when a filter pill is clicked", async () => {
        const user = userEvent.setup();
        renderPage();
        await waitFor(() => expect(screen.getByText("TXN-001")).toBeInTheDocument());

        getPaymentTransactions.mockClear();
        await user.click(screen.getByRole("button", { name: "Received" }));

        await waitFor(() => {
            expect(getPaymentTransactions).toHaveBeenCalledWith({ page: 1, limit: 15, type: "mentor_payout" });
        });
    });

    it("navigates pagination via prev/next and numbered page buttons", async () => {
        getPaymentTransactions.mockResolvedValue(
            mockTxResponse([baseTx], { totalCount: 60, currentPage: 2, totalPages: 4 }),
        );
        const user = userEvent.setup();
        renderPage("/payments?page=2");
        await waitFor(() => expect(screen.getByText("TXN-001")).toBeInTheDocument());

        getPaymentTransactions.mockClear();
        await user.click(screen.getByRole("button", { name: "‹" }));
        await waitFor(() => {
            expect(getPaymentTransactions).toHaveBeenCalledWith({ page: 1, limit: 15 });
        });

        getPaymentTransactions.mockClear();
        await user.click(screen.getByRole("button", { name: "›" }));
        await waitFor(() => {
            // The mocked response always reports currentPage: 2 (it's a
            // static mock), so "next" is computed as currentPage+1 = 3,
            // same as the numbered-page-3 click below.
            expect(getPaymentTransactions).toHaveBeenCalledWith({ page: 3, limit: 15 });
        });

        getPaymentTransactions.mockClear();
        await user.click(screen.getByRole("button", { name: "3" }));
        await waitFor(() => {
            expect(getPaymentTransactions).toHaveBeenCalledWith({ page: 3, limit: 15 });
        });
    });

    it("disables Prev on the first page and Next on the last page", async () => {
        getPaymentTransactions.mockResolvedValue(
            mockTxResponse([baseTx], { totalCount: 15, currentPage: 1, totalPages: 1 }),
        );

        renderPage();
        await waitFor(() => expect(screen.getByText("TXN-001")).toBeInTheDocument());

        expect(screen.getByRole("button", { name: "‹" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "›" })).toBeDisabled();
    });

    it("caps numbered page buttons at 5 even with more total pages", async () => {
        getPaymentTransactions.mockResolvedValue(
            mockTxResponse([baseTx], { totalCount: 200, currentPage: 1, totalPages: 20 }),
        );

        renderPage();
        await waitFor(() => expect(screen.getByText("TXN-001")).toBeInTheDocument());

        expect(screen.getByRole("button", { name: "5" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "6" })).not.toBeInTheDocument();
    });

    it("toggles row hover background and search-input focus/blur border color", async () => {
        renderPage();
        await waitFor(() => expect(screen.getByText("TXN-001")).toBeInTheDocument());

        const row = screen.getByText("TXN-001").closest("tr");
        fireEvent.mouseEnter(row);
        expect(row.style.background).toBe("rgb(250, 251, 252)");
        fireEvent.mouseLeave(row);
        expect(row.style.background).toBe("transparent");

        const searchInput = screen.getByPlaceholderText("Search user...");
        fireEvent.focus(searchInput);
        expect(searchInput.style.borderColor).toBe("rgb(147, 197, 253)");
        fireEvent.blur(searchInput);
        expect(searchInput.style.borderColor).toBe("rgb(226, 232, 240)");
    });
});