// src/shared/components/RouteErrorPage.tsx

import { isRouteErrorResponse, useRouteError, useLocation } from "react-router-dom";
import * as Sentry from "@sentry/react";

interface RouteErrorPageProps {
    zone?: string;
}

const RouteErrorPage = ({ zone }: RouteErrorPageProps) => {
    const error = useRouteError();
    const { pathname } = useLocation();

    let message = "An unexpected error occurred.";
    if (isRouteErrorResponse(error)) {
        message = error.statusText || `${error.status} error`;
    } else if (error instanceof Error) {
        message = error.message;
    } else if (typeof error === "string") {
        message = error;
    }

    Sentry.captureException(error, (scope) => {
        if (zone) scope.setTag("boundaryZone", zone);
        scope.setTag("boundaryType", "route-error-element");
        scope.setTag("path", pathname);
        return scope;
    });

    return (
        <div className="min-h-[50vh] flex items-center justify-center p-8">
            <div className="flex flex-col items-center gap-4 text-center max-w-sm">
                <p className="text-sm text-slate-600">
                    Something went wrong loading this page. This part of the app
                    failed, but the rest is still working.
                </p>
                <p className="text-xs font-mono text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2 max-w-full break-words">
                    {message}
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={() => window.location.reload()}
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
        </div>
    );
};

export default RouteErrorPage;