// src/components/auth/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectAuth } from "../../store/selectors";
import PropTypes from "prop-types";
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

const ProtectedRoute = ({ children, role }) => {
  const { token, isBootstrapping, user } = useSelector(selectAuth);
  let storedRole = null;
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
  if (role && storedRole && storedRole !== role) {
    return <Navigate to={`/dashboard/${storedRole}`} replace />;
  }

  return children;
};
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  role: PropTypes.oneOf(["mentor", "mentee"]),
};
export default ProtectedRoute;
