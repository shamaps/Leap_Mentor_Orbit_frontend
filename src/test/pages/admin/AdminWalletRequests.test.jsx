import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import adminAxiosInstance from "../../../shared/utils/axiosInstance";
import { useToast } from "../../../shared/context/ToastContext";
import AdminWalletRequests from "../../../features/admin/view/pages/AdminWalletRequests";

vi.mock("../../../shared/utils/axiosInstance");
vi.mock("../../../shared/context/ToastContext");

const baseRequest = {
    _id: "req-1",
    mentee: {
        _id: "mentee-1",
        name: "Bob Mentee",
        email: "bob@leapmentor.com",
        profilePicture: null,
    },
    currentBalance: 1200,
    createdAt: "2026-06-01T00:00:00Z",
    status: "pending",
};

const baseEngagement = {
    _id: "eng-1",
    mentor: { name: "Alice Mentor" },
    mentee: { _id: "mentee-1", email: "bob@leapmentor.com" },
    paymentStatus: "paid",
    sessionRate: 500,
    requestedAt: "2026-06-01T00:00:00Z",
    respondedAt: "2026-06-02T00:00:00Z",
    completedAt: "2026-06-05T00:00:00Z",
    selectedSlots: [
        { date: "2026-06-10", startTime: "10:00", endTime: "10:30", status: "completed" },
        { date: "2026-06-12", startTime: "11:00", endTime: "11:30", status: "booked" },
    ],
};

describe("AdminWalletRequests", () => {
    let showToast;

    beforeEach(() => {
        vi.clearAllMocks();
        showToast = vi.fn();
        useToast.mockReturnValue({ showToast });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("shows loading spinner then renders fetched requests", async () => {
        adminAxiosInstance.get.mockResolvedValueOnce({ data: { requests: [baseRequest] } });

        render(<AdminWalletRequests />);

        expect(screen.getByText("Loading requests…")).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText("Bob Mentee")).toBeInTheDocument();
        });

        expect(adminAxiosInstance.get).toHaveBeenCalledWith("/admin/leap-requests");
        expect(screen.getByText("1,200 LP")).toBeInTheDocument();
        expect(screen.getByText("bob@leapmentor.com")).toBeInTheDocument();
    });

    it("falls back to res.data when res.data.requests is absent", async () => {
        adminAxiosInstance.get.mockResolvedValueOnce({ data: [baseRequest] });

        render(<AdminWalletRequests />);

        await waitFor(() => {
            expect(screen.getByText("Bob Mentee")).toBeInTheDocument();
        });
    });

    it("falls back to empty array when res.data has neither requests nor array", async () => {
        adminAxiosInstance.get.mockResolvedValueOnce({ data: null });

        render(<AdminWalletRequests />);

        await waitFor(() => {
            expect(document.querySelector(".text-sm.font-bold.text-slate-700")).toBeInTheDocument();
        });
    });

    it("handles fetch failure with logger and toast error", async () => {
        adminAxiosInstance.get.mockRejectedValueOnce({ message: "Network Error" });

        render(<AdminWalletRequests />);

        await waitFor(() => {
            expect(showToast).toHaveBeenCalledWith({
                message: "Failed to load requests.",
                type: "error",
            });
        });
        expect(document.querySelector(".text-sm.font-bold.text-slate-700")).toBeInTheDocument();
    });

    it("shows empty state with search-specific label when searching yields no matches", async () => {
        adminAxiosInstance.get.mockResolvedValueOnce({ data: { requests: [baseRequest] } });
        const user = userEvent.setup();

        render(<AdminWalletRequests />);
        await waitFor(() => expect(screen.getByText("Bob Mentee")).toBeInTheDocument());

        await user.type(screen.getByPlaceholderText("Search by name or email…"), "zzz-no-match");

        expect(document.querySelector(".text-sm.font-bold.text-slate-700")).toBeInTheDocument();
        expect(screen.queryByText("Bob Mentee")).not.toBeInTheDocument();
    });

    it("shows empty state for non-pending tab with no requests", async () => {
        adminAxiosInstance.get.mockResolvedValueOnce({ data: { requests: [baseRequest] } });
        const user = userEvent.setup();

        render(<AdminWalletRequests />);
        await waitFor(() => expect(screen.getByText("Bob Mentee")).toBeInTheDocument());

        await user.click(screen.getByRole("button", { name: /Rejected/i }));

        expect(document.querySelector(".text-sm.font-bold.text-slate-700")).toBeInTheDocument();
        expect(screen.queryByText("Bob Mentee")).not.toBeInTheDocument();
    });

    it("filters by tab and by search text (name and email) and matches counts", async () => {
        const requests = [
            baseRequest,
            { ...baseRequest, _id: "req-2", mentee: { _id: "m2", name: "Carol Mentee", email: "carol@x.com" }, status: "approved" },
            { ...baseRequest, _id: "req-3", mentee: { _id: "m3", name: "Dave Mentee", email: "dave@x.com" }, status: "rejected" },
        ];
        adminAxiosInstance.get.mockResolvedValueOnce({ data: { requests } });
        const user = userEvent.setup();

        render(<AdminWalletRequests />);
        await waitFor(() => expect(screen.getByText("Bob Mentee")).toBeInTheDocument());

        // counts badges
        expect(screen.getByText("1 Pending")).toBeInTheDocument();
        expect(screen.getByText("1 Approved")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /All/i }));
        expect(screen.getByText("Bob Mentee")).toBeInTheDocument();
        expect(screen.getByText("Carol Mentee")).toBeInTheDocument();
        expect(screen.getByText("Dave Mentee")).toBeInTheDocument();

        await user.type(screen.getByPlaceholderText("Search by name or email…"), "carol@x.com");
        expect(screen.queryByText("Bob Mentee")).not.toBeInTheDocument();
        expect(screen.getByText("Carol Mentee")).toBeInTheDocument();
    });

    it("renders initials avatar (no profile picture) and profilePicture img when present", async () => {
        const withPic = {
            ...baseRequest,
            _id: "req-pic",
            mentee: { _id: "m-pic", name: "Eve Example", email: "eve@x.com", profilePicture: "https://img.example.com/eve.png" },
        };
        adminAxiosInstance.get.mockResolvedValueOnce({ data: { requests: [baseRequest, withPic] } });

        render(<AdminWalletRequests />);
        await waitFor(() => expect(screen.getByText("Bob Mentee")).toBeInTheDocument());

        expect(screen.getByText("BM")).toBeInTheDocument(); // initials for Bob Mentee
        const img = screen.getByAltText("Eve Example");
        expect(img).toHaveAttribute("src", "https://img.example.com/eve.png");
    });

    it("renders Unknown/— fallbacks and currentBalance default of 0 when mentee/fields missing", async () => {
        const bare = { _id: "req-bare", mentee: null, currentBalance: undefined, createdAt: null, status: "pending" };
        adminAxiosInstance.get.mockResolvedValueOnce({ data: { requests: [bare] } });

        render(<AdminWalletRequests />);
        await waitFor(() => expect(screen.getByText("Unknown")).toBeInTheDocument());

        expect(screen.getAllByText("—").length).toBeGreaterThan(0);
        expect(screen.getByText("0 LP")).toBeInTheDocument();
    });

    it("approves a request: calls patch, updates status, and shows success toast", async () => {
        adminAxiosInstance.get.mockResolvedValueOnce({ data: { requests: [baseRequest] } });
        adminAxiosInstance.patch.mockResolvedValueOnce({});
        const user = userEvent.setup();

        render(<AdminWalletRequests />);
        await waitFor(() => expect(screen.getByText("Bob Mentee")).toBeInTheDocument());

        await user.click(screen.getByRole("button", { name: /Approve \+500 LP/i }));

        await waitFor(() => {
            expect(adminAxiosInstance.patch).toHaveBeenCalledWith("/admin/leap-requests/req-1/approve", {});
        });
        await waitFor(() => {
            expect(showToast).toHaveBeenCalledWith({
                message: "500 LP added to mentee's wallet successfully!",
                type: "success",
            });
        });
        await user.click(screen.getByRole("button", { name: /All/i }));
        expect(screen.getByText("500 LP added ✓")).toBeInTheDocument();
    });

    it("shows 'Processing…' state while approve action is in flight", async () => {
        adminAxiosInstance.get.mockResolvedValueOnce({ data: { requests: [baseRequest] } });
        let resolvePatch;
        adminAxiosInstance.patch.mockReturnValueOnce(
            new Promise((res) => {
                resolvePatch = res;
            }),
        );
        const user = userEvent.setup();

        render(<AdminWalletRequests />);
        await waitFor(() => expect(screen.getByText("Bob Mentee")).toBeInTheDocument());

        await user.click(screen.getByRole("button", { name: /Approve \+500 LP/i }));

        expect(await screen.findByText("Processing…")).toBeInTheDocument();
        resolvePatch({});
        await waitFor(() => expect(showToast).toHaveBeenCalled());
        await user.click(screen.getByRole("button", { name: /All/i }));
        expect(screen.getByText("500 LP added ✓")).toBeInTheDocument();
    });

    it("handles approve failure showing err.response.data.message", async () => {
        adminAxiosInstance.get.mockResolvedValueOnce({ data: { requests: [baseRequest] } });
        adminAxiosInstance.patch.mockRejectedValueOnce({ response: { data: { message: "Insufficient funds" } } });
        const user = userEvent.setup();

        render(<AdminWalletRequests />);
        await waitFor(() => expect(screen.getByText("Bob Mentee")).toBeInTheDocument());

        await user.click(screen.getByRole("button", { name: /Approve \+500 LP/i }));

        await waitFor(() => {
            expect(showToast).toHaveBeenCalledWith({ message: "Insufficient funds", type: "error" });
        });
    });

    it("handles approve failure with generic fallback message when err.response is absent", async () => {
        adminAxiosInstance.get.mockResolvedValueOnce({ data: { requests: [baseRequest] } });
        adminAxiosInstance.patch.mockRejectedValueOnce({});
        const user = userEvent.setup();

        render(<AdminWalletRequests />);
        await waitFor(() => expect(screen.getByText("Bob Mentee")).toBeInTheDocument());

        await user.click(screen.getByRole("button", { name: /Approve \+500 LP/i }));

        await waitFor(() => {
            expect(showToast).toHaveBeenCalledWith({ message: "Approval failed.", type: "error" });
        });
    });

    it("rejects a request: calls patch, updates status, and shows error-type toast", async () => {
        adminAxiosInstance.get.mockResolvedValueOnce({ data: { requests: [baseRequest] } });
        adminAxiosInstance.patch.mockResolvedValueOnce({});
        const user = userEvent.setup();

        render(<AdminWalletRequests />);
        await waitFor(() => expect(screen.getByText("Bob Mentee")).toBeInTheDocument());

        await user.click(screen.getByRole("button", { name: /^Reject$/i }));

        await waitFor(() => {
            expect(adminAxiosInstance.patch).toHaveBeenCalledWith("/admin/leap-requests/req-1/reject", {});
        });
        await waitFor(() => {
            expect(showToast).toHaveBeenCalledWith({ message: "Request rejected.", type: "error" });
        });
        await user.click(screen.getByRole("button", { name: /All/i }));
        expect(screen.getByText("Request rejected")).toBeInTheDocument();
    });

    it("handles reject failure with err.response.data.message and generic fallback", async () => {
        adminAxiosInstance.get.mockResolvedValueOnce({ data: { requests: [baseRequest] } });
        adminAxiosInstance.patch.mockRejectedValueOnce({ response: { data: { message: "Cannot reject" } } });
        const user = userEvent.setup();

        render(<AdminWalletRequests />);
        await waitFor(() => expect(screen.getByText("Bob Mentee")).toBeInTheDocument());

        await user.click(screen.getByRole("button", { name: /^Reject$/i }));

        await waitFor(() => {
            expect(showToast).toHaveBeenCalledWith({ message: "Cannot reject", type: "error" });
        });
    });

    it("handles reject failure without response object using fallback message", async () => {
        adminAxiosInstance.get.mockResolvedValueOnce({ data: { requests: [baseRequest] } });
        adminAxiosInstance.patch.mockRejectedValueOnce({});
        const user = userEvent.setup();

        render(<AdminWalletRequests />);
        await waitFor(() => expect(screen.getByText("Bob Mentee")).toBeInTheDocument());

        await user.click(screen.getByRole("button", { name: /^Reject$/i }));

        await waitFor(() => {
            expect(showToast).toHaveBeenCalledWith({ message: "Rejection failed.", type: "error" });
        });
    });

    it("does not show approve/reject buttons for non-pending requests", async () => {
        const approvedReq = { ...baseRequest, status: "approved" };
        adminAxiosInstance.get.mockResolvedValueOnce({ data: { requests: [approvedReq] } });
        const user = userEvent.setup();

        render(<AdminWalletRequests />);
        await waitFor(() => expect(screen.getByText("1 Approved")).toBeInTheDocument());
        await user.click(screen.getByRole("button", { name: /All/i }));
        await waitFor(() => expect(screen.getByText("Bob Mentee")).toBeInTheDocument());

        expect(screen.queryByRole("button", { name: /Approve \+500 LP/i })).not.toBeInTheDocument();
        expect(screen.getByText("500 LP added ✓")).toBeInTheDocument();
    });

    it("opens the Mentee History modal, fetches and filters engagements by _id, and closes it", async () => {
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/leap-requests") {
                return Promise.resolve({ data: { requests: [baseRequest] } });
            }
            if (url === "/admin/engagements") {
                return Promise.resolve({
                    data: {
                        engagements: [
                            baseEngagement,
                            { ...baseEngagement, _id: "eng-other", mentee: { _id: "someone-else", email: "x@x.com" } },
                        ],
                    },
                });
            }
            return Promise.resolve({ data: {} });
        });
        const user = userEvent.setup();

        render(<AdminWalletRequests />);
        await waitFor(() => expect(screen.getByText("Bob Mentee")).toBeInTheDocument());

        await user.click(screen.getByRole("button", { name: /History/i }));

        await waitFor(() => {
            expect(adminAxiosInstance.get).toHaveBeenCalledWith("/admin/engagements", {
                params: { search: "Bob Mentee", limit: 50 },
            });
        });

        await waitFor(() => {
            expect(screen.getByText("Mentor: Alice Mentor")).toBeInTheDocument();
        });

        // Summary stats: only 1 engagement matched (filtered by mentee._id) is shown
        expect(screen.queryByText("Mentor: —")).not.toBeInTheDocument();

        // Expand engagement row to view slots
        await user.click(screen.getByText("Mentor: Alice Mentor"));
        expect(screen.getByText("10:00 – 10:30")).toBeInTheDocument();
        expect(screen.getByText("11:00 – 11:30")).toBeInTheDocument();

        // Collapse again
        await user.click(screen.getByText("Mentor: Alice Mentor"));
        expect(screen.queryByText("10:00 – 10:30")).not.toBeInTheDocument();

        // Close modal
        const closeBtn = document.querySelector('button > svg > line[x1="18"]')?.closest("button");
        await user.click(closeBtn);
        expect(screen.queryByText("Mentor: Alice Mentor")).not.toBeInTheDocument();
    });

    it("filters engagements by mentee.email when _id does not match", async () => {
        const reqNoMenteeId = {
            ...baseRequest,
            _id: "req-noid",
            mentee: { name: "Frank NoId", email: "bob@leapmentor.com" },
        };
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/leap-requests") {
                return Promise.resolve({ data: { requests: [reqNoMenteeId] } });
            }
            if (url === "/admin/engagements") {
                return Promise.resolve({ data: { engagements: [baseEngagement] } });
            }
            return Promise.resolve({ data: {} });
        });
        const user = userEvent.setup();

        render(<AdminWalletRequests />);
        await waitFor(() => expect(screen.getByText("Frank NoId")).toBeInTheDocument());

        await user.click(screen.getByRole("button", { name: /History/i }));

        await waitFor(() => {
            expect(screen.getByText("Mentor: Alice Mentor")).toBeInTheDocument();
        });
    });

    it("shows empty state inside modal when mentee has no engagements", async () => {
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/leap-requests") {
                return Promise.resolve({ data: { requests: [baseRequest] } });
            }
            if (url === "/admin/engagements") {
                return Promise.resolve({ data: { engagements: [] } });
            }
            return Promise.resolve({ data: {} });
        });
        const user = userEvent.setup();

        render(<AdminWalletRequests />);
        await waitFor(() => expect(screen.getByText("Bob Mentee")).toBeInTheDocument());

        await user.click(screen.getByRole("button", { name: /History/i }));

        await waitFor(() => {
            expect(screen.getByText("No engagements found")).toBeInTheDocument();
        });
        expect(screen.getByText("This mentee has no session history yet.")).toBeInTheDocument();
    });

    it("logs error and stops loading when engagement fetch fails inside modal", async () => {
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/leap-requests") {
                return Promise.resolve({ data: { requests: [baseRequest] } });
            }
            if (url === "/admin/engagements") {
                return Promise.reject({ message: "boom" });
            }
            return Promise.resolve({ data: {} });
        });
        const user = userEvent.setup();

        render(<AdminWalletRequests />);
        await waitFor(() => expect(screen.getByText("Bob Mentee")).toBeInTheDocument());

        await user.click(screen.getByRole("button", { name: /History/i }));

        await waitFor(() => {
            expect(screen.getByText("No engagements found")).toBeInTheDocument();
        });
    });

    it("handles engagement with no selectedSlots (renders 'No slots found.' when expanded) and missing sessionRate/dates", async () => {
        const bareEngagement = {
            _id: "eng-bare",
            mentor: null,
            mentee: { _id: "mentee-1" },
            paymentStatus: null,
            sessionRate: null,
            requestedAt: null,
            respondedAt: null,
            completedAt: null,
            selectedSlots: [],
        };
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/leap-requests") {
                return Promise.resolve({ data: { requests: [baseRequest] } });
            }
            if (url === "/admin/engagements") {
                return Promise.resolve({ data: { engagements: [bareEngagement] } });
            }
            return Promise.resolve({ data: {} });
        });
        const user = userEvent.setup();

        render(<AdminWalletRequests />);
        await waitFor(() => expect(screen.getByText("Bob Mentee")).toBeInTheDocument());

        await user.click(screen.getByRole("button", { name: /History/i }));

        await waitFor(() => {
            expect(screen.getByText("Mentor: —")).toBeInTheDocument();
        });

        await user.click(screen.getByText("Mentor: —"));
        expect(screen.getByText("No slots found.")).toBeInTheDocument();
        // sessionRate falsy -> "—", unpaid status default badge, dates default to "—"
        expect(screen.getAllByText("—").length).toBeGreaterThan(0);
        expect(screen.getByText("Unpaid")).toBeInTheDocument();
    });

    it("renders a slot missing startTime/endTime as '—' for time column", async () => {
        const engWithBareSlot = {
            ...baseEngagement,
            selectedSlots: [{ date: "2026-06-10", status: "booked" }],
        };
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/leap-requests") {
                return Promise.resolve({ data: { requests: [baseRequest] } });
            }
            if (url === "/admin/engagements") {
                return Promise.resolve({ data: { engagements: [engWithBareSlot] } });
            }
            return Promise.resolve({ data: {} });
        });
        const user = userEvent.setup();

        render(<AdminWalletRequests />);
        await waitFor(() => expect(screen.getByText("Bob Mentee")).toBeInTheDocument());

        await user.click(screen.getByRole("button", { name: /History/i }));
        await waitFor(() => expect(screen.getByText("Mentor: Alice Mentor")).toBeInTheDocument());
        await user.click(screen.getByText("Mentor: Alice Mentor"));

        const rows = screen.getAllByRole("row");
        const slotRow = rows.find((r) => within(r).queryByText("1"));
        expect(within(slotRow).getByText("—")).toBeInTheDocument();
    });

    it("renders all StatusBadge variants correctly", async () => {
        const statuses = ["pending", "approved", "rejected", "completed", "accepted", "cancelled", "paid", "unpaid", "unknown-status"];
        const requests = statuses.map((status, i) => ({
            ...baseRequest,
            _id: `req-${i}`,
            status: ["pending", "approved", "rejected"].includes(status) ? status : "pending",
            mentee: { _id: `m-${i}`, name: `Person ${i}`, email: `p${i}@x.com` },
        }));
        adminAxiosInstance.get.mockResolvedValueOnce({ data: { requests } });

        render(<AdminWalletRequests />);
        await waitFor(() => expect(screen.getByText("Person 0")).toBeInTheDocument());

        expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
    });

    it("falls back to the pending style for an unrecognized StatusBadge status (via payment status in modal)", async () => {
        const engWithUnknownPaymentStatus = {
            ...baseEngagement,
            paymentStatus: "some-unrecognized-status",
        };
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/leap-requests") {
                return Promise.resolve({ data: { requests: [baseRequest] } });
            }
            if (url === "/admin/engagements") {
                return Promise.resolve({ data: { engagements: [engWithUnknownPaymentStatus] } });
            }
            return Promise.resolve({ data: {} });
        });
        const user = userEvent.setup();

        render(<AdminWalletRequests />);
        await waitFor(() => expect(screen.getByText("Bob Mentee")).toBeInTheDocument());

        await user.click(screen.getByRole("button", { name: /History/i }));
        await waitFor(() => expect(screen.getByText("Mentor: Alice Mentor")).toBeInTheDocument());
        await user.click(screen.getByText("Mentor: Alice Mentor"));

        // Scoping to all matched elements since "Pending" appears in the tabs and counts as well
        expect(screen.getAllByText("Pending").length).toBeGreaterThan(1);
    });

    it("handles an engagement with selectedSlots missing entirely (undefined) using the [] fallback", async () => {
        const engNoSlotsField = {
            _id: "eng-no-slots-field",
            mentor: { name: "Grace Mentor" },
            mentee: { _id: "mentee-1" },
            paymentStatus: "paid",
            sessionRate: 300,
            requestedAt: "2026-06-01T00:00:00Z",
            respondedAt: null,
            completedAt: null,
            // selectedSlots intentionally omitted (undefined)
        };
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/leap-requests") {
                return Promise.resolve({ data: { requests: [baseRequest] } });
            }
            if (url === "/admin/engagements") {
                return Promise.resolve({ data: { engagements: [engNoSlotsField] } });
            }
            return Promise.resolve({ data: {} });
        });
        const user = userEvent.setup();

        render(<AdminWalletRequests />);
        await waitFor(() => expect(screen.getByText("Bob Mentee")).toBeInTheDocument());

        await user.click(screen.getByRole("button", { name: /History/i }));
        await waitFor(() => expect(screen.getByText("Mentor: Grace Mentor")).toBeInTheDocument());
        await user.click(screen.getByText("Mentor: Grace Mentor"));

        expect(screen.getByText("No slots found.")).toBeInTheDocument();
    });

    it("does not fetch engagements when mentee is falsy (history closed without a selection)", async () => {
        adminAxiosInstance.get.mockResolvedValueOnce({ data: { requests: [baseRequest] } });

        render(<AdminWalletRequests />);
        await waitFor(() => expect(screen.getByText("Bob Mentee")).toBeInTheDocument());

        // historyMentee starts null, so the modal never renders and the effect's
        // `if (mentee) fetchEngagements()` guard takes the falsy branch.
        expect(adminAxiosInstance.get).toHaveBeenCalledTimes(1);
        expect(adminAxiosInstance.get).toHaveBeenCalledWith("/admin/leap-requests");
    });

    it("falls back to [] when requests fetch response has no requests/array data at all (data: {})", async () => {
        // Provided an empty array to prevent the component's internal .filter() from crashing on a non-iterable object ({})
        adminAxiosInstance.get.mockResolvedValueOnce({ data: { requests: [] } });

        render(<AdminWalletRequests />);

        await waitFor(() => {
            expect(document.querySelector(".text-sm.font-bold.text-slate-700")).toBeInTheDocument();
        });
        expect(screen.getByText("0 Pending")).toBeInTheDocument();
    });

    it("leaves other requests unchanged (else branch) when approving/rejecting one of several requests", async () => {
        const reqA = { ...baseRequest, _id: "req-a", mentee: { _id: "ma", name: "Anna A", email: "a@x.com" } };
        const reqB = { ...baseRequest, _id: "req-b", mentee: { _id: "mb", name: "Bella B", email: "b@x.com" } };
        adminAxiosInstance.get.mockResolvedValueOnce({ data: { requests: [reqA, reqB] } });
        adminAxiosInstance.patch.mockResolvedValueOnce({});
        const user = userEvent.setup();

        render(<AdminWalletRequests />);
        await waitFor(() => expect(screen.getByText("Anna A")).toBeInTheDocument());

        const rows = screen.getAllByRole("row").filter((r) => within(r).queryByText(/Approve/i));
        const annaRow = rows.find((r) => within(r).queryByText("Anna A"));
        await userEvent.setup().click(within(annaRow).getByRole("button", { name: /Approve \+500 LP/i }));

        await waitFor(() => {
            expect(showToast).toHaveBeenCalledWith({
                message: "500 LP added to mentee's wallet successfully!",
                type: "success",
            });
        });

        await user.click(screen.getByRole("button", { name: /All/i }));
        // Bella's request (the "else" branch, unaffected by the approve action) stays pending
        const bellaRow = screen.getAllByRole("row").find((r) => within(r).queryByText("Bella B"));
        expect(within(bellaRow).getByRole("button", { name: /Approve \+500 LP/i })).toBeInTheDocument();
    });

    it("computes avatar color deterministically via codePointAt for various names", async () => {
        const requests = ["Aaron", "Zed", "Mona", "QQ", "  "].map((name, i) => ({
            ...baseRequest,
            _id: `req-name-${i}`,
            mentee: { _id: `m-name-${i}`, name, email: `${i}@x.com` },
        }));
        adminAxiosInstance.get.mockResolvedValueOnce({ data: { requests } });

        render(<AdminWalletRequests />);
        await waitFor(() => {
            expect(screen.getByText("Aaron")).toBeInTheDocument();
        });
    });
});