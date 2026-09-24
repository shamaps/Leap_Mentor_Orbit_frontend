// src/pages/SSOCallback.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUser } from "@/app/store/slices/authSlice";
import { AuthenticateWithRedirectCallback, useAuth } from "@clerk/clerk-react";
import { clerkSsoSync } from "@/features/auth/model/auth.api";
import logger from "@/shared/utils/logger";
import { ssoFlags } from "@/shared/utils/storage";

const redirectByRole = (roles, navigate) => {
  if (roles.includes("mentor")) {
    navigate("/dashboard/mentor");
  } else {
    navigate("/dashboard/mentee");
  }
};

// ── Inner component — only runs AFTER Clerk finishes OAuth ──
export const SyncWithBackend = () => {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [error, setError] = useState("");

  useEffect(() => {
    const sync = async () => {
      try {
        const clerkToken = await getToken();
        logger.debug("Clerk token retrieved", { hasToken: Boolean(clerkToken) });
        const flow = ssoFlags.get();
        const role = flow?.role || null;
        const termsAccepted = flow?.termsAccepted ?? false;
        logger.debug("SSO role resolved", { role });

        const res = await clerkSsoSync(
          clerkToken,
          role && role !== "existing" ? [role] : undefined,
          role === "existing" ? true : termsAccepted,
        );

        logger.info("SSO backend sync succeeded", {
          isNewUser: res.data?.isNewUser,
          hasUser: Boolean(res.data?.user),
        });

        // Token is in the HttpOnly cookie set by the backend.
        // We only dispatch into Redux memory — never store in localStorage.
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
          navigate(`/onboarding/${onboardingRole}`);
        } else {
          redirectByRole(res.data?.user?.roles || [], navigate);
        }
      } catch (err) {
        logger.error("SSO sync failed", {
          status: err?.response?.status,
          message: err?.response?.data?.message || err.message,
        });
        setError(err?.response?.data?.message || err.message || "SSO failed");
        ssoFlags.clear();
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
      signInFallbackRedirectUrl="/sso-callback-sync"
      signUpFallbackRedirectUrl="/sso-callback-sync"
    />
  );
};


export default SSOCallback;