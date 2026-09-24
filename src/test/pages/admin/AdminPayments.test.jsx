import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import adminAxiosInstance from "../../../shared/utils/axiosInstance";
import { useToast } from "../../../shared/context/ToastContext";
import AdminPayments from "../../../features/admin/view/pages/AdminPayments";

vi.mock("../../../shared/utils/axiosInstance");
vi.mock("../../../shared/context/ToastContext");

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
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/payments/stats") return Promise.resolve({ data: baseStats });
            if (url === "/admin/payments/chart") return Promise.resolve({ data: baseChart });
            if (url === "/admin/payments/transactions") return Promise.resolve(mockTxResponse([baseTx]));
            return Promise.resolve({ data: {} });
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("fetches stats, chart, and transactions on mount", async () => {
        render(<AdminPayments />);

        await waitFor(() => expect(screen.getByText("TXN-001")).toBeInTheDocument());

        expect(adminAxiosInstance.get).toHaveBeenCalledWith("/admin/payments/stats");
        expect(adminAxiosInstance.get).toHaveBeenCalledWith("/admin/payments/chart");
        expect(adminAxiosInstance.get).toHaveBeenCalledWith(
            "/admin/payments/transactions",
            { params: { page: 1, limit: 15 } },
        );
        expect(screen.getByText("Total Revenue")).toBeInTheDocument();
    });

    it("shows a toast error when stats fail to load", async () => {
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/payments/stats") return Promise.reject(new Error("fail"));
            if (url === "/admin/payments/chart") return Promise.resolve({ data: baseChart });
            return Promise.resolve(mockTxResponse([baseTx]));
        });

        render(<AdminPayments />);

        await waitFor(() => {
            expect(showToast).toHaveBeenCalledWith({ message: "Failed to load payment stats.", type: "error" });
        });
    });

    it("shows a toast error when the chart fails to load", async () => {
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/payments/stats") return Promise.resolve({ data: baseStats });
            if (url === "/admin/payments/chart") return Promise.reject(new Error("fail"));
            return Promise.resolve(mockTxResponse([baseTx]));
        });

        render(<AdminPayments />);

        await waitFor(() => {
            expect(showToast).toHaveBeenCalledWith({ message: "Failed to load chart.", type: "error" });
        });
    });

    it("shows a toast error when transactions fail to load", async () => {
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/payments/stats") return Promise.resolve({ data: baseStats });
            if (url === "/admin/payments/chart") return Promise.resolve({ data: baseChart });
            return Promise.reject(new Error("fail"));
        });

        render(<AdminPayments />);

        await waitFor(() => {
            expect(showToast).toHaveBeenCalledWith({ message: "Failed to load transactions.", type: "error" });
        });
    });

    it("defaults chartData to an empty array when the response has no data", async () => {
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/payments/stats") return Promise.resolve({ data: baseStats });
            if (url === "/admin/payments/chart") return Promise.resolve({ data: null });
            return Promise.resolve(mockTxResponse([baseTx]));
        });

        const { container } = render(<AdminPayments />);
        await waitFor(() => expect(screen.getByText("TXN-001")).toBeInTheDocument());

        expect(container.querySelector("#revGrad")).not.toBeInTheDocument();
    });

    it("defaults transactions to an empty array when the response omits transactions", async () => {
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/payments/stats") return Promise.resolve({ data: baseStats });
            if (url === "/admin/payments/chart") return Promise.resolve({ data: baseChart });
            return Promise.resolve({ data: { pagination: { totalCount: 0, currentPage: 1, totalPages: 1 } } });
        });

        render(<AdminPayments />);

        expect(await screen.findByText("No transactions found.")).toBeInTheDocument();
    });

    it("shows skeleton rows while transactions are loading", () => {
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/payments/stats") return Promise.resolve({ data: baseStats });
            if (url === "/admin/payments/chart") return Promise.resolve({ data: baseChart });
            return new Promise(() => { });
        });

        const { container } = render(<AdminPayments />);

        expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    });

    it("shows a chart skeleton while the chart is loading", () => {
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/payments/chart") return new Promise(() => { });
            if (url === "/admin/payments/stats") return Promise.resolve({ data: baseStats });
            return Promise.resolve(mockTxResponse([baseTx]));
        });

        const { container } = render(<AdminPayments />);

        expect(container.querySelector(".h-44.animate-pulse")).toBeInTheDocument();
    });

    it("renders no chart when chartData is empty and not loading", async () => {
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/payments/stats") return Promise.resolve({ data: baseStats });
            if (url === "/admin/payments/chart") return Promise.resolve({ data: [] });
            return Promise.resolve(mockTxResponse([baseTx]));
        });

        const { container } = render(<AdminPayments />);
        await waitFor(() => expect(screen.getByText("TXN-001")).toBeInTheDocument());

        expect(container.querySelector("#revGrad")).not.toBeInTheDocument();
    });

    it("renders the chart with hover tooltip interaction", async () => {
        const { container } = render(<AdminPayments />);
        await waitFor(() => expect(screen.getByText("TXN-001")).toBeInTheDocument());

        const chartSvg = container.querySelector("#revGrad").closest("svg");
        expect(chartSvg).toBeInTheDocument();

        const hoverRects = Array.from(chartSvg.querySelectorAll("rect")).filter(
            (r) => r.getAttribute("width") === "28",
        );
        expect(hoverRects.length).toBe(baseChart.length);

        fireEvent.mouseEnter(hoverRects[0]);
        expect(container.textContent).toContain("Jan");

        fireEvent.mouseLeave(chartSvg);
    });

    it("renders TxStatusBadge fallback for a falsy/missing status", async () => {
        const noStatusTx = { ...baseTx, id: "tx-3b", status: null };
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/payments/stats") return Promise.resolve({ data: baseStats });
            if (url === "/admin/payments/chart") return Promise.resolve({ data: baseChart });
            return Promise.resolve(mockTxResponse([noStatusTx]));
        });

        const { container } = render(<AdminPayments />);
        await waitFor(() => expect(screen.getByText("TXN-001")).toBeInTheDocument());

        const badgeText = Array.from(container.querySelectorAll("span.uppercase")).find(
            (el) => !el.className.includes("tracking-wide"),
        );
        expect(badgeText).toBeInTheDocument();
        expect(badgeText.textContent.trim()).toBe("");
    });

    it("handles a chart where every amount is 0 (max/range fallback branches)", async () => {
        const zeroChart = [{ label: "Jan", amount: 0 }, { label: "Feb", amount: 0 }];
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/payments/stats") return Promise.resolve({ data: baseStats });
            if (url === "/admin/payments/chart") return Promise.resolve({ data: zeroChart });
            return Promise.resolve(mockTxResponse([baseTx]));
        });

        const { container } = render(<AdminPayments />);
        await waitFor(() => expect(screen.getByText("TXN-001")).toBeInTheDocument());

        expect(container.querySelector("#revGrad")).toBeInTheDocument();
    });

    it("handles a chart where every amount is equal but non-zero (range fallback branch)", async () => {
        const flatChart = [{ label: "Jan", amount: 500 }, { label: "Feb", amount: 500 }];
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/payments/stats") return Promise.resolve({ data: baseStats });
            if (url === "/admin/payments/chart") return Promise.resolve({ data: flatChart });
            return Promise.resolve(mockTxResponse([baseTx]));
        });

        const { container } = render(<AdminPayments />);
        await waitFor(() => expect(screen.getByText("TXN-001")).toBeInTheDocument());

        expect(container.querySelector("#revGrad")).toBeInTheDocument();
    });

    it("formats small chart values (<1000) without the 'k' suffix", async () => {
        const smallChart = [{ label: "Jan", amount: 250 }, { label: "Feb", amount: 500 }];
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/payments/stats") return Promise.resolve({ data: baseStats });
            if (url === "/admin/payments/chart") return Promise.resolve({ data: smallChart });
            return Promise.resolve(mockTxResponse([baseTx]));
        });

        const { container } = render(<AdminPayments />);
        await waitFor(() => expect(screen.getByText("TXN-001")).toBeInTheDocument());

        expect(container.textContent).toContain("250");
    });

    it("renders chart x-axis labels keyed by index when label is missing", async () => {
        const unlabeledChart = [{ amount: 300 }, { amount: 700 }];
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/payments/stats") return Promise.resolve({ data: baseStats });
            if (url === "/admin/payments/chart") return Promise.resolve({ data: unlabeledChart });
            return Promise.resolve(mockTxResponse([baseTx]));
        });

        const { container } = render(<AdminPayments />);
        await waitFor(() => expect(screen.getByText("TXN-001")).toBeInTheDocument());

        expect(container.querySelector("#revGrad")).toBeInTheDocument();
    });

    it("renders TypeBadge fallback for an unknown transaction type", async () => {
        const unknownTypeTx = { ...baseTx, id: "tx-2", type: "some_unknown_type" };
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/payments/stats") return Promise.resolve({ data: baseStats });
            if (url === "/admin/payments/chart") return Promise.resolve({ data: baseChart });
            return Promise.resolve(mockTxResponse([unknownTypeTx]));
        });

        render(<AdminPayments />);

        expect(await screen.findByText("some_unknown_type")).toBeInTheDocument();
    });

    it("renders TxStatusBadge fallback for an unknown status", async () => {
        const unknownStatusTx = { ...baseTx, id: "tx-3", status: "weird_status" };
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/payments/stats") return Promise.resolve({ data: baseStats });
            if (url === "/admin/payments/chart") return Promise.resolve({ data: baseChart });
            return Promise.resolve(mockTxResponse([unknownStatusTx]));
        });

        render(<AdminPayments />);

        expect(await screen.findByText("WEIRD_STATUS")).toBeInTheDocument();
    });

    it("shows '—' for commission rate sub-label when commissionRate is null", async () => {
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/payments/stats") return Promise.resolve({ data: { ...baseStats, commissionRate: null } });
            if (url === "/admin/payments/chart") return Promise.resolve({ data: baseChart });
            return Promise.resolve(mockTxResponse([baseTx]));
        });

        render(<AdminPayments />);

        expect(await screen.findByText("—")).toBeInTheDocument();
    });

    it("renders the Avatar initials from a full name and a '?' fallback with no name", async () => {
        const noNameTx = { ...baseTx, id: "tx-4", user: { name: null, email: "x@y.com" } };
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/payments/stats") return Promise.resolve({ data: baseStats });
            if (url === "/admin/payments/chart") return Promise.resolve({ data: baseChart });
            return Promise.resolve(mockTxResponse([noNameTx]));
        });

        render(<AdminPayments />);

        expect(await screen.findByText("?")).toBeInTheDocument();
    });

    it("debounces search input and refetches transactions with the query", async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        render(<AdminPayments />);
        await waitFor(() => expect(screen.getByText("TXN-001")).toBeInTheDocument());

        adminAxiosInstance.get.mockClear();
        await user.type(screen.getByPlaceholderText("Search user..."), "alice");

        act(() => {
            vi.advanceTimersByTime(400);
        });

        await waitFor(() => {
            expect(adminAxiosInstance.get).toHaveBeenCalledWith(
                "/admin/payments/transactions",
                { params: { page: 1, limit: 15, search: "alice" } },
            );
        });
    });

    it("filters by transaction type when a filter pill is clicked", async () => {
        const user = userEvent.setup();
        render(<AdminPayments />);
        await waitFor(() => expect(screen.getByText("TXN-001")).toBeInTheDocument());

        adminAxiosInstance.get.mockClear();
        await user.click(screen.getByRole("button", { name: "Received" }));

        await waitFor(() => {
            expect(adminAxiosInstance.get).toHaveBeenCalledWith(
                "/admin/payments/transactions",
                { params: { page: 1, limit: 15, type: "mentor_payout" } },
            );
        });
    });

    it("navigates pagination via prev/next and numbered page buttons", async () => {
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/payments/stats") return Promise.resolve({ data: baseStats });
            if (url === "/admin/payments/chart") return Promise.resolve({ data: baseChart });
            return Promise.resolve(
                mockTxResponse([baseTx], { totalCount: 60, currentPage: 2, totalPages: 4 }),
            );
        });
        const user = userEvent.setup();
        render(<AdminPayments />);
        await waitFor(() => expect(screen.getByText("TXN-001")).toBeInTheDocument());

        adminAxiosInstance.get.mockClear();
        await user.click(screen.getByRole("button", { name: "‹" }));
        await waitFor(() => {
            expect(adminAxiosInstance.get).toHaveBeenCalledWith(
                "/admin/payments/transactions",
                { params: { page: 1, limit: 15 } },
            );
        });

        adminAxiosInstance.get.mockClear();
        await user.click(screen.getByRole("button", { name: "›" }));
        await waitFor(() => {
            expect(adminAxiosInstance.get).toHaveBeenCalledWith(
                "/admin/payments/transactions",
                { params: { page: 3, limit: 15 } },
            );
        });

        adminAxiosInstance.get.mockClear();
        await user.click(screen.getByRole("button", { name: "3" }));
        await waitFor(() => {
            expect(adminAxiosInstance.get).toHaveBeenCalledWith(
                "/admin/payments/transactions",
                { params: { page: 3, limit: 15 } },
            );
        });
    });

    it("disables Prev on the first page and Next on the last page", async () => {
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/payments/stats") return Promise.resolve({ data: baseStats });
            if (url === "/admin/payments/chart") return Promise.resolve({ data: baseChart });
            return Promise.resolve(
                mockTxResponse([baseTx], { totalCount: 15, currentPage: 1, totalPages: 1 }),
            );
        });

        render(<AdminPayments />);
        await waitFor(() => expect(screen.getByText("TXN-001")).toBeInTheDocument());

        expect(screen.getByRole("button", { name: "‹" })).toBeDisabled();
        expect(screen.getByRole("button", { name: "›" })).toBeDisabled();
    });

    it("caps numbered page buttons at 5 even with more total pages", async () => {
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/payments/stats") return Promise.resolve({ data: baseStats });
            if (url === "/admin/payments/chart") return Promise.resolve({ data: baseChart });
            return Promise.resolve(
                mockTxResponse([baseTx], { totalCount: 200, currentPage: 1, totalPages: 20 }),
            );
        });

        render(<AdminPayments />);
        await waitFor(() => expect(screen.getByText("TXN-001")).toBeInTheDocument());

        expect(screen.getByRole("button", { name: "5" })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "6" })).not.toBeInTheDocument();
    });

    it("toggles row hover background and search-input focus/blur border color", async () => {
        render(<AdminPayments />);
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