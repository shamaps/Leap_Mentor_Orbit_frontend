import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import adminAxiosInstance from "../../../shared/utils/axiosInstance";
import { useToast } from "../../../shared/context/ToastContext";
import AdminEngagements from "../../../features/admin/view/pages/AdminEngagements";

vi.mock("../../../shared/utils/axiosInstance");
vi.mock("../../../shared/context/ToastContext");

const baseStats = { total: 10, pending: 2, ongoing: 3, completed: 4, rejected: 1 };

const baseEngagement = {
    _id: "eng-1",
    mentor: { name: "Alice Mentor", email: "alice@leapmentor.com" },
    mentee: { name: "Bob Mentee", email: "bob@leapmentor.com" },
    status: "ongoing",
    paymentStatus: "paid",
    requestedAt: "2026-06-01T00:00:00Z",
    respondedAt: "2026-06-02T00:00:00Z",
    completedAt: null,
    sessionRate: 500,
    sessionCount: 4,
    selectedSlots: [
        { date: "2026-06-10", startTime: "10:00", endTime: "10:30", status: "booked" },
        { date: "2026-06-12", startTime: "11:00", endTime: "11:30", status: "cancelled" },
    ],
};

const mockEngagementsResponse = (engagements, pagination) => ({
    data: { engagements, pagination: pagination || { total: engagements.length, page: 1, totalPages: 1 } },
});

describe("AdminEngagements", () => {
    let showToast;

    beforeEach(() => {
        vi.clearAllMocks();
        showToast = vi.fn();
        useToast.mockReturnValue({ showToast });
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/engagements/stats") {
                return Promise.resolve({ data: baseStats });
            }
            if (url === "/admin/engagements") {
                return Promise.resolve(mockEngagementsResponse([baseEngagement]));
            }
            return Promise.resolve({ data: {} });
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("fetches stats and engagements on mount, and renders stat cards", async () => {
        render(<AdminEngagements />);

        await waitFor(() => {
            expect(screen.getByText("Alice Mentor")).toBeInTheDocument();
        });

        expect(adminAxiosInstance.get).toHaveBeenCalledWith("/admin/engagements/stats");
        expect(adminAxiosInstance.get).toHaveBeenCalledWith(
            "/admin/engagements",
            { params: { page: 1, limit: 15 } },
        );
        expect(screen.getByText("Total")).toBeInTheDocument();
        expect(screen.getByText("10")).toBeInTheDocument();
    });

    it("shows a toast error when stats fail to load", async () => {
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/engagements/stats") return Promise.reject(new Error("fail"));
            return Promise.resolve(mockEngagementsResponse([baseEngagement]));
        });

        render(<AdminEngagements />);

        await waitFor(() => {
            expect(showToast).toHaveBeenCalledWith({ message: "Failed to load stats.", type: "error" });
        });
    });

    it("shows a toast error when engagements fail to load", async () => {
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/engagements/stats") return Promise.resolve({ data: baseStats });
            return Promise.reject(new Error("fail"));
        });

        render(<AdminEngagements />);

        await waitFor(() => {
            expect(showToast).toHaveBeenCalledWith({
                type: "error",
                message: "Failed to load engagements.",
            });
        });
    });

    it("shows skeleton rows while loading", () => {
        adminAxiosInstance.get.mockImplementation(() => new Promise(() => { }));

        const { container } = render(<AdminEngagements />);

        expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    });

    it("shows an empty state when there are no engagements", async () => {
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/engagements/stats") return Promise.resolve({ data: baseStats });
            return Promise.resolve(mockEngagementsResponse([]));
        });

        render(<AdminEngagements />);

        expect(await screen.findByText("No engagements found.")).toBeInTheDocument();
    });

    it("expands a row on click to reveal slot and session details, and collapses on second click", async () => {
        const user = userEvent.setup();
        render(<AdminEngagements />);
        await waitFor(() => expect(screen.getByText("Alice Mentor")).toBeInTheDocument());

        await user.click(screen.getByText("Alice Mentor"));

        expect(await screen.findByText("Proposed Slots")).toBeInTheDocument();
        expect(screen.getByText("Session Details")).toBeInTheDocument();
        expect(screen.getByText("₹500")).toBeInTheDocument();
        expect(screen.getByText(/Cancelled/)).toBeInTheDocument();

        await user.click(screen.getByText("Alice Mentor"));
        expect(screen.queryByText("Proposed Slots")).not.toBeInTheDocument();
    });

    it("renders fallback dashes for an engagement with minimal/missing fields", async () => {
        const minimalEng = {
            _id: "eng-2",
            mentor: null,
            mentee: null,
            status: "pending",
            paymentStatus: null,
            requestedAt: null,
            respondedAt: null,
            completedAt: null,
            sessionRate: null,
            sessionCount: null,
            selectedSlots: [],
        };
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/engagements/stats") return Promise.resolve({ data: baseStats });
            return Promise.resolve(mockEngagementsResponse([minimalEng]));
        });
        const user = userEvent.setup();
        render(<AdminEngagements />);
        await waitFor(() => expect(screen.getAllByText("—").length).toBeGreaterThan(0));

        const row = screen.getAllByText("—")[0].closest("tr");
        await user.click(row);

        expect(await screen.findByText("Session Details")).toBeInTheDocument();
    });

    it("shows 0 active-slot count (not the sessionCount fallback) when all slots are cancelled", async () => {
        const engNoActiveSlots = {
            ...baseEngagement,
            _id: "eng-3",
            selectedSlots: [{ date: "2026-06-10", startTime: "9:00", endTime: "9:30", status: "cancelled" }],
            sessionCount: 7,
        };
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/engagements/stats") return Promise.resolve({ data: baseStats });
            return Promise.resolve(mockEngagementsResponse([engNoActiveSlots]));
        });
        const user = userEvent.setup();
        render(<AdminEngagements />);
        await waitFor(() => expect(screen.getByText("Alice Mentor")).toBeInTheDocument());

        await user.click(screen.getByText("Alice Mentor"));

        expect(
            await screen.findByText((content, element) => element?.textContent === "0"),
        ).toBeInTheDocument();
    });

    it("uses the sessionCount fallback when selectedSlots is entirely absent", async () => {
        const engNoSlotsField = {
            ...baseEngagement,
            _id: "eng-3b",
            selectedSlots: undefined,
            sessionCount: 7,
        };
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/engagements/stats") return Promise.resolve({ data: baseStats });
            return Promise.resolve(mockEngagementsResponse([engNoSlotsField]));
        });
        const user = userEvent.setup();
        render(<AdminEngagements />);
        await waitFor(() => expect(screen.getByText("Alice Mentor")).toBeInTheDocument());

        await user.click(screen.getByText("Alice Mentor"));

        expect(
            await screen.findByText((content, element) => element?.textContent === "7"),
        ).toBeInTheDocument();
    });

    it("debounces search input and calls fetchEngagements with the query", async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
        render(<AdminEngagements />);
        await waitFor(() => expect(screen.getByText("Alice Mentor")).toBeInTheDocument());

        adminAxiosInstance.get.mockClear();
        await user.type(screen.getByPlaceholderText("Search mentor or mentee..."), "alice");

        act(() => {
            vi.advanceTimersByTime(400);
        });

        await waitFor(() => {
            expect(adminAxiosInstance.get).toHaveBeenCalledWith(
                "/admin/engagements",
                { params: { page: 1, limit: 15, search: "alice" } },
            );
        });
    });

    it("filters by status when a status pill is clicked", async () => {
        const user = userEvent.setup();
        render(<AdminEngagements />);
        await waitFor(() => expect(screen.getByText("Alice Mentor")).toBeInTheDocument());

        adminAxiosInstance.get.mockClear();
        await user.click(screen.getByRole("button", { name: "pending" }));

        await waitFor(() => {
            expect(adminAxiosInstance.get).toHaveBeenCalledWith(
                "/admin/engagements",
                { params: { page: 1, limit: 15, status: "pending" } },
            );
        });
    });

    it("filters by date range and clears the filter", async () => {
        const user = userEvent.setup();
        const { container } = render(<AdminEngagements />);
        await waitFor(() => expect(screen.getByText("Alice Mentor")).toBeInTheDocument());

        const dateInputs = container.querySelectorAll('input[type="date"]');
        adminAxiosInstance.get.mockClear();

        await user.type(dateInputs[0], "2026-06-01");
        await waitFor(() => {
            expect(adminAxiosInstance.get).toHaveBeenCalledWith(
                "/admin/engagements",
                { params: { page: 1, limit: 15, dateFrom: "2026-06-01" } },
            );
        });

        adminAxiosInstance.get.mockClear();
        await user.type(dateInputs[1], "2026-06-30");
        await waitFor(() => {
            expect(adminAxiosInstance.get).toHaveBeenCalledWith(
                "/admin/engagements",
                { params: { page: 1, limit: 15, dateFrom: "2026-06-01", dateTo: "2026-06-30" } },
            );
        });

        const clearButton = await screen.findByRole("button", { name: /clear/i });
        adminAxiosInstance.get.mockClear();
        await user.click(clearButton);

        await waitFor(() => {
            expect(adminAxiosInstance.get).toHaveBeenCalledWith(
                "/admin/engagements",
                { params: { page: 1, limit: 15 } },
            );
        });
    });

    it("renders pagination controls and navigates prev/next", async () => {
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/engagements/stats") return Promise.resolve({ data: baseStats });
            return Promise.resolve(
                mockEngagementsResponse([baseEngagement], { total: 45, page: 2, totalPages: 3 }),
            );
        });
        const user = userEvent.setup();
        render(<AdminEngagements />);
        await waitFor(() => expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument());

        adminAxiosInstance.get.mockClear();
        await user.click(screen.getByRole("button", { name: /prev/i }));
        await waitFor(() => {
            expect(adminAxiosInstance.get).toHaveBeenCalledWith(
                "/admin/engagements",
                { params: { page: 1, limit: 15 } },
            );
        });

        adminAxiosInstance.get.mockClear();
        await user.click(screen.getByRole("button", { name: /next/i }));
        await waitFor(() => {
            expect(adminAxiosInstance.get).toHaveBeenCalledWith(
                "/admin/engagements",
                { params: { page: 3, limit: 15 } },
            );
        });
    });

    it("disables Prev on the first page and Next on the last page", async () => {
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/engagements/stats") return Promise.resolve({ data: baseStats });
            return Promise.resolve(
                mockEngagementsResponse([baseEngagement], { total: 30, page: 1, totalPages: 2 }),
            );
        });
        render(<AdminEngagements />);
        await waitFor(() => expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument());

        expect(screen.getByRole("button", { name: /prev/i })).toBeDisabled();
        expect(screen.getByRole("button", { name: /next/i })).not.toBeDisabled();
    });

    it("does not render pagination when totalPages is 1", async () => {
        render(<AdminEngagements />);
        await waitFor(() => expect(screen.getByText("Alice Mentor")).toBeInTheDocument());

        expect(screen.queryByRole("button", { name: /prev/i })).not.toBeInTheDocument();
    });

    it("renders an Avatar with a fallback '?' when name is missing", async () => {
        const noNameEng = {
            ...baseEngagement,
            _id: "eng-4",
            mentor: { name: null, email: "noone@leapmentor.com" },
        };
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/engagements/stats") return Promise.resolve({ data: baseStats });
            return Promise.resolve(mockEngagementsResponse([noNameEng]));
        });
        render(<AdminEngagements />);

        await waitFor(() => {
            expect(screen.getByText("?")).toBeInTheDocument();
        });
    });

    it("shows the Completed At date and falls back to '—' when both selectedSlots and sessionCount are absent", async () => {
        const completedEng = {
            ...baseEngagement,
            _id: "eng-5",
            completedAt: "2026-06-20T00:00:00Z",
            selectedSlots: undefined,
            sessionCount: undefined,
        };
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/engagements/stats") return Promise.resolve({ data: baseStats });
            return Promise.resolve(mockEngagementsResponse([completedEng]));
        });
        const user = userEvent.setup();
        render(<AdminEngagements />);
        await waitFor(() => expect(screen.getByText("Alice Mentor")).toBeInTheDocument());

        await user.click(screen.getByText("Alice Mentor"));

        expect(await screen.findByText("Jun 20, 2026")).toBeInTheDocument();
        expect(
            screen.getByText((content, element) => element?.textContent === "—" && element.tagName === "DIV"),
        ).toBeInTheDocument();
    });

    it("applies and clears row hover background on mouse enter/leave", async () => {
        render(<AdminEngagements />);
        await waitFor(() => expect(screen.getByText("Alice Mentor")).toBeInTheDocument());

        const row = screen.getByText("Alice Mentor").closest("tr");
        fireEvent.mouseEnter(row);
        expect(row.style.background).toBe("rgb(250, 251, 252)");

        fireEvent.mouseLeave(row);
        expect(row.style.background).toBe("transparent");
    });

    it("does not change row hover background while the row is expanded", async () => {
        const user = userEvent.setup();
        render(<AdminEngagements />);
        await waitFor(() => expect(screen.getByText("Alice Mentor")).toBeInTheDocument());

        await user.click(screen.getByText("Alice Mentor"));
        await screen.findByText("Proposed Slots");

        const expandedRow = screen.getByText("Alice Mentor").closest("tr");
        const backgroundBeforeHover = expandedRow.style.background;

        fireEvent.mouseEnter(expandedRow);
        expect(expandedRow.style.background).toBe(backgroundBeforeHover);

        fireEvent.mouseLeave(expandedRow);
        expect(expandedRow.style.background).toBe(backgroundBeforeHover);
    });

    it("toggles search input border color on focus/blur", async () => {
        render(<AdminEngagements />);
        await waitFor(() => expect(screen.getByText("Alice Mentor")).toBeInTheDocument());

        const searchInput = screen.getByPlaceholderText("Search mentor or mentee...");
        fireEvent.focus(searchInput);
        expect(searchInput.style.borderColor).toBe("rgb(147, 197, 253)");

        fireEvent.blur(searchInput);
        expect(searchInput.style.borderColor).toBe("rgb(226, 232, 240)");
    });
});