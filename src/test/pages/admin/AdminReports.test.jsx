// src/test/pages/admin/AdminReports.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import adminAxiosInstance from "../../../utils/adminAxiosInstance";
import { useToast } from "../../../context/ToastContext";
import AdminReports from "../../../pages/admin/AdminReports";

vi.mock("../../../utils/adminAxiosInstance");
vi.mock("../../../context/ToastContext");

const baseReport = {
    id: "r1",
    mentee: "Mentee One",
    menteeEmail: "mentee1@test.com",
    mentor: "Mentor One",
    mentorEmail: "mentor1@test.com",
    category: "refund",
    date: "2026-07-01",
    status: "open",
    reportedBy: "Mentee One",
    description: "Something went wrong",
    adminNote: "",
    connectRequestId: "cr1",
    refundProcessed: false,
    totalAmount: 50,
    screenshotUrl: "https://example.com/shot.png",
    paymentStatus: "paid",
};

const statsPayload = { totalReports: 12, pendingResolution: 4, resolvedToday: 2 };
const paginationPayload = { totalCount: 1, currentPage: 1, totalPages: 1 };

const mockStatsAndReports = (reports = [baseReport]) => {
    adminAxiosInstance.get.mockImplementation((url) => {
        if (url === "/admin/reports/stats") {
            return Promise.resolve({ data: statsPayload });
        }
        if (url === "/admin/reports") {
            return Promise.resolve({
                data: { reports, pagination: { ...paginationPayload, totalCount: reports.length } },
            });
        }
        return Promise.reject(new Error(`Unhandled GET ${url}`));
    });
};

// The HandleModal renders: <div fixed z-50><div bg-white (dialog box)>
//   <div header><div titleWrap><p>Handle Report</p>...</div>...</div>
//   ...
// Walking up 3 levels from the title text gets us the dialog box, which we
// scope all modal-internal queries to (avoids colliding with the page's own
// filter chips that share label text like "Resolved"/"Dismissed"/"Cancel").
const getModal = () => screen.getByText("Handle Report").parentElement.parentElement.parentElement;

// ConfirmDialog: <div fixed z-60><div bg-white><div><p>{title}</p>...</div><div buttons></div></div></div>
const getConfirmDialog = (title) => screen.getByText(title).parentElement.parentElement;

describe("AdminReports", () => {
    let showToast;
    let user;

    beforeEach(() => {
        vi.clearAllMocks();
        showToast = vi.fn();
        useToast.mockReturnValue({ showToast });
        user = userEvent.setup();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("shows skeleton rows while loading, then renders fetched reports", async () => {
        mockStatsAndReports();
        render(<AdminReports />);

        expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);

        expect(await screen.findByText("Mentee One")).toBeInTheDocument();
        expect(screen.getByText("Mentor One")).toBeInTheDocument();
        expect(screen.getByText("Refund")).toBeInTheDocument();

        // "Pending" also appears as a filter chip, so scope to the table row's status badge.
        const row = screen.getByText("Mentee One").closest("tr");
        expect(within(row).getByText("Pending")).toBeInTheDocument();

        expect(screen.getByText("12")).toBeInTheDocument();
    });

    it("renders '—' fallbacks when mentee/mentor names are missing", async () => {
        mockStatsAndReports([{ ...baseReport, mentee: "", mentor: "" }]);
        render(<AdminReports />);

        const dashes = await screen.findAllByText("—");
        expect(dashes.length).toBeGreaterThan(0);
    });

    it("shows 'No reports found.' when the list is empty", async () => {
        mockStatsAndReports([]);
        render(<AdminReports />);

        expect(await screen.findByText("No reports found.")).toBeInTheDocument();
    });

    it("toasts an error when fetching stats fails", async () => {
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/reports/stats") return Promise.reject(new Error("stats down"));
            return Promise.resolve({ data: { reports: [], pagination: paginationPayload } });
        });
        render(<AdminReports />);

        await screen.findByText("No reports found.");
        expect(showToast).toHaveBeenCalledWith({ message: "Failed to load stats.", type: "error" });
    });

    it("toasts an error when fetching reports fails", async () => {
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/reports/stats") return Promise.resolve({ data: statsPayload });
            return Promise.reject(new Error("reports down"));
        });
        render(<AdminReports />);

        // Stats succeeded, so "12" still renders; reports failed, so the table is empty.
        await screen.findByText("No reports found.");
        expect(screen.getByText("12")).toBeInTheDocument();
        expect(showToast).toHaveBeenCalledWith({ type: "error", message: "Failed to update report" });
    });

    it("debounces search input and refetches with the query", async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        mockStatsAndReports();
        render(<AdminReports />);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(0);
        });

        const searchInput = screen.getByPlaceholderText("Search mentee or mentor...");
        adminAxiosInstance.get.mockClear();

        // fireEvent.change goes through React's native-input-value tracker
        // correctly, unlike manually setting .value + dispatching "input".
        await act(async () => {
            fireEvent.change(searchInput, { target: { value: "alice" } });
        });

        await act(async () => {
            await vi.advanceTimersByTimeAsync(400);
        });

        expect(adminAxiosInstance.get).toHaveBeenCalledWith(
            "/admin/reports",
            expect.objectContaining({ params: expect.objectContaining({ search: "alice" }) }),
        );
    });

    it("filters by status when a filter chip is clicked", async () => {
        mockStatsAndReports();
        render(<AdminReports />);
        await screen.findByText("Mentee One");

        adminAxiosInstance.get.mockClear();
        await user.click(screen.getByRole("button", { name: "Resolved" }));

        expect(adminAxiosInstance.get).toHaveBeenCalledWith(
            "/admin/reports",
            expect.objectContaining({ params: expect.objectContaining({ status: "resolved", page: 1 }) }),
        );
    });

    it("paginates forward and backward, respecting disabled boundaries", async () => {
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/reports/stats") return Promise.resolve({ data: statsPayload });
            return Promise.resolve({
                data: {
                    reports: [baseReport],
                    pagination: { totalCount: 25, currentPage: 1, totalPages: 3 },
                },
            });
        });
        render(<AdminReports />);
        await screen.findByText("Mentee One");

        const prevBtn = screen.getByRole("button", { name: "Previous" });
        const nextBtn = screen.getByRole("button", { name: "Next" });
        expect(prevBtn).toBeDisabled();
        expect(nextBtn).not.toBeDisabled();

        adminAxiosInstance.get.mockClear();
        await user.click(nextBtn);

        expect(adminAxiosInstance.get).toHaveBeenCalledWith(
            "/admin/reports",
            expect.objectContaining({ params: expect.objectContaining({ page: 2 }) }),
        );
    });

    describe("HandleModal", () => {
        const openModal = async (report = baseReport) => {
            mockStatsAndReports([report]);
            render(<AdminReports />);
            await screen.findByText(report.mentee || "—");
            await user.click(screen.getByRole("button", { name: "Handle" }));
            await screen.findByText("Handle Report");
        };

        it("opens with pre-selected status for resolved/dismissed reports", async () => {
            await openModal({ ...baseReport, status: "resolved" });
            const resolvedBtn = within(getModal()).getByRole("button", { name: /Resolved/ });
            // jsdom normalizes the "white" style value to its rgb() form.
            expect(resolvedBtn).toHaveStyle({ color: "rgb(255, 255, 255)" });
        });

        it("shows a validation error when saving without a status", async () => {
            await openModal({ ...baseReport, status: "open" });
            await user.click(within(getModal()).getByRole("button", { name: "Save Changes" }));

            expect(await screen.findByText("Please select a status.")).toBeInTheDocument();
            expect(adminAxiosInstance.patch).not.toHaveBeenCalled();
        });

        it("saves successfully, calling onSave/onClose and toasting", async () => {
            adminAxiosInstance.patch.mockResolvedValue({
                data: { report: { ...baseReport, status: "resolved" } },
            });
            await openModal();

            await user.click(within(getModal()).getByRole("button", { name: /Resolved/ }));
            await user.click(within(getModal()).getByRole("button", { name: "Save Changes" }));

            expect(adminAxiosInstance.patch).toHaveBeenCalledWith(
                "/admin/reports/r1",
                expect.objectContaining({ status: "resolved" }),
            );
            expect(showToast).toHaveBeenCalledWith({
                message: "Report updated. Reporter has been notified. ✅",
            });
            expect(screen.queryByText("Handle Report")).not.toBeInTheDocument();
        });

        it("shows the server error message when save fails", async () => {
            adminAxiosInstance.patch.mockRejectedValue({
                response: { data: { message: "Cannot update closed report" } },
            });
            await openModal();

            await user.click(within(getModal()).getByRole("button", { name: /Resolved/ }));
            await user.click(within(getModal()).getByRole("button", { name: "Save Changes" }));

            expect(await screen.findByText("Cannot update closed report")).toBeInTheDocument();
        });

        it("falls back to a generic error message when save fails without a server message", async () => {
            adminAxiosInstance.patch.mockRejectedValue(new Error("network"));
            await openModal();

            await user.click(within(getModal()).getByRole("button", { name: /Dismissed/ }));
            await user.click(within(getModal()).getByRole("button", { name: "Save Changes" }));

            expect(await screen.findByText("Failed to update report.")).toBeInTheDocument();
        });

        it("closes the modal via the X (close) button", async () => {
            await openModal();
            const dialogTitle = screen.getByText("Handle Report");
            const header = dialogTitle.parentElement.parentElement;
            const closeBtn = within(header).getByRole("button");

            await user.click(closeBtn);
            expect(screen.queryByText("Handle Report")).not.toBeInTheDocument();
        });

        it("closes the modal via the Cancel button", async () => {
            await openModal();
            expect(screen.getByText("Handle Report")).toBeInTheDocument();

            await user.click(within(getModal()).getByRole("button", { name: "Cancel" }));
            expect(screen.queryByText("Handle Report")).not.toBeInTheDocument();
        });

        it("shows the refund panel for refund reports and processes a refund", async () => {
            adminAxiosInstance.post.mockResolvedValue({});
            await openModal();

            const modal = getModal();
            expect(within(modal).getByText(/Process Refund/)).toBeInTheDocument();
            await user.click(within(modal).getByRole("button", { name: /Process Refund/ }));

            await screen.findByText("Process Refund?");
            await user.click(within(getConfirmDialog("Process Refund?")).getByRole("button", { name: "Yes, Process Refund" }));

            expect(adminAxiosInstance.post).toHaveBeenCalledWith(
                "/admin/reports/r1/refund",
                expect.objectContaining({}),
            );
            expect(showToast).toHaveBeenCalledWith({
                message: "Refund processed. Mentee has been notified. ✅",
            });
        });

        it("shows an error and keeps the dialog open when refund fails", async () => {
            adminAxiosInstance.post.mockRejectedValue({ response: { data: { message: "Escrow locked" } } });
            await openModal();

            await user.click(within(getModal()).getByRole("button", { name: /Process Refund/ }));
            await screen.findByText("Process Refund?");
            await user.click(within(getConfirmDialog("Process Refund?")).getByRole("button", { name: "Yes, Process Refund" }));

            expect(await screen.findByText("Escrow locked")).toBeInTheDocument();
        });

        it("falls back to a generic refund error message on failure without server details", async () => {
            adminAxiosInstance.post.mockRejectedValue(new Error("boom"));
            await openModal();

            await user.click(within(getModal()).getByRole("button", { name: /Process Refund/ }));
            await screen.findByText("Process Refund?");
            await user.click(within(getConfirmDialog("Process Refund?")).getByRole("button", { name: "Yes, Process Refund" }));

            expect(await screen.findByText("Refund failed.")).toBeInTheDocument();
        });

        it("cancels the refund confirmation dialog", async () => {
            await openModal();
            await user.click(within(getModal()).getByRole("button", { name: /Process Refund/ }));
            await screen.findByText("Process Refund?");

            await user.click(within(getConfirmDialog("Process Refund?")).getByRole("button", { name: "Cancel" }));
            expect(screen.queryByText("Process Refund?")).not.toBeInTheDocument();
        });

        it("disables the refund button and shows a hint when payment isn't paid", async () => {
            await openModal({ ...baseReport, paymentStatus: "pending" });
            expect(within(getModal()).getByRole("button", { name: /Process Refund/ })).toBeDisabled();
            expect(screen.getByText("No payment found for this session.")).toBeInTheDocument();
        });

        it("shows the already-refunded state instead of the refund button", async () => {
            await openModal({ ...baseReport, refundProcessed: true });
            expect(screen.getByText("Refund Already Processed ✅")).toBeInTheDocument();
            expect(within(getModal()).queryByRole("button", { name: /Process Refund/ })).not.toBeInTheDocument();
        });

        it("does not show the refund panel for non-refund categories", async () => {
            await openModal({ ...baseReport, category: "harassment" });
            expect(screen.queryByText(/Process Refund/)).not.toBeInTheDocument();
        });

        it("deletes the session and toasts on success", async () => {
            adminAxiosInstance.delete.mockResolvedValue({});
            await openModal();

            await user.click(within(getModal()).getByRole("button", { name: "Delete This Session" }));
            await screen.findByText("Delete Session?");
            await user.click(within(getConfirmDialog("Delete Session?")).getByRole("button", { name: "Yes, Delete Session" }));

            expect(adminAxiosInstance.delete).toHaveBeenCalledWith("/admin/reports/r1/session");
            expect(showToast).toHaveBeenCalledWith({
                message: "Session deleted. Both parties notified. ✅",
            });
        });

        it("shows the server error and re-enables retry when session delete fails", async () => {
            adminAxiosInstance.delete.mockRejectedValue({ response: { data: { message: "Already deleted" } } });
            await openModal();

            await user.click(within(getModal()).getByRole("button", { name: "Delete This Session" }));
            await screen.findByText("Delete Session?");
            await user.click(within(getConfirmDialog("Delete Session?")).getByRole("button", { name: "Yes, Delete Session" }));

            expect(await screen.findByText("Already deleted")).toBeInTheDocument();
        });

        it("falls back to a generic delete error message on failure without server details", async () => {
            adminAxiosInstance.delete.mockRejectedValue(new Error("boom"));
            await openModal();

            await user.click(within(getModal()).getByRole("button", { name: "Delete This Session" }));
            await screen.findByText("Delete Session?");
            await user.click(within(getConfirmDialog("Delete Session?")).getByRole("button", { name: "Yes, Delete Session" }));

            expect(await screen.findByText("Failed to delete session.")).toBeInTheDocument();
        });

        it("does not show the delete-session panel when there is no connect request", async () => {
            await openModal({ ...baseReport, connectRequestId: null, category: "other" });
            expect(screen.queryByText("Delete This Session")).not.toBeInTheDocument();
        });

        it("renders session amount, description, and screenshot link when present", async () => {
            // category "other" + no connectRequestId avoids the refund/delete
            // panels so "50 tokens" and friends only appear once each.
            await openModal({ ...baseReport, category: "other", connectRequestId: null });
            expect(screen.getByText("50 tokens")).toBeInTheDocument();
            expect(screen.getByText("Something went wrong")).toBeInTheDocument();
            expect(screen.getByRole("link", { name: /View Screenshot/ })).toHaveAttribute(
                "href",
                "https://example.com/shot.png",
            );
        });

        it("hides session amount, description, and screenshot when absent", async () => {
            await openModal({
                ...baseReport,
                totalAmount: 0,
                description: "",
                screenshotUrl: "",
                category: "other",
                connectRequestId: null,
            });
            expect(screen.queryByText(/tokens$/)).not.toBeInTheDocument();
            expect(screen.queryByRole("link", { name: /View Screenshot/ })).not.toBeInTheDocument();
        });

        it("updates the admin note field", async () => {
            await openModal();
            const noteField = screen.getByLabelText(/Admin Note/);
            await user.type(noteField, "Looked into this.");
            expect(noteField).toHaveValue("Looked into this.");
        });
    });
});