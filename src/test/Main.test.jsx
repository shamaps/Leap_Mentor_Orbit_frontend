import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

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

vi.mock("../app/store/index", () => ({
    default: { getState: () => ({}), dispatch: vi.fn(), subscribe: vi.fn() },
}));

vi.mock("react-redux", () => ({
    Provider: ({ children }) => children,
}));

vi.mock("@clerk/clerk-react", () => ({
    ClerkProvider: ({ children }) => children,
}));

vi.mock("../shared/context/ToastContext", () => ({
    ToastProvider: ({ children }) => children,
}));

vi.mock("../app/App", () => ({
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
        await import("../app/main");

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
        await import("../app/main");

        const config = mockSentryInit.mock.calls[0][0];
        expect(config.enabled).toBe(false);
    });

    it("does not include the replay integration when not in production", async () => {
        vi.stubEnv("PROD", false);
        await import("../app/main");

        const config = mockSentryInit.mock.calls[0][0];
        expect(config.integrations).toHaveLength(1);
        expect(mockReplayIntegration).not.toHaveBeenCalled();
    });

    it("includes the replay integration when in production", async () => {
        vi.stubEnv("PROD", true);
        await import("../app/main");

        const config = mockSentryInit.mock.calls[0][0];
        expect(config.integrations).toHaveLength(2);
        expect(mockReplayIntegration).toHaveBeenCalledWith({
            maskAllText: true,
            blockAllMedia: true,
        });
    });

    it("throws if VITE_CLERK_PUBLISHABLE_KEY is missing", async () => {
        vi.stubEnv("VITE_CLERK_PUBLISHABLE_KEY", "");

        await expect(import("../app/main")).rejects.toThrow(
            "Missing VITE_CLERK_PUBLISHABLE_KEY in .env"
        );
    });

    it("calls createRoot on the #root element and renders", async () => {
        await import("../app/main");

        expect(mockCreateRoot).toHaveBeenCalledTimes(1);
        expect(mockCreateRoot).toHaveBeenCalledWith(document.getElementById("root"));
        expect(mockRender).toHaveBeenCalledTimes(1);
    });

    it("renders the fallback and reloads when the app error boundary catches an error", async () => {
        const reload = vi.fn();
        vi.stubGlobal("location", { reload });
        await import("../app/main");

        const strictModeElement = mockRender.mock.calls[0][0];
        const errorBoundaryElement = strictModeElement.props.children;
        const fallbackElement = errorBoundaryElement.props.fallback;
        render(fallbackElement.type());

        expect(screen.getByText("Something went wrong. Please reload the page.")).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Reload page" }));
        expect(reload).toHaveBeenCalledTimes(1);
    });

    it("shows the notified message when production Sentry is active", async () => {
        vi.stubEnv("PROD", true);
        vi.stubEnv("VITE_SENTRY_DSN", "https://example-dsn.ingest.sentry.io/1");
        await import("../app/main");

        const errorBoundaryElement = mockRender.mock.calls[0][0].props.children;
        const fallbackElement = errorBoundaryElement.props.fallback;
        render(fallbackElement.type());

        expect(screen.getByText("Something went wrong. Our team has been notified.")).toBeInTheDocument();
    });

});