// src/App.jsx
import { lazy, Suspense, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setToken, setUser, setBootstrapped } from "./store/slices/authSlice";
import axiosInstance from "@/shared/utils/axiosInstance";
import * as Sentry from "@sentry/react";
import { selectAuthToken } from "./store/selectors";
import Home from "@/shared/marketing/Home";
import GlobalErrorBanner from "@/shared/components/GlobalErrorBanner";
import NotFound from "@/shared/marketing/NotFound";
import AdminRoute from "@/features/admin/view/components/AdminRoute";
import RouteErrorBoundary from "@/shared/components/RouteErrorBoundary";
import ProtectedRoute from "@/features/auth/view/components/ProtectedRoute";
import { BrowserRouter, Routes, Route } from "react-router-dom";
const RegisterMentee = lazy(() => import("@/features/auth/view/pages/RegisterMentee"));
const RegisterMentor = lazy(() => import("@/features/auth/view/pages/RegisterMentor"));
const LoginMentor = lazy(() => import("@/features/auth/view/pages/LoginMentor"));
const LoginMentee = lazy(() => import("@/features/auth/view/pages/LoginMentee"));
const VerifyEmail = lazy(() => import("@/features/auth/view/pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("@/features/auth/view/pages/ForgotPassword"));
const SSOCallback = lazy(() => import("@/features/auth/view/pages/SSOCallback"));
const SSOSync = lazy(() => import("@/features/auth/view/pages/SSOSync"));

const MentorOnboarding = lazy(() => import("@/features/mentor/view/pages/MentorOnboarding"));
const MentorVerification = lazy(() => import("@/features/mentor/view/pages/MentorVerification"));
const MenteeOnboarding = lazy(() => import("@/features/mentee/view/pages/MenteeOnboarding"));

const MenteeEditProfileShell = lazy(
  () => import("@/features/mentee/view/components/profile/MenteeEditProfileShell"),
);
const MentorEditProfileShell = lazy(
  () => import("@/features/mentor/view/components/profile/MentorEditProfileShell"),
);

const MentorDashboard = lazy(() => import("@/features/mentor/view/pages/MentorDashboard"));
const MenteeDashboard = lazy(() => import("@/features/mentee/view/pages/MenteeDashboard"));
const SharedDashboardPage = lazy(() => import("@/features/shared-dashboard/view/pages/SharedDashboardPage"));

const AdminLogin = lazy(() => import("@/features/admin/view/pages/AdminLogin"));
const AdminUserManagement = lazy(
  () => import("@/features/admin/view/pages/AdminUserManagement"),
);
const AdminEngagements = lazy(() => import("@/features/admin/view/pages/AdminEngagements"));
const AdminReports = lazy(() => import("@/features/admin/view/pages/AdminReports"));
const AdminPayments = lazy(() => import("@/features/admin/view/pages/AdminPayments"));
const AdminSettings = lazy(() => import("@/features/admin/view/pages/AdminSettings"));
const AdminSupportMessages = lazy(
  () => import("@/features/admin/view/components/AdminSupportMessages"),
);
const AdminLayout = lazy(() => import("@/features/admin/view/components/AdminLayout"));
const AdminWalletRequests = lazy(
  () => import("@/features/admin/view/pages/AdminWalletRequests"),
);
const AdminVerifications = lazy(
  () => import("@/features/admin/view/pages/AdminVerifications"),
);

const PageLoader = () => (
  <div
    className="min-h-screen flex items-center justify-center"
    style={{ background: "#f0f2f7" }}
  >
    <div className="flex flex-col items-center gap-3">
      <div className="w-9 h-9 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
      <p
        className="text-xs text-slate-400"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        Loading...
      </p>
    </div>
  </div>
);

const App = () => {
  const dispatch = useDispatch();
  const token = useSelector(selectAuthToken);

  useEffect(() => {
    // If token already in Redux (navigated from dashboard), mark bootstrapped immediately
    if (token) {
      dispatch(setBootstrapped());
      return;
    }
    axiosInstance
      .post("/auth/refresh")
      .then(({ data }) => {
        dispatch(setToken(data.accessToken));
        dispatch(setUser({ user: data.user, token: data.accessToken }));
        Sentry.setUser({
          id: data.user?._id,
          role: data.user?.roles?.[0],
        });
      })
      .catch(() => {
        // No valid refresh cookie — user will be redirected to login
      })
      .finally(() => {
        dispatch(setBootstrapped()); //  always fires
      });
  }, []); // intentionally empty — runs once on mount only

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <GlobalErrorBanner />
        <Routes>
          <Route
            path="/"
            element={
              <RouteErrorBoundary>
                <Home />
              </RouteErrorBoundary>
            }
          />

          <Route
            path="/register/mentee"
            element={
              <RouteErrorBoundary>
                <RegisterMentee />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/register/mentor"
            element={
              <RouteErrorBoundary>
                <RegisterMentor />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/login"
            element={
              <RouteErrorBoundary>
                <LoginMentee />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/login/mentor"
            element={
              <RouteErrorBoundary>
                <LoginMentor />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/login/mentee"
            element={
              <RouteErrorBoundary>
                <LoginMentee />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/verify-email"
            element={
              <RouteErrorBoundary>
                <VerifyEmail />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <RouteErrorBoundary>
                <ForgotPassword />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/sso-callback"
            element={
              <RouteErrorBoundary>
                <SSOCallback />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/sso-callback-sync"
            element={
              <RouteErrorBoundary>
                <SSOSync />
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/onboarding/mentor"
            element={
              <RouteErrorBoundary>
                <ProtectedRoute role="mentor">
                  <MentorOnboarding />
                </ProtectedRoute>
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/onboarding/mentor/verify-documents"
            element={
              <RouteErrorBoundary>
                <ProtectedRoute role="mentor">
                  <MentorVerification />
                </ProtectedRoute>
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/onboarding/mentee"
            element={
              <RouteErrorBoundary>
                <ProtectedRoute role="mentee">
                  <MenteeOnboarding />
                </ProtectedRoute>
              </RouteErrorBoundary>
            }
          />

          <Route
            path="/dashboard/mentee/edit-profile"
            element={
              <RouteErrorBoundary>
                <ProtectedRoute role="mentee">
                  <MenteeEditProfileShell />
                </ProtectedRoute>
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/dashboard/mentor/edit-profile"
            element={
              <RouteErrorBoundary>
                <ProtectedRoute role="mentor">
                  <MentorEditProfileShell />
                </ProtectedRoute>
              </RouteErrorBoundary>
            }
          />

          <Route
            path="/dashboard/mentor"
            element={
              <RouteErrorBoundary>
                <ProtectedRoute role="mentor">
                  <MentorDashboard />
                </ProtectedRoute>
              </RouteErrorBoundary>
            }
          />
          <Route
            path="/dashboard/mentee"
            element={
              <RouteErrorBoundary>
                <ProtectedRoute role="mentee">
                  <MenteeDashboard />
                </ProtectedRoute>
              </RouteErrorBoundary>
            }
          />

          {/* ── Shared Dashboard — no role restriction, auth checked inside page ── */}
          <Route
            path="/shared-dashboard/:connectRequestId"
            element={
              <RouteErrorBoundary>
                <SharedDashboardPage />
              </RouteErrorBoundary>
            }
          />

          <Route path="/admin/login" element={<AdminLogin />} />

          <Route path="/admin" element={<RouteErrorBoundary>
            <AdminRoute><AdminLayout /></AdminRoute>
          </RouteErrorBoundary>}>
            <Route path="users" element={<AdminUserManagement />} />
            <Route path="engagements" element={<AdminEngagements />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="wallet-requests" element={<AdminWalletRequests />} />
            <Route path="support" element={<AdminSupportMessages />} />
            <Route path="verifications" element={<AdminVerifications />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;