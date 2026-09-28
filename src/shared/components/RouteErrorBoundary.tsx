// src/shared/components/RouteErrorBoundary.tsx
import type { ReactNode } from "react";
import * as Sentry from "@sentry/react";

interface RouteFallbackProps {
    error: unknown;
    resetError: () => void;
}
const getFallbackMessage = (error: unknown): string => {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return "An unexpected error occurred.";
};

const RouteFallback = ({ error, resetError }: RouteFallbackProps) => {
    const message = getFallbackMessage(error);
    const showDetails = import.meta.env.DEV;

    return (
        <div className="min-h-[50vh] flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                <p className="text-sm text-slate-600">
                    Something went wrong loading this page. This part of the app
                    failed, but the rest is still working.
                </p>
                {/* Actual error message, shown separately from the generic copy above */}
                {showDetails && (
                    <p className="text-xs font-mono text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 max-w-full break-words">
                        {message}
                    </p>
                )}
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
    return (
        <Sentry.ErrorBoundary
            beforeCapture={(scope) => {
                if (zone) scope.setTag("boundaryZone", zone);
                scope.setTag("boundaryType", "route");
            }}
            fallback={RouteFallback}
            onReset={() => { }}
        >
            {children}
        </Sentry.ErrorBoundary>
    );
};

export default RouteErrorBoundary;