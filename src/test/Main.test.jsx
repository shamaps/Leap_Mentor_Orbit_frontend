import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRender = vi.fn();
const mockCreateRoot = vi.fn(() => ({ render: mockRender }));
vi.mock("react-dom/client", () => ({
    createRoot: mockCreateRoot,
}));

const mockSentryInit = vi.fn();
const mockBrowserTracingIntegration = vi.fn(() => ({ name: "browserTracing" }));
const mockReplayIntegration = vi.fn(() => ({ name: "replay" }));
vi.mock("@sentry/react", () => ({
    init: (...args) => mockSentryInit(...args),
    browserTracingIntegration: (...args) => mockBrowserTracingIntegration(...args),
    replayIntegration: (...args) => mockReplayIntegration(...args),
    ErrorBoundary: ({ children }) => children,
}));

vi.mock("../store/index.js", () => ({
    default: { getState: () => ({}), dispatch: vi.fn(), subscribe: vi.fn() },
}));

vi.mock("react-redux", () => ({
    Provider: ({ children }) => children,
}));

vi.mock("@clerk/clerk-react", () => ({
    ClerkProvider: ({ children }) => children,
}));

vi.mock("../context/ToastContext.jsx", () => ({
    ToastProvider: ({ children }) => children,
}));

vi.mock("../App.jsx", () => ({
    default: () => null,
}));

vi.mock("../index.css", () => ({}));

describe("main.jsx entry point", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
        document.body.innerHTML = '<div id="root"></div>';
        vi.stubEnv("VITE_SENTRY_DSN", "https://example-dsn.ingest.sentry.io/1");
        vi.stubEnv("VITE_CLERK_PUBLISHABLE_KEY", "pk_test_123");
        vi.stubEnv("MODE", "test");
        vi.stubEnv("PROD", false);
    });

    it("initializes Sentry with the DSN and environment from env vars", async () => {
        await import("../main.jsx");

        expect(mockSentryInit).toHaveBeenCalledTimes(1);
        const config = mockSentryInit.mock.calls[0][0];
        expect(config.dsn).toBe("https://example-dsn.ingest.sentry.io/1");
        expect(config.environment).toBe("test");
        expect(config.tracesSampleRate).toBe(0.2);
        expect(config.replaysOnErrorSampleRate).toBe(1);
        expect(config.tracePropagationTargets).toEqual(["localhost"]);
    });

    it("disables Sentry when not in production", async () => {
        vi.stubEnv("PROD", false);
        await import("../main.jsx");

        const config = mockSentryInit.mock.calls[0][0];
        expect(config.enabled).toBe(false);
    });

    it("does not include the replay integration when not in production", async () => {
        vi.stubEnv("PROD", false);
        await import("../main.jsx");

        const config = mockSentryInit.mock.calls[0][0];
        expect(config.integrations).toHaveLength(1);
        expect(mockReplayIntegration).not.toHaveBeenCalled();
    });

    it("includes the replay integration when in production", async () => {
        vi.stubEnv("PROD", true);
        await import("../main.jsx");

        const config = mockSentryInit.mock.calls[0][0];
        expect(config.integrations).toHaveLength(2);
        expect(mockReplayIntegration).toHaveBeenCalledWith({
            maskAllText: true,
            blockAllMedia: true,
        });
    });

    it("throws if VITE_CLERK_PUBLISHABLE_KEY is missing", async () => {
        vi.stubEnv("VITE_CLERK_PUBLISHABLE_KEY", "");

        await expect(import("../main.jsx")).rejects.toThrow(
            "Missing VITE_CLERK_PUBLISHABLE_KEY in .env"
        );
    });

    it("calls createRoot on the #root element and renders", async () => {
        await import("../main.jsx");

        expect(mockCreateRoot).toHaveBeenCalledTimes(1);
        expect(mockCreateRoot).toHaveBeenCalledWith(document.getElementById("root"));
        expect(mockRender).toHaveBeenCalledTimes(1);
    });
});