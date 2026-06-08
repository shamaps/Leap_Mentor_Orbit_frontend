// src/components/auth/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#f0f2f7" }}>
        <div className="flex flex-col items-center gap-3">
            <div className="w-9 h-9 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
            <p className="text-xs text-slate-400">Loading...</p>
        </div>
    </div>
);

const ProtectedRoute = ({ children, role }) => {
    const { token, isBootstrapping} = useSelector((state) => state.auth);
    const storedRole = localStorage.getItem("role");

    // Wait for /auth/refresh to finish before deciding to redirect
    if (isBootstrapping) return <PageLoader />;

    if (!token) {
        const redirectTo = role === "mentor"
            ? "/login/mentor"
            : role === "mentee"
                ? "/login/mentee"
                : "/login";
        return <Navigate to={redirectTo} replace />;
    }

    if (role && storedRole && storedRole !== role) {
        return <Navigate to={`/dashboard/${storedRole}`} replace />;
    }

    return children;
};

export default ProtectedRoute;