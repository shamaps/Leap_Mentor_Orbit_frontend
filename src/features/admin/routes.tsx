// src/features/admin/routes.jsx
// Admin feature's own route tree — extracted out of the flat App.jsx.
// App.jsx just mounts <AdminRoutes /> instead of declaring these inline.

import { lazy } from "react";
import { Route } from "react-router-dom";
import AdminRoute from "./view/components/AdminRoute";
import RouteErrorBoundary from "../../shared/components/RouteErrorBoundary";

const AdminLogin = lazy(() => import("./view/pages/AdminLogin"));
const AdminLayout = lazy(() => import("./view/components/AdminLayout"));
const AdminUserManagement = lazy(() => import("./view/pages/AdminUserManagement"));
const AdminEngagements = lazy(() => import("./view/pages/AdminEngagements"));
const AdminReports = lazy(() => import("./view/pages/AdminReports"));
const AdminPayments = lazy(() => import("./view/pages/AdminPayments"));
const AdminSettings = lazy(() => import("./view/pages/AdminSettings"));
const AdminWalletRequests = lazy(() => import("./view/pages/AdminWalletRequests"));
const AdminSupportMessages = lazy(() => import("./view/components/AdminSupportMessages"));
const AdminVerifications = lazy(() => import("./view/pages/AdminVerifications"));

// Exported as an array of <Route> elements — spread into the parent <Routes>
// in app/router.jsx (React Router requires <Route> children to be direct
// descendants of <Routes>, so this can't be a plain function component).
const adminRoutes = [
    <Route key="admin-login" path="/admin/login" element={<AdminLogin />} />,
    <Route
        key="admin-layout"
        path="/admin"
        element={
            <RouteErrorBoundary>
                <AdminRoute>
                    <AdminLayout />
                </AdminRoute>
            </RouteErrorBoundary>
        }
    >
        <Route path="users" element={<AdminUserManagement />} />
        <Route path="engagements" element={<AdminEngagements />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="wallet-requests" element={<AdminWalletRequests />} />
        <Route path="support" element={<AdminSupportMessages />} />
        <Route path="verifications" element={<AdminVerifications />} />
    </Route>,
];

export default adminRoutes;