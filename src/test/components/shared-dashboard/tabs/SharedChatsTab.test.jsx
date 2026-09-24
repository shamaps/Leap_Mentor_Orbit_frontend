// src/test/components/shared-dashboard/tabs/SharedChatTab.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import SharedChatTab from "../../../../features/shared-dashboard/view/components/tabs/SharedChatTab";

let mockState;
vi.mock("react-redux", () => ({
    useSelector: (selectorFn) => selectorFn(mockState),
}));

const mockUseChat = vi.fn();
vi.mock("../../../../features/shared-dashboard/presenter/useChat", () => ({
    default: (...args) => mockUseChat(...args),
}));

const makeChatState = (overrides = {}) => ({
    messages: [],
    loading: false,
    loadingMore: false,
    hasMore: false,
    error: null,
    isTyping: false,
    otherOnline: false,
    sendMessage: vi.fn(),
    loadMore: vi.fn(),
    handleTyping: vi.fn(),
    markRead: vi.fn(),
    ...overrides,
});

const makeConnect = (overrides = {}) => ({
    _id: "conn1",
    viewerRole: "mentee",
    mentor: { _id: "mentor1", name: "John Doe" },
    mentee: { _id: "mentee1", name: "Jane Smith" },
    mentorProfile: {},
    menteeProfile: {},
    ...overrides,
});

const scrollIntoViewMock = vi.fn();

describe("SharedChatTab", () => {
    beforeEach(() => {
        mockState = { sharedConnect: { connect: makeConnect() } };
        mockUseChat.mockReturnValue(makeChatState());
        Element.prototype.scrollIntoView = scrollIntoViewMock;
        scrollIntoViewMock.mockReset();
        window.dispatchEvent = window.dispatchEvent || (() => { });
    });

    it("shows a loading state while chat history loads", () => {
        mockUseChat.mockReturnValue(makeChatState({ loading: true }));
        render(<SharedChatTab />);
        expect(screen.getByText("Loading messages...")).toBeInTheDocument();
    });

    it("shows an empty state when there are no messages", () => {
        render(<SharedChatTab />);
        expect(screen.getByText("No messages yet")).toBeInTheDocument();
        expect(screen.getByText(/Start the conversation with/)).toBeInTheDocument();
    });

    it("renders the other participant's name for a mentee viewer (mentor is other)", () => {
        mockState = { sharedConnect: { connect: makeConnect({ viewerRole: "mentee" }) } };
        render(<SharedChatTab />);
        expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("renders the other participant's name for a mentor viewer (mentee is other)", () => {
        mockState = { sharedConnect: { connect: makeConnect({ viewerRole: "mentor" }) } };
        render(<SharedChatTab />);
        expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    });

    it("falls back to default other-name labels when mentor/mentee are missing", () => {
        mockState = {
            sharedConnect: {
                connect: makeConnect({ viewerRole: "mentee", mentor: null }),
            },
        };
        render(<SharedChatTab />);
        expect(screen.getByText("Mentor")).toBeInTheDocument();
    });

    it("shows Online/Offline status based on otherOnline", () => {
        mockUseChat.mockReturnValue(makeChatState({ otherOnline: true }));
        render(<SharedChatTab />);
        expect(screen.getByText("Online")).toBeInTheDocument();
    });

    it("shows Offline when otherOnline is false", () => {
        mockUseChat.mockReturnValue(makeChatState({ otherOnline: false }));
        render(<SharedChatTab />);
        expect(screen.getByText("Offline")).toBeInTheDocument();
    });

    it("renders an error banner when error is present and disables the input", () => {
        mockUseChat.mockReturnValue(makeChatState({ error: "Connection lost" }));
        render(<SharedChatTab />);
        expect(screen.getByText("Connection lost")).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText(/Type a message/),
        ).toBeDisabled();
    });

    it("renders messages, own vs other bubbles, and a date separator", () => {
        mockState = { sharedConnect: { connect: makeConnect({ viewerRole: "mentee" }) } };
        mockUseChat.mockReturnValue(
            makeChatState({
                messages: [
                    {
                        _id: "m1",
                        content: "Hi there",
                        sender: "mentor1",
                        createdAt: "2026-07-01T10:00:00Z",
                    },
                    {
                        _id: "m2",
                        content: "Hello!",
                        sender: { _id: "mentee1" },
                        createdAt: "2026-07-01T10:05:00Z",
                        readAt: "2026-07-01T10:06:00Z",
                    },
                ],
            }),
        );
        render(<SharedChatTab />);
        expect(screen.getByText("Hi there")).toBeInTheDocument();
        expect(screen.getByText("Hello!")).toBeInTheDocument();
    });

    it("renders a second date separator when messages fall on different days", () => {
        mockUseChat.mockReturnValue(
            makeChatState({
                messages: [
                    { _id: "m1", content: "Day1", sender: "x", createdAt: "2026-06-01T10:00:00Z" },
                    { _id: "m2", content: "Day2", sender: "x", createdAt: "2026-07-01T10:00:00Z" },
                ],
            }),
        );
        render(<SharedChatTab />);
        expect(screen.getByText("Day1")).toBeInTheDocument();
        expect(screen.getByText("Day2")).toBeInTheDocument();
    });

    it("shows Today as the date separator label for a message sent today", () => {
        mockUseChat.mockReturnValue(
            makeChatState({
                messages: [
                    { _id: "m1", content: "Now msg", sender: "x", createdAt: new Date().toISOString() },
                ],
            }),
        );
        render(<SharedChatTab />);
        expect(screen.getByText("Today")).toBeInTheDocument();
    });

    it("shows Yesterday as the date separator label for a message sent yesterday", () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        mockUseChat.mockReturnValue(
            makeChatState({
                messages: [
                    { _id: "m1", content: "Y msg", sender: "x", createdAt: yesterday.toISOString() },
                ],
            }),
        );
        render(<SharedChatTab />);
        expect(screen.getByText("Yesterday")).toBeInTheDocument();
    });

    it("shows the typing indicator when isTyping is true", () => {
        mockState = { sharedConnect: { connect: makeConnect({ viewerRole: "mentee" }) } };
        mockUseChat.mockReturnValue(makeChatState({ isTyping: true }));
        render(<SharedChatTab />);
        expect(screen.getByText(/is typing.../)).toBeInTheDocument();
    });

    it("shows the Load More button when hasMore is true and calls loadMore on click", () => {
        const loadMore = vi.fn();
        mockUseChat.mockReturnValue(makeChatState({ hasMore: true, loadMore }));
        render(<SharedChatTab />);
        const btn = screen.getByText("Load older messages");
        act(() => {
            btn.click();
        });
        expect(loadMore).toHaveBeenCalled();
    });

    it("shows 'Loading...' label and disables the button while loadingMore", () => {
        mockUseChat.mockReturnValue(makeChatState({ hasMore: true, loadingMore: true }));
        render(<SharedChatTab />);
        expect(screen.getByText("Loading...")).toBeInTheDocument();
        expect(screen.getByText("Loading...")).toBeDisabled();
    });

    it("hides the 'Loading...' label and re-enables the button once loadingMore finishes", () => {
        mockUseChat.mockReturnValue(makeChatState({ hasMore: true, loadingMore: true }));
        const { rerender } = render(<SharedChatTab />);
        expect(screen.getByText("Loading...")).toBeInTheDocument();

        mockUseChat.mockReturnValue(makeChatState({ hasMore: true, loadingMore: false }));
        rerender(<SharedChatTab />);
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
    
    it("sends a message via the send button and clears the input", () => {
        const sendMessage = vi.fn();
        mockUseChat.mockReturnValue(makeChatState({ sendMessage }));
        render(<SharedChatTab />);
        const textarea = screen.getByPlaceholderText(/Type a message/);
        fireEvent.change(textarea, { target: { value: "hello world" } });
        const sendButton = textarea.parentElement.querySelector("button");
        act(() => {
            sendButton.click();
        });
        expect(sendMessage).toHaveBeenCalledWith("hello world");
        expect(textarea.value).toBe("");
    });

    it("does not send an empty/whitespace-only message", () => {
        const sendMessage = vi.fn();
        mockUseChat.mockReturnValue(makeChatState({ sendMessage }));
        render(<SharedChatTab />);
        const textarea = screen.getByPlaceholderText(/Type a message/);
        fireEvent.change(textarea, { target: { value: "   " } });
        const sendButton = textarea.parentElement.querySelector("button");
        act(() => {
            sendButton.click();
        });
        expect(sendMessage).not.toHaveBeenCalled();
    });

    it("sends a message on Enter key (without Shift)", () => {
        const sendMessage = vi.fn();
        mockUseChat.mockReturnValue(makeChatState({ sendMessage }));
        render(<SharedChatTab />);
        const textarea = screen.getByPlaceholderText(/Type a message/);
        fireEvent.change(textarea, { target: { value: "enter msg" } });
        fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
        expect(sendMessage).toHaveBeenCalledWith("enter msg");
    });

    it("does not send on Shift+Enter (inserts newline instead)", () => {
        const sendMessage = vi.fn();
        mockUseChat.mockReturnValue(makeChatState({ sendMessage }));
        render(<SharedChatTab />);
        const textarea = screen.getByPlaceholderText(/Type a message/);
        fireEvent.change(textarea, { target: { value: "line1" } });
        fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
        expect(sendMessage).not.toHaveBeenCalled();
    });

    it("calls onTyping (handleTyping) when the input changes", () => {
        const handleTyping = vi.fn();
        mockUseChat.mockReturnValue(makeChatState({ handleTyping }));
        render(<SharedChatTab />);
        const textarea = screen.getByPlaceholderText(/Type a message/);
        fireEvent.change(textarea, { target: { value: "typing..." } });
        expect(handleTyping).toHaveBeenCalled();
    });

    it("focus/blur on the textarea updates border color inline style", () => {
        render(<SharedChatTab />);
        const textarea = screen.getByPlaceholderText(/Type a message/);
        fireEvent.focus(textarea);
        expect(textarea).toHaveStyle({ borderColor: "#93c5fd" });
        fireEvent.blur(textarea);
        expect(textarea).toHaveStyle({ borderColor: "#e2e8f0" });
    });

    it("calls markRead on mount and re-registers on window focus", () => {
        const markRead = vi.fn();
        mockUseChat.mockReturnValue(makeChatState({ markRead }));
        render(<SharedChatTab />);
        expect(markRead).toHaveBeenCalledTimes(1);
        act(() => {
            window.dispatchEvent(new Event("focus"));
        });
        expect(markRead).toHaveBeenCalledTimes(2);
    });

    it("renders avatar image when a picture is provided for the other participant", () => {
        mockState = {
            sharedConnect: {
                connect: makeConnect({
                    viewerRole: "mentee",
                    mentorProfile: { profilePicture: "pic.jpg" },
                }),
            },
        };
        render(<SharedChatTab />);
        expect(screen.getByAltText("John Doe")).toBeInTheDocument();
    });

    it("renders avatar image from menteeProfile when viewer is mentor", () => {
        mockState = {
            sharedConnect: {
                connect: makeConnect({
                    viewerRole: "mentor",
                    menteeProfile: { profilePicture: "mentee-pic.jpg" },
                }),
            },
        };
        render(<SharedChatTab />);
        expect(screen.getByAltText("Jane Smith")).toBeInTheDocument();
    });

    it("renders empty time text when a message has no createdAt", () => {
        mockUseChat.mockReturnValue(
            makeChatState({
                messages: [{ _id: "m1", content: "No time", sender: "x", createdAt: "" }],
            }),
        );
        render(<SharedChatTab />);
        expect(screen.getByText("No time")).toBeInTheDocument();
    });

    it("shows the unread (single check) receipt icon for an own message without readAt", () => {
        mockState = { sharedConnect: { connect: makeConnect({ viewerRole: "mentee" }) } };
        mockUseChat.mockReturnValue(
            makeChatState({
                messages: [
                    {
                        _id: "m1",
                        content: "Unread own msg",
                        sender: { _id: "mentee1" },
                        createdAt: "2026-07-01T10:00:00Z",
                        readAt: null,
                    },
                ],
            }),
        );
        render(<SharedChatTab />);
        expect(screen.getByText("Unread own msg")).toBeInTheDocument();
    });

    it("falls back to 'Mentee' label when viewer is mentor and mentee is missing", () => {
        mockState = {
            sharedConnect: {
                connect: makeConnect({ viewerRole: "mentor", mentee: null }),
            },
        };
        render(<SharedChatTab />);
        expect(screen.getByText("Mentee")).toBeInTheDocument();
    });

    it("does not call onSend when Enter is pressed on an empty textarea", () => {
        const sendMessage = vi.fn();
        mockUseChat.mockReturnValue(makeChatState({ sendMessage }));
        render(<SharedChatTab />);
        const textarea = screen.getByPlaceholderText(/Type a message/);
        fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
        expect(sendMessage).not.toHaveBeenCalled();
    });
});