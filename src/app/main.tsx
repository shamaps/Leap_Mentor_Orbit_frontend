import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import store from "./store/index";
import { ClerkProvider } from "@clerk/clerk-react";
import "@/index.css";
import { ToastProvider } from "@/shared/context/ToastContext";
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  enabled: import.meta.env.PROD,
  integrations: [
    Sentry.browserTracingIntegration(),
    ...(import.meta.env.PROD
      ? [Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true })]
      : []),
  ],
  tracesSampleRate: 0.2,
  replaysOnErrorSampleRate: 1,
  tracePropagationTargets: ["localhost"],
});

const App = lazy(() => import("./App"));

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env");
}

// Sentry is only actually active when enabled (PROD) and a DSN is
// configured — don't claim "our team has been notified" otherwise.
const SENTRY_ACTIVE = Boolean(import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN);

// eslint-disable-next-line react-refresh/only-export-components -- app entry point, not a hot-reloaded component module
const SentryErrorFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-4 text-center max-w-sm px-4">
      <p className="text-slate-500 text-sm">
        {SENTRY_ACTIVE
          ? "Something went wrong. Our team has been notified."
          : "Something went wrong. Please reload the page."}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
      >
        Reload page
      </button>
    </div>
  </div>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<SentryErrorFallback />}>
      <Provider store={store}>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
          <ToastProvider>
            <Suspense fallback={null}>
              <App />
            </Suspense>
          </ToastProvider>
        </ClerkProvider>
      </Provider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
);