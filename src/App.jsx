// src/App.jsx
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setToken, setUser, setBootstrapped } from "./store/slices/authSlice";
import axiosInstance from "./utils/axiosInstance";
import * as Sentry from '@sentry/react';

import Home from "./components/Home";
import NotFound from "./pages/NotFound";
import AdminRoute from "./components/admin/AdminRoute";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const RegisterMentee = lazy(() => import("./pages/RegisterMentee"));
const RegisterMentor = lazy(() => import("./pages/RegisterMentor"));
const LoginMentor = lazy(() => import("./pages/LoginMentor"));
const LoginMentee = lazy(() => import("./pages/LoginMentee"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const SSOCallback = lazy(() => import("./pages/SSOCallback"));
const SSOSync = lazy(() => import("./pages/SSOSync"));

const MentorOnboarding = lazy(() => import("./pages/MentorOnboarding"));
const MentorVerification = lazy(() => import("./pages/MentorVerification"));
const MenteeOnboarding = lazy(() => import("./pages/MenteeOnboarding"));

const MenteeEditProfileShell = lazy(() => import("./components/mentee/profile/MenteeEditProfileShell"));
const MentorEditProfileShell = lazy(() => import("./components/mentor/profile/MentorEditProfileShell"));

const MentorDashboard = lazy(() => import("./pages/MentorDashboard"));
const MenteeDashboard = lazy(() => import("./pages/MenteeDashboard"));
const SharedDashboardPage = lazy(() => import("./pages/SharedDashboardPage"));

const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminUserManagement = lazy(() => import("./pages/admin/AdminUserManagement"));
const AdminEngagements = lazy(() => import("./pages/admin/AdminEngagements"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminSupportMessages = lazy(() => import("./components/admin/AdminSupportMessages"));
const AdminLayout = lazy(() => import("./components/admin/AdminLayout"));
const AdminWalletRequests = lazy(() => import("./pages/admin/AdminWalletRequests"));
const AdminVerifications = lazy(() => import("./pages/admin/AdminVerifications"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: "#f0f2f7" }}>
    <div className="flex flex-col items-center gap-3">
      <div className="w-9 h-9 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
      <p className="text-xs text-slate-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        Loading...
      </p>
    </div>
  </div>
);

const App = () => {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);

  useEffect(() => {
    // ✅ If token already in Redux (navigated from dashboard), mark bootstrapped immediately
    if (token) {
      dispatch(setBootstrapped());
      return;
    }

    // No token in memory — try to restore from HttpOnly cookie
    axiosInstance
      .post("/auth/refresh")
      .then(({ data }) => {
        dispatch(setToken(data.accessToken));
        dispatch(setUser({ user: data.user, token: data.accessToken }));
        if (data.user?.roles?.includes("mentor")) {
          localStorage.setItem("role", "mentor");
        } else if (data.user?.roles?.includes("mentee")) {
          localStorage.setItem("role", "mentee");
        }
        Sentry.setUser({
          id: data.user?._id,
          role: data.user?.roles?.[0]
        });
      })
      .catch(() => {
        // No valid refresh cookie — user will be redirected to login
      })
      .finally(() => {
        dispatch(setBootstrapped()); //  always fires
      });
  }, []);  // intentionally empty — runs once on mount only

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>

          <Route path="/" element={<Home />} />

          <Route path="/register/mentee" element={<RegisterMentee />} />
          <Route path="/register/mentor" element={<RegisterMentor />} />
          <Route path="/login" element={<LoginMentee />} />
          <Route path="/login/mentor" element={<LoginMentor />} />
          <Route path="/login/mentee" element={<LoginMentee />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/sso-callback" element={<SSOCallback />} />
          <Route path="/sso-callback-sync" element={<SSOSync />} />

          <Route path="/onboarding/mentor" element={<ProtectedRoute role="mentor"><MentorOnboarding /></ProtectedRoute>} />
          <Route path="/verify-documents" element={<ProtectedRoute role="mentor"><MentorVerification /></ProtectedRoute>} />
          <Route path="/onboarding/mentee" element={<ProtectedRoute role="mentee"><MenteeOnboarding /></ProtectedRoute>} />

          <Route path="/dashboard/mentee/edit-profile" element={<ProtectedRoute role="mentee"><MenteeEditProfileShell /></ProtectedRoute>} />
          <Route path="/dashboard/mentor/edit-profile" element={<ProtectedRoute role="mentor"><MentorEditProfileShell /></ProtectedRoute>} />

          <Route path="/dashboard/mentor" element={<ProtectedRoute role="mentor"><MentorDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/mentee" element={<ProtectedRoute role="mentee"><MenteeDashboard /></ProtectedRoute>} />

          {/* ── Shared Dashboard — no role restriction, auth checked inside page ── */}
          <Route path="/shared-dashboard/:connectRequestId" element={<SharedDashboardPage />} />

          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/users" element={<AdminRoute><AdminUserManagement /></AdminRoute>} />
          <Route path="/admin/engagements" element={<AdminRoute><AdminEngagements /></AdminRoute>} />
          <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
          <Route path="/admin/payments" element={<AdminRoute><AdminPayments /></AdminRoute>} />
          <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
          <Route path="/admin/wallet-requests" element={<AdminRoute><AdminWalletRequests /></AdminRoute>} />
          <Route path="/admin/support" element={<AdminRoute><AdminLayout><AdminSupportMessages /></AdminLayout></AdminRoute>} />
          <Route path="/admin/verifications" element={<AdminRoute><AdminLayout><AdminVerifications /></AdminLayout></AdminRoute>} />

          <Route path="*" element={<NotFound />} />

        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;