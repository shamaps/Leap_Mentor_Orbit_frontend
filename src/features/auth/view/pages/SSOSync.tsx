// src/pages/SSOSync.tsx
// Google users are handled entirely in useGoogleAuth.js and never land here.

import { useEffect, useState } from "react";
import { useNavigate, type NavigateFunction } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { selectAuthToken, selectAuthUser } from "@/app/store/selectors";
import type { AuthUser } from "@/app/store/slices/authSlice";
import { setUser } from "@/app/store/slices/authSlice";
import { clerkSsoSync } from "@/features/auth/model/auth.api";
import { ssoFlags } from "@/shared/utils/storage";
import getErrorMessage from "@/shared/utils/getErrorMessage";

interface ClerkSsoSyncData {
  accessToken?: string | null;
  token?: string | null;
  isNewUser?: boolean;
  user?: AuthUser | null;
}

const redirectByRole = (roles: string[], navigate: NavigateFunction) => {
  if (roles.includes("mentor")) {
    navigate("/dashboard/mentor");
  } else {
    navigate("/dashboard/mentee");
  }
};

const navigateAfterSync = (resData: ClerkSsoSyncData, role: string | null, navigate: NavigateFunction) => {
  const intendedRole = role && role !== "existing" ? role : null;

  if (resData?.isNewUser) {
    const onboardingRole = intendedRole || resData.user?.roles?.[0] || "mentee";
    navigate(`/onboarding/${onboardingRole}`, { replace: true });
    return;
  }

  if (intendedRole === "mentee") {
    navigate("/dashboard/mentee", { replace: true });
  } else if (intendedRole === "mentor") {
    navigate("/dashboard/mentor", { replace: true });
  } else {
    redirectByRole(resData?.user?.roles || [], navigate);
  }
};

const SSOSync = () => {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const reduxToken = useAppSelector(selectAuthToken);
  const reduxUser = useAppSelector(selectAuthUser);
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

        const res = await clerkSsoSync(
          clerkToken,
          role && role !== "existing" ? [role] : [],
          role === "existing" ? true : termsAccepted,
        );

        const responseData = res.data as ClerkSsoSyncData;

        // Dispatch into Redux only — HttpOnly cookie is set by backend automatically
        const token = responseData.accessToken ?? responseData.token;
        if (token) {
          dispatch(
            setUser({
              token,
              user: responseData.user ?? null,
            }),
          );
        }

        ssoFlags.clear();
        navigateAfterSync(responseData, role, navigate);
      } catch (err: unknown) {
        setError(getErrorMessage(err, "SSO failed"));
        ssoFlags.clear();
      }
    };

    sync();
  }, [dispatch, getToken, isLoaded, isSignedIn, navigate, reduxToken, reduxUser?.roles]);

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