// src/shared/components/RouteErrorBoundary.tsx
import type { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import * as Sentry from "@sentry/react";

interface RouteFallbackProps {
    error: unknown;
    resetError: () => void;
}

const RouteFallback = ({ error, resetError }: RouteFallbackProps) => {
    const message =
        error instanceof Error
            ? error.message
            : typeof error === "string"
                ? error
                : "An unexpected error occurred.";

    return (
        <div className="min-h-[50vh] flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                <p className="text-sm text-slate-600">
                    Something went wrong loading this page. This part of the app
                    failed, but the rest is still working.
                </p>
                {/* Actual error message, shown separately from the generic copy above */}
                <p className="text-xs font-mono text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 max-w-full break-words">
                    {message}
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={resetError}
                        className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
                    >
                        Try again
                    </button>
            <a
                    href="/"
                    className="px-4 py-2 text-sm rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
                    Go home
                </a>
            </div>
        </div>
    </div >
  );
};

interface RouteErrorBoundaryProps {
    children: ReactNode;
    zone?: string;
}

const RouteErrorBoundary = ({ children, zone }: RouteErrorBoundaryProps) => {
    const { pathname } = useLocation();

    return (
        <Sentry.ErrorBoundary
            key={pathname}
            beforeCapture={(scope) => {
                if (zone) scope.setTag("boundaryZone", zone);
                scope.setTag("boundaryType", "route");
            }}
            fallback={({ error, resetError }) => (
                <RouteFallback error={error} resetError={resetError} />
            )}
            onReset={() => { }}
        >
            {children}
        </Sentry.ErrorBoundary>
    );
};

export default RouteErrorBoundary;