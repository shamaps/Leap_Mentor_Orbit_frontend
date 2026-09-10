// src/test/hooks/useSocketToast.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useSelector } from "react-redux";
import { io } from "socket.io-client";
import { useToast } from "../../shared/context/ToastContext";
import useUnreadCount from "../../features/shared-dashboard/presenter/useUnreadCount";
import logger from "../../shared/utils/logger";
import useSocketToast from "../../features/shared-dashboard/presenter/useSocketToast";

vi.mock("react-redux");
vi.mock("socket.io-client");
vi.mock("../../shared/context/ToastContext");
vi.mock("../../features/shared-dashboard/presenter/useUnreadCount");
vi.mock("../../shared/utils/logger");

// Builds a fake socket with an internal handler registry so tests can
// manually fire events the same way the real server would.
const createMockSocket = () => {
    const handlers = {};
    return {
        on: vi.fn((event, cb) => {
            handlers[event] = cb;
        }),
        disconnect: vi.fn(),
        connected: false,
        __trigger: (event, payload) => handlers[event]?.(payload),
        __handlers: handlers,
    };
};

describe("useSocketToast", () => {
    let showToast;
    let incrementBadge;
    let mockSocket;

    beforeEach(() => {
        vi.clearAllMocks();
        globalThis.__leapSocket = null;

        showToast = vi.fn();
        incrementBadge = vi.fn();
        useToast.mockReturnValue({ showToast });
        useUnreadCount.mockReturnValue({ incrementBadge });

        mockSocket = createMockSocket();
        io.mockReturnValue(mockSocket);
    });

    afterEach(() => {
        globalThis.__leapSocket = null;
    });

    it("does not connect when there is no auth token", () => {
        useSelector.mockReturnValue(null);

        renderHook(() => useSocketToast());

        expect(io).not.toHaveBeenCalled();
    });

    it("connects with the token and expected socket options when a token is present", () => {
        useSelector.mockReturnValue("test-token");

        renderHook(() => useSocketToast());

        expect(io).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                auth: { token: "test-token" },
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 2000,
                transports: ["websocket", "polling"],
            }),
        );
        expect(globalThis.__leapSocket).toBe(mockSocket);
    });

    it("skips connecting when a globally connected socket already exists", () => {
        useSelector.mockReturnValue("test-token");
        globalThis.__leapSocket = { connected: true };

        renderHook(() => useSocketToast());

        expect(io).not.toHaveBeenCalled();
    });

    it("shows a toast and increments the badge on 'new_connect_request'", () => {
        useSelector.mockReturnValue("test-token");

        renderHook(() => useSocketToast());

        mockSocket.__trigger("new_connect_request", {
            title: "New Request",
            message: "You have a new mentee request",
        });

        expect(showToast).toHaveBeenCalledWith({
            type: "info",
            title: "New Request",
            message: "You have a new mentee request",
        });
        expect(incrementBadge).toHaveBeenCalled();
    });

    it("uses the fallback type per event when the payload has no type", () => {
        useSelector.mockReturnValue("test-token");

        renderHook(() => useSocketToast());

        mockSocket.__trigger("request_accepted", { title: "Accepted", message: "msg" });
        expect(showToast).toHaveBeenCalledWith({ type: "success", title: "Accepted", message: "msg" });

        mockSocket.__trigger("request_declined", { title: "Declined", message: "msg" });
        expect(showToast).toHaveBeenCalledWith({ type: "warning", title: "Declined", message: "msg" });

        mockSocket.__trigger("request_referred", { title: "Referred", message: "msg" });
        expect(showToast).toHaveBeenCalledWith({ type: "info", title: "Referred", message: "msg" });
    });

    it("uses the payload's explicit type over the fallback when provided", () => {
        useSelector.mockReturnValue("test-token");

        renderHook(() => useSocketToast());

        mockSocket.__trigger("new_connect_request", {
            title: "Custom",
            message: "msg",
            type: "error",
        });

        expect(showToast).toHaveBeenCalledWith({ type: "error", title: "Custom", message: "msg" });
    });

    it("calls onRequestChanged when 'request_status_changed' fires", () => {
        useSelector.mockReturnValue("test-token");
        const onRequestChanged = vi.fn();

        renderHook(() => useSocketToast(onRequestChanged));

        mockSocket.__trigger("request_status_changed", { id: "req-1", status: "accepted" });

        expect(onRequestChanged).toHaveBeenCalledWith({ id: "req-1", status: "accepted" });
    });

    it("does not throw when 'request_status_changed' fires without a callback", () => {
        useSelector.mockReturnValue("test-token");

        renderHook(() => useSocketToast());

        expect(() =>
            mockSocket.__trigger("request_status_changed", { id: "req-1" }),
        ).not.toThrow();
    });

    it("logs a warning on connect_error", () => {
        useSelector.mockReturnValue("test-token");

        renderHook(() => useSocketToast());

        mockSocket.__trigger("connect_error", { message: "timeout" });

        expect(logger.warn).toHaveBeenCalledWith("Socket connection error", {
            message: "timeout",
        });
    });

    it("re-assigns globalThis.__leapSocket on reconnect", () => {
        useSelector.mockReturnValue("test-token");

        renderHook(() => useSocketToast());
        globalThis.__leapSocket = null;

        mockSocket.__trigger("reconnect");

        expect(globalThis.__leapSocket).toBe(mockSocket);
    });

    it("disconnects and clears the global socket on unmount", () => {
        useSelector.mockReturnValue("test-token");

        const { unmount } = renderHook(() => useSocketToast());

        unmount();

        expect(mockSocket.disconnect).toHaveBeenCalled();
        expect(globalThis.__leapSocket).toBeNull();
    });

    it("does not clear the global socket on unmount if it was replaced by another socket", () => {
        useSelector.mockReturnValue("test-token");

        const { unmount } = renderHook(() => useSocketToast());

        const otherSocket = createMockSocket();
        globalThis.__leapSocket = otherSocket;

        unmount();

        expect(globalThis.__leapSocket).toBe(otherSocket);
    });
});