// src/components/admin/AdminRoute.jsx
// Wraps admin pages — redirects to /admin/login if no valid session

import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import adminAxiosInstance from "../../utils/axiosInstance";
import PropTypes from "prop-types";
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
 
  const [status, setStatus] = useState("checking"); // "checking" | "allowed" | "denied"

  useEffect(() => {
    const verifySession = async () => {
      try {
        await adminAxiosInstance.get("/admin/auth/me");
        setStatus("allowed");
      } catch {
        setStatus("denied");
      }
    };
    verifySession();
  }, []);

  if (status === "checking") return <PageLoader />;
  if (status === "denied") return <Navigate to="/admin/login" replace />;
  return children;
};
AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
export default AdminRoute;
