// src/pages/SSOCallback.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux"; // ✅ ADDED
import { setUser } from "../store/slices/authSlice"; // ✅ ADDED
import { AuthenticateWithRedirectCallback, useAuth } from "@clerk/clerk-react";
import axiosInstance from "../utils/axiosInstance";

const redirectByRole = (roles, navigate) => {
  if (roles.includes("mentor")) {
    localStorage.setItem("role", "mentor");
    navigate("/dashboard/mentor");
  } else {
    localStorage.setItem("role", "mentee");
    navigate("/dashboard/mentee");
  }
};

// ── Inner component — only runs AFTER Clerk finishes OAuth ──
const SyncWithBackend = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch(); // ✅ ADDED
  const [error, setError] = useState("");

  useEffect(() => {
    const sync = async () => {
      try {
        const clerkToken = await getToken();
        console.log("✅ Clerk token:", clerkToken ? "YES" : "NO");

        const role = localStorage.getItem("sso_role");
        const termsAccepted = localStorage.getItem("sso_terms") === "true";
        console.log("Role:", role);

        const res = await axiosInstance.post("/auth/clerk-sso", {
          clerkToken,
          roles: role && role !== "existing" ? [role] : undefined,
          termsAccepted: role !== "existing" ? termsAccepted : true,
        });

        console.log("✅ Backend response:", res.data);

        // ✅ FIXED: was localStorage.setItem("token", res.data.token)
        // Token is now in the HttpOnly cookie set by the backend.
        // We only dispatch into Redux memory — never store in localStorage.
        if (res.data?.accessToken || res.data?.token) {
          dispatch(
            setUser({
              token: res.data.accessToken || res.data.token,
              user: res.data.user || null,
            }),
          );
        }

        localStorage.removeItem("sso_role");
        localStorage.removeItem("sso_terms");

        if (res.data?.isNewUser) {
          const onboardingRole =
            role && role !== "existing" ? role : res.data.user.roles[0];
          navigate(`/onboarding/${onboardingRole}`);
        } else {
          redirectByRole(res.data?.user?.roles || [], navigate);
        }
      } catch (err) {
        console.error("❌ Error:", err?.response?.data || err.message);
        setError(err?.response?.data?.message || err.message || "SSO failed");
        localStorage.removeItem("sso_role");
        localStorage.removeItem("sso_terms");
      }
    };

    sync();
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            className="mt-4 underline text-sm"
            onClick={() => navigate("/login")}
          >
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500 text-sm">Completing sign in...</p>
    </div>
  );
};

// ── Main component — AuthenticateWithRedirectCallback finishes
//    the OAuth handshake, THEN renders SyncWithBackend ──
const SSOCallback = () => {
  return (
    <AuthenticateWithRedirectCallback
      afterSignInUrl="/sso-callback-sync"
      afterSignUpUrl="/sso-callback-sync"
    />
  );
};

export default SSOCallback;
