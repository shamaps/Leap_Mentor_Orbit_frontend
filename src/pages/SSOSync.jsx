// src/pages/SSOSync.jsx
// Google users are handled entirely in useGoogleAuth.js and never land here.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "../store/slices/authSlice";
import axiosInstance from "../utils/axiosInstance";
import { ssoFlags } from "../utils/storage";

const redirectByRole = (roles, navigate) => {
  if (roles.includes("mentor")) {
    navigate("/dashboard/mentor");
  } else {
    navigate("/dashboard/mentee");
  }
};

const SSOSync = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const reduxToken = useSelector((state) => state.auth.token);
  const reduxUser = useSelector((state) => state.auth.user);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded) return;

    // If we already have a token+user in Redux and Clerk says the user
    // isn't signed in, redirect them away immediately using Redux roles.
    if (reduxToken && !isSignedIn) {
      const role = reduxUser?.roles?.includes("mentor") ? "mentor" : "mentee";
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

        if (!clerkToken) {
          setError("Authentication failed. Please try logging in again.");
          return;
        }

        const flow = ssoFlags.get();
        const role = flow?.role || null;
        const termsAccepted = flow?.termsAccepted ?? false;

        const res = await axiosInstance.post("/auth/clerk-sso", {
          clerkToken,
          roles: role && role !== "existing" ? [role] : undefined,
          termsAccepted: role !== "existing" ? termsAccepted : true,
        });

        // Dispatch into Redux only — HttpOnly cookie is set by backend automatically
        if (res.data?.accessToken || res.data?.token) {
          dispatch(
            setUser({
              token: res.data.accessToken || res.data.token,
              user: res.data.user || null,
            }),
          );
        }

        ssoFlags.clear();

        if (res.data?.isNewUser) {
          const onboardingRole =
            role && role !== "existing" ? role : res.data.user.roles[0];
          navigate(`/onboarding/${onboardingRole}`, { replace: true });
        } else {
          const intendedRole = role && role !== "existing" ? role : null;

          if (intendedRole === "mentee") {
            navigate("/dashboard/mentee", { replace: true });
          } else if (intendedRole === "mentor") {
            navigate("/dashboard/mentor", { replace: true });
          } else {
            redirectByRole(res.data?.user?.roles || [], navigate);
          }
        }
      } catch (err) {
        setError(err?.response?.data?.message || err.message || "SSO failed");
        ssoFlags.clear();
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