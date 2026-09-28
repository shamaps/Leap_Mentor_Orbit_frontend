// src/test/components/RouteErrorPage.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RouteErrorPage from "../../shared/components/RouteErrorPage";
import * as Sentry from "@sentry/react";

// Mock react-router-dom hooks
const mockUseRouteError = vi.fn();
const mockUseLocation = vi.fn().mockReturnValue({ pathname: "/dashboard" });
const mockIsRouteErrorResponse = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useRouteError: () => mockUseRouteError(),
        useLocation: () => mockUseLocation(),
        isRouteErrorResponse: (error) => mockIsRouteErrorResponse(error),
    };
});

// Mock Sentry
vi.mock("@sentry/react", () => ({
    captureException: vi.fn((error, callback) => {
        if (typeof callback === "function") {
            const mockScope = { setTag: vi.fn() };
            callback(mockScope);
        }
    }),
}));
afterEach(() => {
    vi.unstubAllEnvs();
});
describe("RouteErrorPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockUseLocation.mockReturnValue({ pathname: "/dashboard" });
        mockIsRouteErrorResponse.mockReturnValue(false);
    });

    it("handles Error objects and displays their message", () => {
        const error = new Error("Failed to fetch data");
        mockUseRouteError.mockReturnValue(error);

        render(
            <MemoryRouter>
                <RouteErrorPage />
            </MemoryRouter>
        );

        expect(screen.getByText("Failed to fetch data")).toBeInTheDocument();
    });

    it("handles string error messages", () => {
        mockUseRouteError.mockReturnValue("Unauthorized access");

        render(
            <MemoryRouter>
                <RouteErrorPage />
            </MemoryRouter>
        );

        expect(screen.getByText("Unauthorized access")).toBeInTheDocument();
    });

    it("handles Router Error Responses with statusText", () => {
        const routeError = { status: 404, statusText: "Not Found" };
        mockIsRouteErrorResponse.mockReturnValue(true);
        mockUseRouteError.mockReturnValue(routeError);

        render(
            <MemoryRouter>
                <RouteErrorPage />
            </MemoryRouter>
        );

        expect(screen.getByText("Not Found")).toBeInTheDocument();
    });

    it("handles Router Error Responses without statusText (falls back to status code)", () => {
        const routeError = { status: 500, statusText: "" };
        mockIsRouteErrorResponse.mockReturnValue(true);
        mockUseRouteError.mockReturnValue(routeError);

        render(
            <MemoryRouter>
                <RouteErrorPage />
            </MemoryRouter>
        );

        expect(screen.getByText("500 error")).toBeInTheDocument();
    });

    it("uses default fallback message for unknown error types", () => {
        mockUseRouteError.mockReturnValue(12345);

        render(
            <MemoryRouter>
                <RouteErrorPage />
            </MemoryRouter>
        );

        expect(screen.getByText("An unexpected error occurred.")).toBeInTheDocument();
    });

    it("sends error report to Sentry with correct tags when zone is provided", () => {
        const error = new Error("Sentry test error");
        mockUseRouteError.mockReturnValue(error);

        render(
            <MemoryRouter>
                <RouteErrorPage zone="user-profile" />
            </MemoryRouter>
        );

        expect(Sentry.captureException).toHaveBeenCalledWith(error, expect.any(Function));
    });
    it("hides the raw error message in production", () => {
        vi.stubEnv("DEV", false);
        mockUseRouteError.mockReturnValue(new Error("Something specific broke"));

        render(
            <MemoryRouter>
                <RouteErrorPage />
            </MemoryRouter>
        );

        expect(screen.queryByText("Something specific broke")).not.toBeInTheDocument();
        expect(
            screen.getByText(/something went wrong loading this page/i)
        ).toBeInTheDocument();

        vi.unstubAllEnvs();
    });
    it("reloads the page when 'Try again' button is clicked", () => {
        const reloadSpy = vi.fn();
        vi.stubGlobal("location", { ...window.location, reload: reloadSpy });

        mockUseRouteError.mockReturnValue(new Error("Network Error"));

        render(
            <MemoryRouter>
                <RouteErrorPage />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(reloadSpy).toHaveBeenCalledTimes(1);

        vi.unstubAllGlobals();
    });

    it("renders 'Go home' link pointing to root '/'", () => {
        mockUseRouteError.mockReturnValue(new Error("Page crashed"));

        render(
            <MemoryRouter>
                <RouteErrorPage />
            </MemoryRouter>
        );

        const homeLink = screen.getByRole("link", { name: "Go home" });
        expect(homeLink).toBeInTheDocument();
        expect(homeLink).toHaveAttribute("href", "/");
    });
});