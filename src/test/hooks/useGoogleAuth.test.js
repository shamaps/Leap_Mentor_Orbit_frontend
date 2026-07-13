// src/test/hooks/useGoogleAuth.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDispatch } from "react-redux";
import axiosInstance from "../../utils/axiosInstance";

vi.mock("react-redux");
vi.mock("../../utils/axiosInstance");

// GOOGLE_CLIENT_ID is read from import.meta.env at module load time, so to
// control it per test we stub the env var and re-import a fresh copy of the
// module (vi.resetModules clears the cache so the constant is re-evaluated).
const importHook = async (clientId = "test-client-id") => {
    vi.stubEnv("VITE_GOOGLE_CLIENT_ID", clientId);
    vi.resetModules();
    const mod = await import("../../hooks/useGoogleAuth");
    return mod.default;
};

const flush = async () => {
    await act(async () => {
        for (let i = 0; i < 5; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            await Promise.resolve();
        }
    });
};

describe("useGoogleAuth", () => {
    let dispatch;
    let btnRef;
    let mockGoogle;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.unstubAllEnvs();
        dispatch = vi.fn();
        useDispatch.mockReturnValue(dispatch);

        btnRef = { current: document.createElement("div") };

        mockGoogle = {
            accounts: { id: { initialize: vi.fn(), renderButton: vi.fn() } },
        };

        delete globalThis.google;
        delete globalThis.__googleInitialized;
        delete globalThis.requestIdleCallback;

        document.querySelectorAll('script[src="https://accounts.google.com/gsi/client"]').forEach((el) => el.remove());
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        delete globalThis.google;
        delete globalThis.__googleInitialized;
        delete globalThis.requestIdleCallback;
    });

    it("calls onError when VITE_GOOGLE_CLIENT_ID is missing", async () => {
        const useGoogleAuth = await importHook("");
        const onError = vi.fn();

        renderHook(() =>
            useGoogleAuth({ btnRef, roles: ["mentee"], termsAcceptedRef: { current: true }, onError }),
        );

        expect(onError).toHaveBeenCalledWith("Missing VITE_GOOGLE_CLIENT_ID in frontend .env");
    });

    it("initializes and renders the google button via requestIdleCallback when google is already loaded", async () => {
        const useGoogleAuth = await importHook("cid-123");
        globalThis.google = mockGoogle;
        globalThis.requestIdleCallback = vi.fn((cb) => cb());

        renderHook(() =>
            useGoogleAuth({ btnRef, roles: ["mentee"], termsAcceptedRef: { current: true } }),
        );

        expect(mockGoogle.accounts.id.initialize).toHaveBeenCalledWith(
            expect.objectContaining({ client_id: "cid-123", callback: expect.any(Function) }),
        );
        expect(mockGoogle.accounts.id.renderButton).toHaveBeenCalledWith(
            btnRef.current,
            expect.objectContaining({ theme: "outline", size: "large", width: 400, text: "continue_with" }),
        );
        expect(globalThis.__googleInitialized).toBe(true);
    });

    it("does not re-initialize but still re-renders the button when already initialized", async () => {
        const useGoogleAuth = await importHook("cid-123");
        globalThis.google = mockGoogle;
        globalThis.requestIdleCallback = vi.fn((cb) => cb());
        globalThis.__googleInitialized = true;

        renderHook(() =>
            useGoogleAuth({ btnRef, roles: ["mentee"], termsAcceptedRef: { current: true } }),
        );

        expect(mockGoogle.accounts.id.initialize).not.toHaveBeenCalled();
        expect(mockGoogle.accounts.id.renderButton).toHaveBeenCalled();
    });

    it("does nothing when btnRef is not yet attached", async () => {
        const useGoogleAuth = await importHook("cid-123");
        globalThis.google = mockGoogle;
        globalThis.requestIdleCallback = vi.fn((cb) => cb());
        const emptyRef = { current: null };

        renderHook(() =>
            useGoogleAuth({ btnRef: emptyRef, roles: ["mentee"], termsAcceptedRef: { current: true } }),
        );

        expect(mockGoogle.accounts.id.initialize).not.toHaveBeenCalled();
    });

    it("falls back to a 200ms setTimeout when requestIdleCallback is unavailable", async () => {
        vi.useFakeTimers();
        const useGoogleAuth = await importHook("cid-123");
        globalThis.google = mockGoogle;

        renderHook(() =>
            useGoogleAuth({ btnRef, roles: ["mentee"], termsAcceptedRef: { current: true } }),
        );

        expect(mockGoogle.accounts.id.initialize).not.toHaveBeenCalled();

        await act(async () => {
            await vi.advanceTimersByTimeAsync(200);
        });

        expect(mockGoogle.accounts.id.initialize).toHaveBeenCalled();
        vi.useRealTimers();
    });

    it("waits for the GSI script's load event when google is not yet on globalThis", async () => {
        const useGoogleAuth = await importHook("cid-123");
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        document.body.appendChild(script);

        renderHook(() =>
            useGoogleAuth({ btnRef, roles: ["mentee"], termsAcceptedRef: { current: true } }),
        );

        globalThis.google = mockGoogle;
        act(() => {
            script.dispatchEvent(new Event("load"));
        });

        expect(mockGoogle.accounts.id.initialize).toHaveBeenCalled();
        document.body.removeChild(script);
    });

    it("removes the script load listener on unmount", async () => {
        const useGoogleAuth = await importHook("cid-123");
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        document.body.appendChild(script);
        const removeSpy = vi.spyOn(script, "removeEventListener");

        const { unmount } = renderHook(() =>
            useGoogleAuth({ btnRef, roles: ["mentee"], termsAcceptedRef: { current: true } }),
        );

        unmount();

        expect(removeSpy).toHaveBeenCalledWith("load", expect.any(Function));
        document.body.removeChild(script);
    });

    it("does nothing extra when google isn't loaded and no matching script tag exists", async () => {
        const useGoogleAuth = await importHook("cid-123");

        expect(() =>
            renderHook(() =>
                useGoogleAuth({ btnRef, roles: ["mentee"], termsAcceptedRef: { current: true } }),
            ),
        ).not.toThrow();
    });

    // ── Identity callback (the function passed to google.accounts.id.initialize) ──
    const renderAndCaptureCallback = async (props = {}) => {
        const useGoogleAuth = await importHook("cid-123");
        globalThis.google = mockGoogle;
        globalThis.requestIdleCallback = vi.fn((cb) => cb());

        renderHook(() =>
            useGoogleAuth({
                btnRef,
                roles: ["mentee"],
                termsAcceptedRef: { current: true },
                ...props,
            }),
        );

        return mockGoogle.accounts.id.initialize.mock.calls[0][0].callback;
    };

    it("identity callback blocks submission and calls onError when terms are not accepted", async () => {
        const onError = vi.fn();
        const callback = await renderAndCaptureCallback({
            termsAcceptedRef: { current: false },
            onError,
        });

        await act(async () => {
            await callback({ credential: "cred" });
        });

        expect(onError).toHaveBeenCalledWith("Please accept the terms to continue.");
        expect(axiosInstance.post).not.toHaveBeenCalled();
    });

    it("identity callback posts credentials, dispatches setUser, and calls onSuccess on success", async () => {
        const onSuccess = vi.fn();
        const onLoadingChange = vi.fn();
        axiosInstance.post.mockResolvedValue({
            data: { accessToken: "tok-123", user: { id: "u1" } },
        });

        const callback = await renderAndCaptureCallback({
            roles: ["mentor"],
            onSuccess,
            onLoadingChange,
        });

        await act(async () => {
            await callback({ credential: "cred-xyz" });
        });

        expect(axiosInstance.post).toHaveBeenCalledWith("/auth/google", {
            credential: "cred-xyz",
            roles: ["mentor"],
            termsAccepted: true,
        });
        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: "auth/setUser",
                payload: { token: "tok-123", user: { id: "u1" } },
            }),
        );
        expect(onSuccess).toHaveBeenCalledWith({ accessToken: "tok-123", user: { id: "u1" } });
        expect(onLoadingChange).toHaveBeenNthCalledWith(1, true);
        expect(onLoadingChange).toHaveBeenNthCalledWith(2, false);
    });

    it("identity callback falls back to res.data.token and skips dispatch when neither token is present", async () => {
        const onSuccess = vi.fn();
        axiosInstance.post.mockResolvedValue({ data: { user: { id: "u1" } } });

        const callback = await renderAndCaptureCallback({ onSuccess });

        await act(async () => {
            await callback({ credential: "cred" });
        });

        expect(dispatch).not.toHaveBeenCalled();
        expect(onSuccess).toHaveBeenCalledWith({ user: { id: "u1" } });
    });

    it("identity callback uses res.data.token when accessToken is absent", async () => {
        axiosInstance.post.mockResolvedValue({ data: { token: "legacy-tok", user: null } });

        const callback = await renderAndCaptureCallback();

        await act(async () => {
            await callback({ credential: "cred" });
        });

        expect(dispatch).toHaveBeenCalledWith(
            expect.objectContaining({ payload: { token: "legacy-tok", user: null } }),
        );
    });

    it("identity callback calls onError with the server's message on failure", async () => {
        const onError = vi.fn();
        axiosInstance.post.mockRejectedValue({ response: { data: { message: "Email already used" } } });

        const callback = await renderAndCaptureCallback({ onError });

        await act(async () => {
            await callback({ credential: "cred" });
        });

        expect(onError).toHaveBeenCalledWith("Email already used");
    });

    it("identity callback falls back through error/message/generic text on failure", async () => {
        const onError = vi.fn();
        axiosInstance.post.mockRejectedValue({ response: { data: { error: "server error" } } });

        const callback = await renderAndCaptureCallback({ onError });
        await act(async () => {
            await callback({ credential: "cred" });
        });
        expect(onError).toHaveBeenCalledWith("server error");
    });

    it("identity callback falls back to a generic message when no error details exist", async () => {
        const onError = vi.fn();
        axiosInstance.post.mockRejectedValue({});

        const callback = await renderAndCaptureCallback({ onError });
        await act(async () => {
            await callback({ credential: "cred" });
        });
        expect(onError).toHaveBeenCalledWith("Already user exists");
    });

    it("identity callback still turns off loading state when the request fails", async () => {
        const onLoadingChange = vi.fn();
        axiosInstance.post.mockRejectedValue(new Error("network down"));

        const callback = await renderAndCaptureCallback({ onLoadingChange });
        await act(async () => {
            await callback({ credential: "cred" });
        });

        expect(onLoadingChange).toHaveBeenNthCalledWith(1, true);
        expect(onLoadingChange).toHaveBeenNthCalledWith(2, false);
    });

    it("identity callback treats a missing termsAcceptedRef as accepted by default", async () => {
        axiosInstance.post.mockResolvedValue({ data: {} });
        const useGoogleAuth = await importHook("cid-123");
        globalThis.google = mockGoogle;
        globalThis.requestIdleCallback = vi.fn((cb) => cb());

        renderHook(() => useGoogleAuth({ btnRef, roles: ["mentee"] }));

        const callback = mockGoogle.accounts.id.initialize.mock.calls[0][0].callback;

        await act(async () => {
            await callback({ credential: "cred" });
        });

        expect(axiosInstance.post).toHaveBeenCalledWith(
            "/auth/google",
            expect.objectContaining({ termsAccepted: true }),
        );
    });
});