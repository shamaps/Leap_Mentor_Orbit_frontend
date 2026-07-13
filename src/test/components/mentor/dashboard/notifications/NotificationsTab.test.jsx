import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import NotificationsTab from "../../../../../components/mentor/dashboard/notifications/NotificationsTab";
import { useNotifications } from "../../../../../hooks/useNotifications";

vi.mock("../../../../../hooks/useNotifications", () => ({
    useNotifications: vi.fn(),
}));

vi.mock("@/components/common/StatCard", () => ({
    default: ({ label, value }) => (
        <div data-testid={`stat-${label.replace(/\s+/g, "-").toLowerCase()}`}>
            <h3>{label}</h3>
            <span>{value}</span>
        </div>
    ),
}));

vi.mock("../../../../../components/common/ErrorState", () => ({
    default: ({ message, onAction }) => (
        <div data-testid="mock-error-state">
            <span>{message}</span>
            <button onClick={onAction}>Retry Fetch</button>
        </div>
    ),
}));

vi.mock("@/components/common/TabLoader", () => ({
    default: ({ message }) => <div data-testid="mock-loader">{message}</div>,
}));

describe("NotificationsTab additional coverage", () => {
    const mockFetchNotifications = vi.fn();
    const mockMarkAllRead = vi.fn();
    const mockClearAll = vi.fn();
    const mockMarkRead = vi.fn();
    const mockDeleteOne = vi.fn();
    const mockSetActiveTab = vi.fn();

    const baseHookValue = {
        notifications: [],
        loading: false,
        error: null,
        fetchNotifications: mockFetchNotifications,
        markAllRead: mockMarkAllRead,
        clearAll: mockClearAll,
        markRead: mockMarkRead,
        deleteOne: mockDeleteOne,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.setSystemTime(new Date("2026-07-12T12:00:00.000Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("should not call markRead when clicking an already-read notification", () => {
        useNotifications.mockReturnValue({
            ...baseHookValue,
            notifications: [
                { id: "r1", type: "new_message", read: true, time: "3 days ago", title: "Read Item", senderName: "Bob", body: "body", actions: [] },
            ],
        });
        render(<NotificationsTab setActiveTab={mockSetActiveTab} />);

        fireEvent.click(screen.getByRole("button", { name: /Read Item/i }));
        expect(mockMarkRead).not.toHaveBeenCalled();
    });

    it("should not throw and should no-op navigation when setActiveTab is not passed", () => {
        useNotifications.mockReturnValue({
            ...baseHookValue,
            notifications: [
                { id: "n1", type: "connect_request", read: false, time: "2 minutes ago", title: "New Request", senderName: "Deepika", body: "body", actions: [] },
            ],
        });
        render(<NotificationsTab />);

        expect(() =>
            fireEvent.click(screen.getByRole("button", { name: /New Request/i }))
        ).not.toThrow();
        expect(mockMarkRead).toHaveBeenCalledWith("n1");
    });

    it("should no-op navigation for an unrecognized notification type (default switch branch)", () => {
        useNotifications.mockReturnValue({
            ...baseHookValue,
            notifications: [
                { id: "u1", type: "totally_unknown_type", read: false, time: "5 minutes ago", title: "Mystery Item", senderName: "", body: "body", actions: [] },
            ],
        });
        render(<NotificationsTab setActiveTab={mockSetActiveTab} />);

        fireEvent.click(screen.getByRole("button", { name: /Mystery Item/i }));
        expect(mockSetActiveTab).not.toHaveBeenCalled();
    });

    it("should fall back to new_message config/icon for unrecognized types and fall back initials to 'N' for empty names", () => {
        useNotifications.mockReturnValue({
            ...baseHookValue,
            notifications: [
                { id: "u2", type: "totally_unknown_type", read: false, time: "5 minutes ago", title: "", senderName: "", body: "body", actions: [] },
            ],
        });
        render(<NotificationsTab setActiveTab={mockSetActiveTab} />);
        expect(screen.getByText("N")).toBeInTheDocument();
    });

    it("should strip New/Upcoming/Session prefixes when deriving initials", () => {
        useNotifications.mockReturnValue({
            ...baseHookValue,
            notifications: [
                { id: "s1", type: "upcoming_session", read: false, time: "10 minutes ago", title: "Upcoming Session", senderName: "Upcoming Session", body: "body", actions: [] },
            ],
        });
        render(<NotificationsTab setActiveTab={mockSetActiveTab} />);
        // "Upcoming Session" -> strips "Upcoming " prefix -> "Session" -> initials "S"
        expect(screen.getByText("S")).toBeInTheDocument();
    });
    it("should render multiple action buttons including non-primary style (Decline)", () => {
        useNotifications.mockReturnValue({
            ...baseHookValue,
            notifications: [
                {
                    id: "a1", type: "connect_request", read: false, time: "1 minute ago",
                    title: "New Request", senderName: "Dee", body: "body",
                    actions: [{ label: "Accept", primary: true }, { label: "Decline", primary: false }],
                },
            ],
        });
        render(<NotificationsTab setActiveTab={mockSetActiveTab} />);

        const declineBtn = screen.getByRole("button", { name: "Decline" });
        expect(declineBtn.className).toMatch(/border-slate-300/);
        fireEvent.click(declineBtn);
    });

    it("should render the accent left-border style when notif.accent is true", () => {
        useNotifications.mockReturnValue({
            ...baseHookValue,
            notifications: [
                { id: "acc1", type: "upcoming_session", read: false, time: "10 minutes ago", accent: true, title: "Upcoming Session", senderName: "Chris", body: "body", actions: [] },
            ],
        });
        render(<NotificationsTab setActiveTab={mockSetActiveTab} />);
        const card = screen.getByRole("button", { name: /Upcoming Session/i });
        expect(card.className).toMatch(/border-l-blue-500/);
    });

    it("should render the Load older notifications button when notifications exist", () => {
        useNotifications.mockReturnValue({
            ...baseHookValue,
            notifications: [
                { id: "l1", type: "new_message", read: true, time: "3 days ago", title: "Msg", senderName: "Bob", body: "body", actions: [] },
            ],
        });
        render(<NotificationsTab setActiveTab={mockSetActiveTab} />);
        expect(screen.getByRole("button", { name: /Load older notifications/i })).toBeInTheDocument();
    });

    it("should exclude non-recent items from thisWeekCount (older than 7 days, non-API)", () => {
        useNotifications.mockReturnValue({
            ...baseHookValue,
            notifications: [
                { id: "old1", type: "new_message", read: true, time: "10 days ago", title: "Old Msg", senderName: "Bob", body: "body", actions: [] },
            ],
        });
        render(<NotificationsTab setActiveTab={mockSetActiveTab} />);
        expect(screen.getByTestId("stat-this-week")).toHaveTextContent("0");
    });

    it("should normalize API notifications with missing senderName and metadata", () => {
        useNotifications.mockReturnValue({
            ...baseHookValue,
            notifications: [
                { id: "napi", _id: "napi", type: "new_message", read: false, createdAt: "2026-07-12T11:59:00.000Z", title: "No Sender", message: "msg", isApi: true },
            ],
        });
        render(<NotificationsTab setActiveTab={mockSetActiveTab} />);
        expect(screen.getByText("No Sender")).toBeInTheDocument();
    });
    it("should render the loading state via TabLoader", () => {
        useNotifications.mockReturnValue({ ...baseHookValue, loading: true });
        render(<NotificationsTab setActiveTab={mockSetActiveTab} />);
        expect(screen.getByTestId("mock-loader")).toHaveTextContent("Loading your notifications...");
    });

    it("should render the error state and trigger retry", () => {
        useNotifications.mockReturnValue({ ...baseHookValue, error: "Failed to load" });
        render(<NotificationsTab setActiveTab={mockSetActiveTab} />);
        expect(screen.getByTestId("mock-error-state")).toHaveTextContent("Failed to load");
        fireEvent.click(screen.getByRole("button", { name: /Retry Fetch/i }));
        expect(mockFetchNotifications).toHaveBeenCalled();
    });

    it("should render the empty state when there are no notifications", () => {
        useNotifications.mockReturnValue({ ...baseHookValue, notifications: [] });
        render(<NotificationsTab setActiveTab={mockSetActiveTab} />);
        expect(screen.getByText("No notifications")).toBeInTheDocument();
        expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /Load older notifications/i })).not.toBeInTheDocument();
    });

    it("should call markAllRead and clearAll from header controls", () => {
        useNotifications.mockReturnValue({
            ...baseHookValue,
            notifications: [
                { id: "h1", type: "new_message", read: false, time: "1 minute ago", title: "Msg", senderName: "Bob", body: "body", actions: [] },
            ],
        });
        render(<NotificationsTab setActiveTab={mockSetActiveTab} />);

        fireEvent.click(screen.getByRole("button", { name: /Mark all as read/i }));
        expect(mockMarkAllRead).toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", { name: /Clear all/i }));
        expect(mockClearAll).toHaveBeenCalled();
    });
    it("should not act on irrelevant keydowns", () => {
        useNotifications.mockReturnValue({
            ...baseHookValue,
            notifications: [
                { id: "k1", type: "new_message", read: false, time: "1 minute ago", title: "Key Item", senderName: "Bob", body: "body", actions: [] },
            ],
        });
        render(<NotificationsTab setActiveTab={mockSetActiveTab} />);
        const card = screen.getByRole("button", { name: /Key Item/i });
        fireEvent.keyDown(card, { key: "Tab" });
        expect(mockMarkRead).not.toHaveBeenCalled();
        expect(mockSetActiveTab).not.toHaveBeenCalled();
    });

    it("should trigger markRead and navigation on Enter key", () => {
        useNotifications.mockReturnValue({
            ...baseHookValue,
            notifications: [
                { id: "k2", type: "new_message", read: false, time: "1 minute ago", title: "Enter Item", senderName: "Bob", body: "body", actions: [] },
            ],
        });
        render(<NotificationsTab setActiveTab={mockSetActiveTab} />);
        const card = screen.getByRole("button", { name: /Enter Item/i });
        fireEvent.keyDown(card, { key: "Enter" });
        expect(mockMarkRead).toHaveBeenCalledWith("k2");
    });

    it("should render a notification without a senderName (no dot-separated sender span)", () => {
        useNotifications.mockReturnValue({
            ...baseHookValue,
            notifications: [
                { id: "ns1", type: "new_message", read: false, time: "1 minute ago", title: "No Sender Item", senderName: "", body: "body", actions: [] },
            ],
        });
        render(<NotificationsTab setActiveTab={mockSetActiveTab} />);
        expect(screen.getByText("No Sender Item")).toBeInTheDocument();
        expect(screen.queryByText(/·/)).not.toBeInTheDocument();
    });
    it("should trigger delete via the mobile-only delete button (sm:hidden)", () => {
        useNotifications.mockReturnValue({
            ...baseHookValue,
            notifications: [
                { id: "mob1", type: "new_message", read: false, time: "1 minute ago", title: "Mobile Delete Item", senderName: "Bob", body: "body", actions: [] },
            ],
        });
        render(<NotificationsTab setActiveTab={mockSetActiveTab} />);

        const deleteBtns = screen.getAllByTitle("Delete");
        // index 0 = desktop (hidden sm:flex wrapper), index 1 = mobile (sm:hidden)
        fireEvent.click(deleteBtns[1]);
        expect(mockDeleteOne).toHaveBeenCalledWith("mob1");
    });
    it("should render the unread stat with default (non-accent) styling when unreadCount is 0", () => {
        useNotifications.mockReturnValue({
            ...baseHookValue,
            notifications: [
                { id: "allread1", type: "new_message", read: true, time: "1 minute ago", title: "All Read Item", senderName: "Bob", body: "body", actions: [] },
            ],
        });
        render(<NotificationsTab setActiveTab={mockSetActiveTab} />);
        expect(screen.getByTestId("stat-unread")).toHaveTextContent("0");
    });
    it("should render all remaining TYPE_CONFIG/icon branches", () => {
        useNotifications.mockReturnValue({
            ...baseHookValue,
            notifications: [
                { id: "c1", type: "connect_request_received", read: false, time: "1 minute ago", title: "Received item", senderName: "A", body: "b", actions: [] },
                { id: "c2", type: "connect_request_accepted", read: false, time: "1 minute ago", title: "Accepted item", senderName: "B", body: "b", actions: [] },
                { id: "c3", type: "connect_request_declined", read: false, time: "1 minute ago", title: "Declined item", senderName: "C", body: "b", actions: [] },
                { id: "c4", type: "session_completed", read: false, time: "1 minute ago", title: "Completed item", senderName: "D", body: "b", actions: [] },
                { id: "c5", type: "new_review", read: false, time: "1 minute ago", title: "Review item", senderName: "E", body: "b", actions: [] },
                { id: "c6", type: "feedback", read: false, time: "1 minute ago", title: "Feedback item", senderName: "F", body: "b", actions: [] },
            ],
        });
        render(<NotificationsTab setActiveTab={mockSetActiveTab} />);

        expect(screen.getByText("Received item")).toBeInTheDocument();
        expect(screen.getByText("Accepted item")).toBeInTheDocument();
        expect(screen.getByText("Declined item")).toBeInTheDocument();
        expect(screen.getByText("Completed item")).toBeInTheDocument();
        expect(screen.getByText("Review item")).toBeInTheDocument();
        expect(screen.getByText("Feedback item")).toBeInTheDocument();
    });
    it("should render whatever time/body strings the hook provides, including edge-case values", () => {
        useNotifications.mockReturnValue({
            ...baseHookValue,
            notifications: [
                { id: "t1", type: "new_message", read: false, time: "just now", title: "Just Now Item", senderName: "Amy", body: "hello", actions: [] },
                { id: "t2", type: "new_message", read: false, time: "1 minute ago", title: "One Min Item", senderName: "Bob", body: "hi", actions: [] },
                { id: "t3", type: "new_message", read: false, time: "1 hour ago", title: "One Hour Item", senderName: "Cara", body: "hey", actions: [] },
                { id: "t4", type: "new_message", read: false, time: "3 days ago", title: "Multi Day Item", senderName: "Dan", body: "sup", actions: [] },
            ],
        });
        render(<NotificationsTab setActiveTab={mockSetActiveTab} />);

        expect(screen.getByText("just now")).toBeInTheDocument();
        expect(screen.getByText("1 minute ago")).toBeInTheDocument();
        expect(screen.getByText("1 hour ago")).toBeInTheDocument();
        expect(screen.getByText("3 days ago")).toBeInTheDocument();
    });
});