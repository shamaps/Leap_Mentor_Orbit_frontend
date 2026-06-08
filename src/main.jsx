import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux';
import store from './store/index.js';
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import { ToastProvider } from './context/ToastContext.jsx'
import * as Sentry from '@sentry/react'  // ← ADD

// ── ADD: Sentry init — must be before createRoot ──────────────────────────
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  enabled: true,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  tracesSampleRate: 0.2,
  replaysOnErrorSampleRate: 1.0,
  tracePropagationTargets: [
    "localhost",
  
  ],
});
// ─────────────────────────────────────────────────────────────────────────

const App = lazy(() => import('./App.jsx'))

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env')
}

// ── ADD: fallback UI for full React tree crash ────────────────────────────
const SentryErrorFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <p className="text-slate-500 text-sm">Something went wrong. Our team has been notified.</p>
  </div>
);
// ─────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* ── ADD: wraps entire tree — catches any component crash ── */}
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
)