import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux';
import store from './store/index.js';
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import { ToastProvider } from './context/ToastContext.jsx'

const App = lazy(() => import('./App.jsx'))  // lazy load App

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <ClerkProvider publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}>
        <ToastProvider>
          <Suspense fallback={null}>  {/* null fallback — no flash */}
            <App />
          </Suspense>
        </ToastProvider>
      </ClerkProvider>
    </Provider>
  </StrictMode>,
)