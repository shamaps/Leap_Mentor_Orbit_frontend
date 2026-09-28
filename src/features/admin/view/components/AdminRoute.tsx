// src/features/admin/view/components/AdminRoute.tsx
// Wraps admin pages — redirects to /admin/login if no valid session

import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAdminSession } from "../../presenter/useAdminSession";

const PageLoader = () => (
  <div
    className="min-h-screen flex items-center justify-center"
    style={{ background: "#0f172a" }}
  >
    <div className="flex flex-col items-center gap-3">
      <div className="w-9 h-9 rounded-full border-4 border-blue-900 border-t-blue-500 animate-spin" />
      <p className="text-xs text-slate-500">Verifying admin session...</p>
    </div>
  </div>
);

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const status = useAdminSession();

  if (status === "checking") return <PageLoader />;
  if (status === "denied") return <Navigate to="/admin/login" replace />;

  return children;
};

export default AdminRoute;