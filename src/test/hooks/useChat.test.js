// src/test/hooks/useChat.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import axiosInstance from "../../utils/axiosInstance";
import useChat from "../../hooks/useChat";

vi.mock("../../utils/axiosInstance");

// Flushes pending microtasks (promise chains) without relying on real
// or fake timers — safe to use regardless of vi.useFakeTimers() state.
const flush = async () => {
    await act(async () => {
        for (let i = 0; i < 5; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            await Promise.resolve();
        }
    });
};

// Advances fake timers (used for the socket-connect poll and typing debounce)
// then flushes any microtasks the advance produced.
const advance = async (ms) => {
    await act(async () => {
        await vi.advanceTimersByTimeAsync(ms);
    });
};

// Builds a fake socket with an internal handler registry so tests can
// manually fire events the same way the real server would.
const createMockSocket = () => {
    const handlers = {};
    return {
        connected: true,
        emit: vi.fn(),
        on: vi.fn((event, cb) => {
            handlers[event] = cb;
        }),
        off: vi.fn((event) => {
            delete handlers[event];
        }),
        __trigger: (event, payload) => handlers[event]?.(payload),
        __handlers: handlers,
    };
};

describe("useChat", () => {
    let mockSocket;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        mockSocket = createMockSocket();
        globalThis.__leapSocket = mockSocket;
    });

    afterEach(() => {
        globalThis.__leapSocket = null;
        vi.useRealTimers();
    });

    // Renders the hook, flushes the history fetch, then advances the
    // connect-poll interval so socket listeners are registered.
    const setupConnectedChat = async (connectRequestId = "room1") => {
        const hookResult = renderHook(() => useChat(connectRequestId));
        await flush();
        await advance(200);
        return hookResult;
    };

    it("does nothing when connectRequestId is falsy", () => {
        const { result } = renderHook(() => useChat(null));

        expect(result.current.loading).toBe(true);
        expect(axiosInstance.get).not.toHaveBeenCalled();
    });

    it("loads message history on mount", async () => {
        axiosInstance.get.mockResolvedValue({
            data: { messages: [{ _id: "1", content: "hi" }], hasMore: true },
        });

        const { result } = renderHook(() => useChat("room1"));
        await flush();

        expect(axiosInstance.get).toHaveBeenCalledWith("/messages/room1", {
            params: { page: 1, limit: 30 },
        });
        expect(result.current.loading).toBe(false);
        expect(result.current.messages).toEqual([{ _id: "1", content: "hi" }]);
        expect(result.current.hasMore).toBe(true);
        expect(result.current.error).toBeNull();
    });

    it("sets an error message when history load fails", async () => {
        axiosInstance.get.mockRejectedValue({
            response: { data: { message: "Room not found" } },
        });

        const { result } = renderHook(() => useChat("room1"));
        await flush();

        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe("Room not found");
    });

    it("falls back to a generic error message when none is provided", async () => {
        axiosInstance.get.mockRejectedValue(new Error("network down"));

        const { result } = renderHook(() => useChat("room1"));
        await flush();

        expect(result.current.error).toBe("Failed to load messages");
    });

    it("joins the room and registers socket listeners once socket is connected", async () => {
        axiosInstance.get.mockResolvedValue({ data: { messages: [], hasMore: false } });

        await setupConnectedChat();

        expect(mockSocket.emit).toHaveBeenCalledWith("join_room", { connectRequestId: "room1" });
        expect(mockSocket.on).toHaveBeenCalledWith("new_message", expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith("typing_start", expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith("typing_stop", expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith("user_online", expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith("user_offline", expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith("messages_read", expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith("error", expect.any(Function));
    });

    it("appends a new incoming message without duplicating existing ones", async () => {
        axiosInstance.get.mockResolvedValue({
            data: { messages: [{ _id: "1", content: "hi" }], hasMore: false },
        });

        const { result } = await setupConnectedChat();

        act(() => {
            mockSocket.__trigger("new_message", { _id: "2", content: "there" });
        });
        expect(result.current.messages).toHaveLength(2);

        act(() => {
            mockSocket.__trigger("new_message", { _id: "2", content: "duplicate" });
        });
        expect(result.current.messages).toHaveLength(2);
    });

    it("updates typing and online presence state from socket events", async () => {
        axiosInstance.get.mockResolvedValue({ data: { messages: [], hasMore: false } });

        const { result } = await setupConnectedChat();

        act(() => mockSocket.__trigger("typing_start"));
        expect(result.current.isTyping).toBe(true);

        act(() => mockSocket.__trigger("typing_stop"));
        expect(result.current.isTyping).toBe(false);

        act(() => mockSocket.__trigger("user_online"));
        expect(result.current.otherOnline).toBe(true);

        act(() => mockSocket.__trigger("user_offline"));
        expect(result.current.otherOnline).toBe(false);
    });

    it("marks unread messages read when 'messages_read' fires", async () => {
        const readAt = "2026-07-11T00:00:00.000Z";
        axiosInstance.get.mockResolvedValue({
            data: {
                messages: [
                    { _id: "1", content: "a", readAt: null },
                    { _id: "2", content: "b", readAt: "already-read" },
                ],
                hasMore: false,
            },
        });

        const { result } = await setupConnectedChat();

        act(() => mockSocket.__trigger("messages_read", { readAt }));

        expect(result.current.messages[0].readAt).toBe(readAt);
        expect(result.current.messages[1].readAt).toBe("already-read");
    });

    it("sets error state when socket emits an 'error' event", async () => {
        axiosInstance.get.mockResolvedValue({ data: { messages: [], hasMore: false } });

        const { result } = await setupConnectedChat();

        act(() => mockSocket.__trigger("error", { message: "socket broke" }));
        expect(result.current.error).toBe("socket broke");
    });

    it("cleans up socket listeners on unmount", async () => {
        axiosInstance.get.mockResolvedValue({ data: { messages: [], hasMore: false } });

        const { unmount } = await setupConnectedChat();

        unmount();

        expect(mockSocket.off).toHaveBeenCalledWith("new_message", expect.any(Function));
        expect(mockSocket.off).toHaveBeenCalledWith("error", expect.any(Function));
    });

    it("loadMore fetches the next page and prepends older messages", async () => {
        axiosInstance.get
            .mockResolvedValueOnce({ data: { messages: [{ _id: "2" }], hasMore: true } })
            .mockResolvedValueOnce({ data: { messages: [{ _id: "1" }], hasMore: false } });

        const { result } = renderHook(() => useChat("room1"));
        await flush();

        await act(async () => {
            await result.current.loadMore();
        });

        expect(axiosInstance.get).toHaveBeenLastCalledWith("/messages/room1", {
            params: { page: 2, limit: 30 },
        });
        expect(result.current.messages).toEqual([{ _id: "1" }, { _id: "2" }]);
        expect(result.current.hasMore).toBe(false);
    });

    it("loadMore does nothing when hasMore is false", async () => {
        axiosInstance.get.mockResolvedValue({ data: { messages: [], hasMore: false } });

        const { result } = renderHook(() => useChat("room1"));
        await flush();

        await act(async () => {
            await result.current.loadMore();
        });

        expect(axiosInstance.get).toHaveBeenCalledTimes(1);
    });

    it("loadMore sets an error message when the request fails", async () => {
        axiosInstance.get
            .mockResolvedValueOnce({ data: { messages: [], hasMore: true } })
            .mockRejectedValueOnce({ response: { data: { message: "older fetch failed" } } });

        const { result } = renderHook(() => useChat("room1"));
        await flush();

        await act(async () => {
            await result.current.loadMore();
        });

        expect(result.current.error).toBe("older fetch failed");
    });

    it("sendMessage emits send_message and stops typing if currently typing", async () => {
        axiosInstance.get.mockResolvedValue({ data: { messages: [], hasMore: false } });

        const { result } = await setupConnectedChat();

        act(() => result.current.handleTyping());
        mockSocket.emit.mockClear();

        act(() => result.current.sendMessage("  hello  "));

        expect(mockSocket.emit).toHaveBeenCalledWith("send_message", {
            connectRequestId: "room1",
            content: "hello",
        });
        expect(mockSocket.emit).toHaveBeenCalledWith("typing_stop", { connectRequestId: "room1" });
    });

    it("sendMessage does nothing for empty/whitespace content", async () => {
        axiosInstance.get.mockResolvedValue({ data: { messages: [], hasMore: false } });

        const { result } = await setupConnectedChat();

        mockSocket.emit.mockClear();
        act(() => result.current.sendMessage("   "));

        expect(mockSocket.emit).not.toHaveBeenCalled();
    });

    it("handleTyping emits typing_start once then debounces typing_stop", async () => {
        axiosInstance.get.mockResolvedValue({ data: { messages: [], hasMore: false } });

        const { result } = await setupConnectedChat();

        mockSocket.emit.mockClear();
        act(() => result.current.handleTyping());
        act(() => result.current.handleTyping());

        expect(mockSocket.emit).toHaveBeenCalledWith("typing_start", { connectRequestId: "room1" });
        expect(mockSocket.emit).toHaveBeenCalledTimes(1);

        await advance(2000);

        expect(mockSocket.emit).toHaveBeenCalledWith("typing_stop", { connectRequestId: "room1" });
    });

    it("markRead emits mark_read with the current room id", async () => {
        axiosInstance.get.mockResolvedValue({ data: { messages: [], hasMore: false } });

        const { result } = await setupConnectedChat();

        mockSocket.emit.mockClear();
        act(() => result.current.markRead());

        expect(mockSocket.emit).toHaveBeenCalledWith("mark_read", { connectRequestId: "room1" });
    });

    it("markRead and sendMessage are no-ops before the socket connects", async () => {
        globalThis.__leapSocket = { connected: false, emit: vi.fn(), on: vi.fn(), off: vi.fn() };
        axiosInstance.get.mockResolvedValue({ data: { messages: [], hasMore: false } });

        const { result } = renderHook(() => useChat("room1"));
        await flush();

        act(() => result.current.markRead());
        act(() => result.current.sendMessage("hi"));

        expect(globalThis.__leapSocket.emit).not.toHaveBeenCalled();
    });
});