// src/pages/UnifiedLogin.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth, SignIn } from "@clerk/clerk-react"; 
import { useDispatch } from "react-redux";
import { setUser } from "../store/slices/authSlice"; 
import axiosInstance from "../utils/axiosInstance";
import logger from "../utils/logger";
export default function UnifiedLogin() {
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth(); 
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [roles, setRoles] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSignedIn || !user) return;

    const email = user.primaryEmailAddress?.emailAddress;
    if (!email) return;

    setLoading(true);
    const fetchRoles = async () => {
      try {
        const res = await axiosInstance.get("/auth/my-roles", { params: { email } });
        const { roles } = res.data;

        if (roles.length === 0) {
          navigate("/select-role");
        } else if (roles.length === 1) {
          issueTokenAndRedirect(roles[0]);
        } else {
          setRoles(roles);
          setLoading(false);
        }
      } catch {
        navigate("/select-role");
      }
    };
    fetchRoles();
  }, [isSignedIn, user]);

  // ← FIXED: was calling /auth/issue-token (doesn't exist) and storing in localStorage
  // Now calls /auth/clerk-sso (same endpoint SSOSync uses) and dispatches to Redux
  const issueTokenAndRedirect = async (role) => {
    try {
      const clerkToken = await getToken();
      if (!clerkToken) return;

      const res = await axiosInstance.post("/auth/clerk-sso", {
        clerkToken,
        roles: undefined, // existing user — no new roles
        termsAccepted: true, // existing user — already accepted
      });

      if (res.data?.accessToken || res.data?.token) {
        dispatch(
          setUser({
            token: res.data.accessToken || res.data.token,
            user: res.data.user || null,
          }),
        );
      }

      navigate(role === "mentor" ? "/dashboard/mentor" : "/dashboard/mentee");
    } catch (err) {
      logger.error("SSO token issue failed", { err });
    }
  };

  const handleRolePick = (role) => {
    issueTokenAndRedirect(role);
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">
            Welcome
          </h1>
          <SignInEmbed />
        </div>
      </div>
    );
  }

  if (loading || roles === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Signing you in...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-10 rounded-2xl shadow-lg w-full max-w-sm text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Welcome , {user.firstName}!
        </h2>
        <p className="text-gray-500 mb-8">
          You're registered as both a Mentor and Mentee. How would you like to
          continue?
        </p>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => handleRolePick("mentor")}
            className="w-full py-3 px-6 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
          >
            Continue as Mentor
          </button>
          <button
            onClick={() => handleRolePick("mentee")}
            className="w-full py-3 px-6 border-2 border-indigo-600 text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition"
          >
            Continue as Mentee
          </button>
        </div>
      </div>
    </div>
  );
}

function SignInEmbed() {
  return <SignIn routing="hash" fallbackRedirectUrl="/login" />;
}
