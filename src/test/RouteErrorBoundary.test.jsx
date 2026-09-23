import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";


let captured = null;

vi.mock("@sentry/react", () => ({
    ErrorBoundary: (props) => {
        captured = props;
        return props.children;
    },
}));

vi.mock("react-router-dom", () => ({
    useLocation: () => ({ pathname: "/some/route" }),
}));

import RouteErrorBoundary from "../shared/components/RouteErrorBoundary";

describe("RouteErrorBoundary", () => {
    beforeEach(() => {
        captured = null;
    });

    it("renders its children and wires up the Sentry boundary with a location-based key", () => {
        render(
            <RouteErrorBoundary zone="mentor-dashboard">
                <div>Protected content</div>
            </RouteErrorBoundary>,
        );

        expect(screen.getByText("Protected content")).toBeInTheDocument();
        expect(captured).not.toBeNull();
        // Note: `key` is a special React prop consumed during reconciliation —
        // it is never forwarded into the component's actual props object, so
        // it can't be asserted on here even though RouteErrorBoundary passes
        // `key={pathname}` to remount the boundary per-route.
        expect(typeof captured.beforeCapture).toBe("function");
        expect(typeof captured.fallback).toBe("function");
        expect(typeof captured.onReset).toBe("function");
        // onReset is a no-op — just make sure calling it doesn't throw
        expect(() => captured.onReset()).not.toThrow();
    });

    describe("beforeCapture", () => {
        it("tags the scope with the zone and the boundary type when a zone is provided", () => {
            render(
                <RouteErrorBoundary zone="admin-layout">
                    <div>Content</div>
                </RouteErrorBoundary>,
            );

            const scope = { setTag: vi.fn() };
            captured.beforeCapture(scope);

            expect(scope.setTag).toHaveBeenCalledWith("boundaryZone", "admin-layout");
            expect(scope.setTag).toHaveBeenCalledWith("boundaryType", "route");
        });

        it("only tags boundaryType when no zone is provided", () => {
            render(
                <RouteErrorBoundary>
                    <div>Content</div>
                </RouteErrorBoundary>,
            );

            const scope = { setTag: vi.fn() };
            captured.beforeCapture(scope);

            expect(scope.setTag).not.toHaveBeenCalledWith("boundaryZone", expect.anything());
            expect(scope.setTag).toHaveBeenCalledWith("boundaryType", "route");
        });
    });

    describe("fallback (RouteFallback)", () => {
        const renderFallback = (error) => {
            const resetError = vi.fn();
            render(
                <RouteErrorBoundary zone="test-zone">
                    <div>Content</div>
                </RouteErrorBoundary>,
            );
            const ui = captured.fallback({ error, resetError });
            render(ui);
            return { resetError };
        };

        it("shows the Error instance's message", () => {
            renderFallback(new Error("Something specific broke"));

            expect(screen.getByText("Something specific broke")).toBeInTheDocument();
            expect(
                screen.getByText(/Something went wrong loading this page/i),
            ).toBeInTheDocument();
        });

        it("shows the raw string when the thrown error is a string", () => {
            renderFallback("a plain string error");

            expect(screen.getByText("a plain string error")).toBeInTheDocument();
        });

        it("falls back to a generic message for any other error shape", () => {
            renderFallback({ some: "object" });

            expect(
                screen.getByText("An unexpected error occurred."),
            ).toBeInTheDocument();
        });

        it("falls back to a generic message when error is undefined", () => {
            renderFallback(undefined);

            expect(
                screen.getByText("An unexpected error occurred."),
            ).toBeInTheDocument();
        });

        it("calls resetError when 'Try again' is clicked", () => {
            const { resetError } = renderFallback(new Error("boom"));

            fireEvent.click(screen.getByText("Try again"));

            expect(resetError).toHaveBeenCalledTimes(1);
        });

        it("renders a 'Go home' link pointing at the root", () => {
            renderFallback(new Error("boom"));

            const link = screen.getByText("Go home");
            expect(link).toHaveAttribute("href", "/");
        });
    });
});