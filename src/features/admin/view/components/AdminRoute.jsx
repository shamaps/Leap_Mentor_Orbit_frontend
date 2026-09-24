// src/features/admin/view/components/AdminRoute.jsx
// Wraps admin pages — redirects to /admin/login if no valid session

import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
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

const AdminRoute = ({ children }) => {
  const status = useAdminSession();

  if (status === "checking") return <PageLoader />;
  if (status === "denied") return <Navigate to="/admin/login" replace />;
  return children;
};
AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
export default AdminRoute;
