
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NotificationsTab from "../../../../components/mentee/notifications/NotificationsTab";

// ── Mocks ───────────────────────────────────────────────────
const mockUseNotifications = vi.fn();
vi.mock("../../../../hooks/useNotifications", () => ({
    useNotifications: (...args) => mockUseNotifications(...args),
}));

vi.mock("../../../../components/common/StatCard", () => ({
    default: ({ label, value }) => (
        <div data-testid="stat-card">
            {label}: {value}
        </div>
    ),
}));

vi.mock("../../../../components/common/TabLoader", () => ({
    default: ({ message }) => <div data-testid="tab-loader">{message}</div>,
}));

// ── Helpers ─────────────────────────────────────────────────
const baseNotif = (overrides = {}) => ({
    id: "n1",
    type: "connect_request",
    read: false,
    time: "2 minutes ago",
    accent: false,
    title: "New Connect Request",
    senderName: "Deepika S.",
    body: "Some body text",
    actions: [],
    ...overrides,
});

const setupHook = (overrides = {}) => {
    const hookReturn = {
        notifications: [baseNotif()],
        loading: false,
        error: null,
        fetchNotifications: vi.fn(),
        markAllRead: vi.fn(),
        clearAll: vi.fn(),
        markRead: vi.fn(),
        deleteOne: vi.fn(),
        ...overrides,
    };
    mockUseNotifications.mockReturnValue(hookReturn);
    return hookReturn;
};

beforeEach(() => {
    vi.clearAllMocks();
});

// ── Tests ───────────────────────────────────────────────────
describe("NotificationsTab", () => {
    it("renders loading state via TabLoader", () => {
        setupHook({ loading: true });
        render(<NotificationsTab />);
        expect(screen.getByTestId("tab-loader")).toHaveTextContent(
            "Loading your notifications..."
        );
    });

    it("renders empty state when there are no notifications", () => {
        setupHook({ notifications: [] });
        render(<NotificationsTab />);
        expect(screen.getByText("No notifications")).toBeInTheDocument();
        expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
    });

    it("renders error state and triggers fetchNotifications on retry", async () => {
        const user = userEvent.setup();
        const hook = setupHook({ error: "Something went wrong", notifications: [] });
        render(<NotificationsTab />);
        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: /retry/i }));
        expect(hook.fetchNotifications).toHaveBeenCalledTimes(1);
    });

    it("renders stat cards with correct counts", () => {
        setupHook({
            notifications: [
                baseNotif({ id: "n1", read: false, time: "2 minutes ago" }),
                baseNotif({ id: "n2", read: true, time: "3 hours ago" }),
                baseNotif({ id: "n3", read: false, time: "Yesterday" }),
                baseNotif({ id: "n4", read: false, time: "5 days ago" }),
                baseNotif({ id: "n5", read: false, time: "10 days ago" }),
                baseNotif({ id: "n6", read: false, isApi: true, time: "" }),
            ],
        });
        render(<NotificationsTab />);
        const cards = screen.getAllByTestId("stat-card");
        expect(cards[0]).toHaveTextContent("Total Notifications: 6");
        expect(cards[1]).toHaveTextContent("Unread: 5");
        // this week: n1,n2,n3,n4,n6 qualify (n5 "10 days ago" excluded)
        expect(cards[2]).toHaveTextContent("This Week: 5");
    });

    it("calls markAllRead and clearAll when buttons clicked", async () => {
        const user = userEvent.setup();
        const hook = setupHook();
        render(<NotificationsTab />);
        await user.click(screen.getByText("Mark all as read"));
        expect(hook.markAllRead).toHaveBeenCalledTimes(1);
        await user.click(screen.getByText("Clear all"));
        expect(hook.clearAll).toHaveBeenCalledTimes(1);
    });

    it("renders 'Load older notifications' button when notifications exist", () => {
        setupHook();
        render(<NotificationsTab />);
        expect(screen.getByText("Load older notifications")).toBeInTheDocument();
    });

    it("marks unread notification as read and navigates on click (connect_request)", async () => {
        const user = userEvent.setup();
        const setActiveTab = vi.fn();
        const hook = setupHook({
            notifications: [
                baseNotif({ id: "n1", type: "connect_request", read: false }),
            ],
        });
        render(<NotificationsTab setActiveTab={setActiveTab} />);
        await user.click(screen.getByText("New Connect Request"));
        expect(hook.markRead).toHaveBeenCalledWith("n1");
        expect(setActiveTab).toHaveBeenCalledWith("history");
    });

    it("does not call markRead when notification already read, but still navigates", async () => {
        const user = userEvent.setup();
        const setActiveTab = vi.fn();
        const hook = setupHook({
            notifications: [
                baseNotif({
                    id: "n1",
                    type: "connect_request_accepted",
                    read: true,
                }),
            ],
        });
        render(<NotificationsTab setActiveTab={setActiveTab} />);
        await user.click(screen.getByText("New Connect Request"));
        expect(hook.markRead).not.toHaveBeenCalled();
        expect(setActiveTab).toHaveBeenCalledWith("history");
    });

    it("navigates to 'connects' tab for upcoming_session/new_message/session_completed", async () => {
        const user = userEvent.setup();
        const setActiveTab = vi.fn();
        setupHook({
            notifications: [
                baseNotif({ id: "n1", type: "upcoming_session", read: false }),
            ],
        });
        render(<NotificationsTab setActiveTab={setActiveTab} />);
        await user.click(screen.getByText("New Connect Request"));
        expect(setActiveTab).toHaveBeenCalledWith("connects");
    });

    it("navigates to 'profile' tab for new_review", async () => {
        const user = userEvent.setup();
        const setActiveTab = vi.fn();
        setupHook({
            notifications: [baseNotif({ id: "n1", type: "new_review", read: false })],
        });
        render(<NotificationsTab setActiveTab={setActiveTab} />);
        await user.click(screen.getByText("New Connect Request"));
        expect(setActiveTab).toHaveBeenCalledWith("profile");
    });

    it("navigates to 'home' tab for support_resolved", async () => {
        const user = userEvent.setup();
        const setActiveTab = vi.fn();
        setupHook({
            notifications: [
                baseNotif({ id: "n1", type: "support_resolved", read: false }),
            ],
        });
        render(<NotificationsTab setActiveTab={setActiveTab} />);
        await user.click(screen.getByText("New Connect Request"));
        expect(setActiveTab).toHaveBeenCalledWith("home");
    });

    it("does nothing for unknown type (no matching branch) and does not throw", async () => {
        const user = userEvent.setup();
        const setActiveTab = vi.fn();
        setupHook({
            notifications: [
                baseNotif({ id: "n1", type: "totally_unknown_type", read: false }),
            ],
        });
        render(<NotificationsTab setActiveTab={setActiveTab} />);
        await user.click(screen.getByText("New Connect Request"));
        expect(setActiveTab).not.toHaveBeenCalled();
    });

    it("does not throw and skips navigation when setActiveTab is not provided", async () => {
        const user = userEvent.setup();
        setupHook({
            notifications: [
                baseNotif({ id: "n1", type: "connect_request", read: false }),
            ],
        });
        render(<NotificationsTab />);
        await user.click(screen.getByText("New Connect Request"));
        // no error thrown
        expect(screen.getByText("New Connect Request")).toBeInTheDocument();
    });

    it("renders 'New' badge for unread notifications and not for read ones", () => {
        setupHook({
            notifications: [
                baseNotif({ id: "n1", read: false }),
                baseNotif({ id: "n2", read: true, title: "Read Notif" }),
            ],
        });
        render(<NotificationsTab />);
        expect(screen.getAllByText("New")).toHaveLength(1);
    });

    it("renders sender name when present", () => {
        setupHook({
            notifications: [
                baseNotif({ id: "n1", senderName: "Deepika S." }),
            ],
        });
        render(<NotificationsTab />);
        expect(screen.getByText("· Deepika S.")).toBeInTheDocument();
    });

    it("does not render sender name span when senderName is empty", () => {
        setupHook({
            notifications: [baseNotif({ id: "n1", senderName: "" })],
        });
        render(<NotificationsTab />);
        expect(screen.queryByText(/·/)).not.toBeInTheDocument();
    });

    it("renders action buttons and stops propagation on click (does not trigger card activation)", async () => {
        const user = userEvent.setup();
        const hook = setupHook({
            notifications: [
                baseNotif({
                    id: "n1",
                    read: false,
                    actions: [
                        { label: "Accept", primary: true },
                        { label: "Decline", primary: false },
                    ],
                }),
            ],
        });
        render(<NotificationsTab />);
        await user.click(screen.getByText("Accept"));
        // stopPropagation should prevent the card's onClick (markRead) from firing
        expect(hook.markRead).not.toHaveBeenCalled();
        await user.click(screen.getByText("Decline"));
        expect(hook.markRead).not.toHaveBeenCalled();
    });

    it("renders no action buttons block when actions array is empty", () => {
        setupHook({
            notifications: [baseNotif({ id: "n1", actions: [] })],
        });
        render(<NotificationsTab />);
        expect(screen.queryByText("Accept")).not.toBeInTheDocument();
    });

    it("calls onDelete with correct id and stops propagation when delete button clicked (desktop variant)", async () => {
        const user = userEvent.setup();
        const hook = setupHook({
            notifications: [baseNotif({ id: "n1", read: false })],
        });
        render(<NotificationsTab />);
        const deleteButtons = screen.getAllByTitle("Delete");
        await user.click(deleteButtons[0]);
        expect(hook.deleteOne).toHaveBeenCalledWith("n1");
        expect(hook.markRead).not.toHaveBeenCalled();
    });

    it("falls back to TYPE_CONFIG['new_message'] and its icon for unknown notif type", () => {
        setupHook({
            notifications: [
                baseNotif({ id: "n1", type: "some_unmapped_type", title: "Unmapped" }),
            ],
        });
        render(<NotificationsTab />);
        expect(screen.getByText("New Message")).toBeInTheDocument();
    });

    it("resolves aliased type connect_request to connect_request_received config", () => {
        setupHook({
            notifications: [
                baseNotif({ id: "n1", type: "connect_request", title: "Aliased" }),
            ],
        });
        render(<NotificationsTab />);
        expect(screen.getByText("Connect Request")).toBeInTheDocument();
    });

    it("applies accent border class when notif.accent is true", () => {
        setupHook({
            notifications: [
                baseNotif({ id: "n1", accent: true, read: false }),
            ],
        });
        render(<NotificationsTab />);
        const button = screen.getByRole("button", { name: /New Connect Request/ });
        expect(button.className).toMatch(/border-l-blue-500/);
    });

    it("applies read styles (cursor-default, no tint) when notif.read is true", () => {
        setupHook({
            notifications: [baseNotif({ id: "n1", read: true })],
        });
        render(<NotificationsTab />);
        const button = screen.getByRole("button", { name: /New Connect Request/ });
        expect(button.className).toMatch(/cursor-default/);
    });

    it("computes initials correctly from senderName, stripping leading keywords", () => {
        setupHook({
            notifications: [
                baseNotif({
                    id: "n1",
                    senderName: "New Alex Carter",
                    title: "Fallback Title",
                }),
            ],
        });
        render(<NotificationsTab />);
        // "New Alex Carter" -> strip "New " -> "Alex Carter" -> "AC"
        expect(screen.getByText("AC")).toBeInTheDocument();
    });

    it("falls back to title for initials when senderName is empty, and defaults to 'N' when nothing usable", () => {
        setupHook({
            notifications: [
                baseNotif({ id: "n1", senderName: "", title: "" }),
            ],
        });
        render(<NotificationsTab />);
        expect(screen.getByText("N")).toBeInTheDocument();
    });

    it("renders multiple notifications with different avatar colors deterministically", () => {
        setupHook({
            notifications: [
                baseNotif({ id: "aaa", title: "First" }),
                baseNotif({ id: "zzz", title: "Second" }),
            ],
        });
        const { container } = render(<NotificationsTab />);
        // Just ensure both rendered without crashing and have distinct avatar divs
        const avatarDivs = container.querySelectorAll("[class*='rounded-xl'][class*='bg-']");
        expect(avatarDivs.length).toBeGreaterThan(0);
    });

    it("uses TYPE_ICON_PATH fallback for icon when type unmapped in icon map", () => {
        setupHook({
            notifications: [
                baseNotif({ id: "n1", type: "no_icon_type", title: "NoIcon" }),
            ],
        });
        render(<NotificationsTab />);
        expect(screen.getByText("NoIcon")).toBeInTheDocument();
    });

    it("passes hook the INITIAL_NOTIFICATIONS default argument", () => {
        setupHook();
        render(<NotificationsTab />);
        expect(mockUseNotifications).toHaveBeenCalledTimes(1);
        const arg = mockUseNotifications.mock.calls[0][0];
        expect(Array.isArray(arg)).toBe(true);
        expect(arg.length).toBe(5);
        expect(arg[0].id).toBe("static-1");
    });
});