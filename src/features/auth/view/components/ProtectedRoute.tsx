// src/components/auth/ProtectedRoute.tsx
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuth } from "@/app/store/selectors";
import { hasPermission, type Permission } from "@/features/auth/model/permissions";

const PageLoader = () => (
  <div
    className="min-h-screen flex items-center justify-center"
    style={{ background: "#f0f2f7" }}
  >
    <div className="flex flex-col items-center gap-3">
      <div className="w-9 h-9 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
      <p className="text-xs text-slate-400">Loading...</p>
    </div>
  </div>
);

interface ProtectedRouteProps {
  children: ReactNode;
  /** Permission required to view this route. Omit for "any authenticated user". */
  permission?: Permission;
}

const ProtectedRoute = ({ children, permission }: ProtectedRouteProps) => {
  const { token, isBootstrapping, user } = useSelector(selectAuth);

  // "Which dashboard is home" stays role-based 
  let storedRole: "mentor" | "mentee" | null = null;
  if (user?.roles?.includes("mentor")) {
    storedRole = "mentor";
  } else if (user?.roles?.includes("mentee")) {
    storedRole = "mentee";
  }

  // Wait for /auth/refresh to finish before deciding to redirect
  if (isBootstrapping) return <PageLoader />;

  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (user?.isEmailVerified === false) {
    return <Navigate to="/verify-email" state={{ email: user.email, role: storedRole }} replace />;
  }
  if (permission && !hasPermission(user?.roles, permission)) {
    return <Navigate to={storedRole ? `/dashboard/${storedRole}` : "/"} replace />;
  }

  return children;
};

export default ProtectedRoute;