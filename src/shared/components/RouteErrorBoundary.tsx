
// src/components/common/RouteErrorBoundary.jsx
//
// Route-level error boundary.
// crash in ONE page/section doesn't take down the whole app — unlike
// the single root Sentry.ErrorBoundary in main.jsx, which unmounts
// everything.

import type { ReactNode } from "react";
import * as Sentry from "@sentry/react";
const RouteFallback = ({ resetError }: { resetError: () => void }) => (
    <div className="min-h-[50vh] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
            <p className="text-sm text-slate-600">
                Something went wrong loading this page. This part of the app
                failed, but the rest is still working.
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
                    className="px-4 py-2 text-sm rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50" >
                    Go home
                </a>
            </div>
        </div>
    </div >
);

const RouteErrorBoundary = ({ children }: { children: ReactNode }) => (
    <Sentry.ErrorBoundary
        fallback={({ resetError }) => <RouteFallback resetError={resetError} />}
        onReset={() => {
            window.location.reload();
        }}
    >
        {children}
    </Sentry.ErrorBoundary>
);

export default RouteErrorBoundary;