// src/app/App.tsx
import { lazy, Suspense, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
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
import { PERMISSIONS } from "@/features/auth/model/permissions";
import withErrorBoundary from "@/shared/utils/withErrorBoundary";
import RouteErrorPage from "@/shared/components/RouteErrorPage";
import { adminSettingsLoader } from "@/features/admin/model/adminSettings.loader";
import { adminVerificationsLoader } from "@/features/admin/model/adminVerifications.loader";
import { adminVerificationsAction } from "@/features/admin/model/adminVerifications.action";
import { adminUserManagementLoader } from "@/features/admin/model/adminUserManagement.loader";
import { adminEngagementsLoader } from "@/features/admin/model/adminEngagements.loader";
import { adminReportsLoader } from "@/features/admin/model/adminReports.loader";
import { adminPaymentsLoader } from "@/features/admin/model/adminPayments.loader";

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


const SafeLoginMentee = withErrorBoundary(LoginMentee, "auth");
const SafeMenteeEditProfileShell = withErrorBoundary(MenteeEditProfileShell, "mentee-dashboard");
const SafeMentorEditProfileShell = withErrorBoundary(MentorEditProfileShell, "mentor-dashboard");

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

// ── Route tree
const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <RouteErrorBoundary zone="marketing">
        <Home />
      </RouteErrorBoundary>
    ),
    errorElement: <RouteErrorPage zone="marketing" />,
  },
  {
    path: "/register/mentee",
    element: (
      <RouteErrorBoundary zone="auth">
        <RegisterMentee />
      </RouteErrorBoundary>
    ),
  },
  {
    path: "/register/mentor",
    element: (
      <RouteErrorBoundary zone="auth">
        <RegisterMentor />
      </RouteErrorBoundary>
    ),
  },
  {
    // HOC-wrapped example 
    path: "/login",
    element: <SafeLoginMentee />,
  },
  {
    path: "/login/mentor",
    element: (
      <RouteErrorBoundary zone="auth">
        <LoginMentor />
      </RouteErrorBoundary>
    ),
  },
  {
    path: "/login/mentee",
    element: (
      <RouteErrorBoundary zone="auth">
        <LoginMentee />
      </RouteErrorBoundary>
    ),
  },
  {
    path: "/verify-email",
    element: (
      <RouteErrorBoundary zone="auth">
        <VerifyEmail />
      </RouteErrorBoundary>
    ),
  },
  {
    path: "/forgot-password",
    element: (
      <RouteErrorBoundary zone="auth">
        <ForgotPassword />
      </RouteErrorBoundary>
    ),
  },
  {
    path: "/sso-callback",
    element: (
      <RouteErrorBoundary zone="auth">
        <SSOCallback />
      </RouteErrorBoundary>
    ),
  },
  {
    path: "/sso-callback-sync",
    element: (
      <RouteErrorBoundary zone="auth">
        <SSOSync />
      </RouteErrorBoundary>
    ),
  },
  {
    path: "/onboarding/mentor",
    element: (
      <RouteErrorBoundary zone="onboarding">
        <ProtectedRoute permission={PERMISSIONS.MANAGE_MENTOR_PROFILE}>
          <MentorOnboarding />
        </ProtectedRoute>
      </RouteErrorBoundary>
    ),
  },
  {
    path: "/onboarding/mentor/verify-documents",
    element: (
      <RouteErrorBoundary zone="onboarding">
        <ProtectedRoute permission={PERMISSIONS.UPLOAD_VERIFICATION_DOCS}>
          <MentorVerification />
        </ProtectedRoute>
      </RouteErrorBoundary>
    ),
  },
  {
    path: "/onboarding/mentee",
    element: (
      <RouteErrorBoundary zone="onboarding">
        <ProtectedRoute permission={PERMISSIONS.MANAGE_MENTEE_PROFILE}>
          <MenteeOnboarding />
        </ProtectedRoute>
      </RouteErrorBoundary>
    ),
  },
  {
    // HOC-wrapped example
    path: "/dashboard/mentee/edit-profile",
    element: (
      <ProtectedRoute permission={PERMISSIONS.MANAGE_MENTEE_PROFILE}>
        <SafeMenteeEditProfileShell />
      </ProtectedRoute>
    ),
  },
  {
    // HOC-wrapped example 
    path: "/dashboard/mentor/edit-profile",
    element: (
      <ProtectedRoute permission={PERMISSIONS.MANAGE_MENTOR_PROFILE}>
        <SafeMentorEditProfileShell />
      </ProtectedRoute>
    ),
  },
  {
    path: "/dashboard/mentor",
    element: (
      <RouteErrorBoundary zone="mentor-dashboard">
        <ProtectedRoute permission={PERMISSIONS.VIEW_MENTOR_DASHBOARD}>
          <MentorDashboard />
        </ProtectedRoute>
      </RouteErrorBoundary>
    ),
    errorElement: <RouteErrorPage zone="mentor-dashboard" />,
  },
  {
    path: "/dashboard/mentee",
    element: (
      <RouteErrorBoundary zone="mentee-dashboard">
        <ProtectedRoute permission={PERMISSIONS.VIEW_MENTEE_DASHBOARD}>
          <MenteeDashboard />
        </ProtectedRoute>
      </RouteErrorBoundary>
    ),
    errorElement: <RouteErrorPage zone="mentee-dashboard" />,
  },
  // ── Shared Dashboard — no role restriction, auth checked inside page ──
  {
    path: "/shared-dashboard/:connectRequestId",
    element: (
      <RouteErrorBoundary zone="shared-dashboard">
        <SharedDashboardPage />
      </RouteErrorBoundary>
    ),
  },
  {
    path: "/admin/login",
    element: (
      <RouteErrorBoundary zone="admin-login">
        <AdminLogin />
      </RouteErrorBoundary>
    ),
  },
  {
    path: "/admin",
    element: (
      <RouteErrorBoundary zone="admin-layout">
        <AdminRoute>
          <AdminLayout />
        </AdminRoute>
      </RouteErrorBoundary>
    ),
    errorElement: <RouteErrorPage zone="admin-layout" />,
    children: [
      {
        path: "users",
        loader: adminUserManagementLoader,
        element: (
          <RouteErrorBoundary zone="admin-child">
            <AdminUserManagement />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "engagements",
        loader: adminEngagementsLoader,
        element: (
          <RouteErrorBoundary zone="admin-child">
            <AdminEngagements />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "reports",
        loader: adminReportsLoader,
        element: (
          <RouteErrorBoundary zone="admin-child">
            <AdminReports />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "payments",
        loader: adminPaymentsLoader,
        element: (
          <RouteErrorBoundary zone="admin-child">
            <AdminPayments />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "settings",
        loader: adminSettingsLoader,
        element: (
          <RouteErrorBoundary zone="admin-child">
            <AdminSettings />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "wallet-requests",
        element: (
          <RouteErrorBoundary zone="admin-child">
            <AdminWalletRequests />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "support",
        element: (
          <RouteErrorBoundary zone="admin-child">
            <AdminSupportMessages />
          </RouteErrorBoundary>
        ),
      },
      {
        path: "verifications",
        loader: adminVerificationsLoader,
        action: adminVerificationsAction,
        element: (
          <RouteErrorBoundary zone="admin-child">
            <AdminVerifications />
          </RouteErrorBoundary>
        ),
      },
    ],
  },
  {
    path: "*",
    element: (
      <RouteErrorBoundary zone="not-found">
        <NotFound />
      </RouteErrorBoundary>
    ),
  },
]);

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
    <Suspense fallback={<PageLoader />}>
      <GlobalErrorBanner />
      <RouterProvider router={router} />
    </Suspense>
  );
};

export default App;