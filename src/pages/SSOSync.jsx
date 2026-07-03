// src/pages/SSOSync.jsx
// Google users are handled entirely in useGoogleAuth.js and never land here.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useDispatch, useSelector } from "react-redux"; // ✅ ADDED useSelector
import { setUser } from "../store/slices/authSlice";
import axiosInstance from "../utils/axiosInstance"; // ✅ FIXED: was "../../utils/axiosInstance" (wrong path)

const redirectByRole = (roles, navigate) => {
  if (roles.includes("mentor")) {
    localStorage.setItem("role", "mentor");
    navigate("/dashboard/mentor");
  } else {
    localStorage.setItem("role", "mentee");
    navigate("/dashboard/mentee");
  }
};

const SSOSync = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const reduxToken = useSelector((state) => state.auth.token); // ✅ FIXED: replaces localStorage.getItem("token")
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded) return;

    // ✅ FIXED: was localStorage.getItem("token") — now reads from Redux.
    // If we already have a token in Redux (e.g. Google SSO set it) and
    // Clerk says the user isn't signed in, redirect them away immediately.
    if (reduxToken && !isSignedIn) {
      const role = localStorage.getItem("role");
      navigate(role === "mentor" ? "/dashboard/mentor" : "/dashboard/mentee", {
        replace: true,
      });
      return;
    }

    if (!isSignedIn) {
      navigate("/login?error=sso_failed", { replace: true });
      return;
    }

    const sync = async () => {
      try {
        const clerkToken = await getToken();

        // ✅ If Clerk token is null, don't hit the backend — it will fail
        if (!clerkToken) {
          setError("Authentication failed. Please try logging in again.");
          return;
        }

        const role = localStorage.getItem("sso_role");
        const termsAccepted = localStorage.getItem("sso_terms") === "true";

        const res = await axiosInstance.post("/auth/clerk-sso", {
          clerkToken,
          roles: role && role !== "existing" ? [role] : undefined,
          termsAccepted: role !== "existing" ? termsAccepted : true,
        });

        // ✅ FIXED: was localStorage.setItem("token", res.data.token)
        // Dispatch into Redux only — HttpOnly cookie is set by backend automatically
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
          navigate(`/onboarding/${onboardingRole}`, { replace: true });
        } else {
          const intendedRole = role && role !== "existing" ? role : null;

          if (intendedRole === "mentee") {
            localStorage.setItem("role", "mentee");
            navigate("/dashboard/mentee", { replace: true });
          } else if (intendedRole === "mentor") {
            localStorage.setItem("role", "mentor");
            navigate("/dashboard/mentor", { replace: true });
          } else {
            redirectByRole(res.data?.user?.roles || [], navigate);
          }
        }
      } catch (err) {
        setError(err?.response?.data?.message || err.message || "SSO failed");
        localStorage.removeItem("sso_role");
        localStorage.removeItem("sso_terms");
      }
    };

    sync();
  }, [isLoaded, isSignedIn]);

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

export default SSOSync;
