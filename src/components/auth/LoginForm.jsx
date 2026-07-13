// src/components/auth/LoginForm.jsx

import { useRef, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch } from "react-redux";
import { loginUser, setUser } from "../../store/slices/authSlice";
import { useNavigate } from "react-router-dom";
import { useSignIn, useClerk } from "@clerk/clerk-react";
import { HTTP_STATUS } from "../../constants/httpStatus";
import useGoogleAuth from "../../hooks/useGoogleAuth";
import AuthSSOButtons from "./AuthSSOButtons";
import { AuthBrand } from "./AuthUI";
import { LeapMentorLogo } from "./AuthIcons";
import { ssoFlags } from "../../utils/storage";
import FullScreenLoader from "@/components/common/FullScreenLoader";
import FormField from "../common/FormField";
import getErrorMessage from "../../utils/getErrorMessage";
import { loginSchema } from "../../schemas/authSchemas";
import { mapServerErrorsToForm } from "../../utils/mapServerErrorsToForm";
import PropTypes from "prop-types";
import PasswordVisibilityIcon from "@/components/common/PasswordVisibilityIcon";
const CLERK_STRATEGY = {
  linkedin: "oauth_linkedin_oidc",
};

const LoginForm = ({ placeholder, registerPath }) => {
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);
  const { signIn, isLoaded: clerkLoaded } = useSignIn();
  const { signOut } = useClerk();
  const dispatch = useDispatch();

  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    return () => setLoading(false);
  }, []);

  // ── Abstracted Role Router (Clears Mechanical Matching Blocks) ──
  const dispatchDashboardRedirection = (assignedRoles) => {
    const roleTargets = {
      mentor: "/dashboard/mentor",
      mentee: "/dashboard/mentee"
    };

    const targetRole = assignedRoles.find(role => roleTargets[role]);

    if (targetRole) {
      setRedirecting(true);
      setTimeout(() => navigate(roleTargets[targetRole]), 800);
    } else {
      setError("root", { type: "server", message: "No role found. Please register first." });
    }
  };

  const handlePostAuth = (token, user) => {
    dispatchDashboardRedirection(user?.roles || []);
  };

  useGoogleAuth({
    btnRef: googleBtnRef,
    roles: [],
    dispatch,
    setUser,
    onSuccess: (data) => handlePostAuth(data?.token, data?.user),
    onError: (text) => setError("root", { type: "server", message: text }),
    onLoadingChange: setLoading,
  });

  const handleClerkSSO = async (provider) => {
    if (!clerkLoaded) return;
    try {
      setLoading(true);
      await signOut({ Url: globalThis.location.href });
      ssoFlags.set("existing", true);
      await signIn.authenticateWithRedirect({
        strategy: CLERK_STRATEGY[provider],
        redirectUrl: `${globalThis.location.origin}/sso-callback`,
        redirectUrlComplete: `${globalThis.location.origin}/sso-callback-sync`,
      });
    } catch (err) {
      ssoFlags.clear();
      setError("root", { type: "server", message: getErrorMessage(err, "SSO failed. Try again.") });
      setLoading(false);
    }
  };

  // Called by react-hook-form only after zodResolver has already
  // validated `data` against loginSchema — no manual field checks
  // needed here anymore.
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await Promise.resolve(dispatch(loginUser({ email: data.email.trim(), password: data.password })));

      if (loginUser.fulfilled.match(res)) {
        handlePostAuth(res.payload?.accessToken, res.payload?.user);
      } else {
        setError("password", { type: "server", message: res.payload || "Invalid email or password." });
      }
    } catch (err) {
      const responseStatus = err?.response?.status;
      const responseData = err?.response?.data;

      if (responseStatus === HTTP_STATUS.FORBIDDEN && responseData?.isEmailVerified === false) {
        setError("root", { type: "server", message: "Please verify your email first. Redirecting..." });
        setTimeout(() => navigate(`/verify-email?email=${encodeURIComponent(responseData.email)}`), 1000);
        return;
      }

      if (responseStatus === HTTP_STATUS.UNAUTHORIZED) {
        setError("password", { type: "server", message: "Invalid email or password." });
        return;
      }

      // Falls back to a generic root-level message for anything else
      // (500s, network errors), same as the pre-migration behavior,
      // but field-specific errors (e.g. { errors: { email: "..." } })
      // now get mapped inline automatically if the backend sends them.
      mapServerErrorsToForm(err, setError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto px-4">
      {redirecting && <FullScreenLoader message="Redirecting to dashboard..." />}

      <AuthBrand logo={<LeapMentorLogo />} />
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1.5">Login</h1>
        <h2 className="text-sm text-slate-500 leading-relaxed mb-6">Enter your credentials to securely access your account.</h2>
      </div>

      {errors.root?.message && (
        <div className="mb-5 text-sm rounded-xl px-4 py-3 border bg-red-50 text-red-600 border-red-200">{errors.root.message}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormField
          label="Email Address"
          required
          type="email"
          placeholder={placeholder || "you@example.com"}
          error={errors.email?.message}
          {...register("email")}
        />

        <div>
          <div className="relative">
            <FormField
              label="Password"
              required
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              className="pr-11"
              error={errors.password?.message}
              endIcon={
                <button
                  type="button"
                  onClick={() => setShowPw((prev) => !prev)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-2"
                >
                  <PasswordVisibilityIcon visible={showPw} />
                </button>
              }
              {...register("password")}
            />
          </div>
          <div className="text-right mt-1.5">
            <button
              type="button"
              onClick={() => navigate("/forgot-password")}
              className="text-xs text-blue-900 font-semibold cursor-pointer hover:underline bg-transparent border-none p-0"
            >
              Forgot password? Click here
            </button>
          </div>
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full py-3 rounded-xl bg-blue-900 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 shadow-sm shadow-blue-200 flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Logging in...</>
          ) : (
            <>
              Login to Dashboard
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </>
          )}
        </button>
      </form>

      <div className="flex items-center gap-3 my-6">
        <div className="h-px bg-slate-200 flex-1" />
        <span className="text-xs font-semibold text-slate-700 font-medium">Or continue with</span>
        <div className="h-px bg-slate-200 flex-1" />
      </div>

      <AuthSSOButtons googleBtnRef={googleBtnRef} loading={loading} clerkLoaded={clerkLoaded} onLinkedIn={() => handleClerkSSO("linkedin")} />

      <p className="text-sm text-slate-500 text-center mt-8">
        Don't have an account?{" "}
        <button
          type="button"
          className="text-blue-900 font-semibold cursor-pointer hover:underline bg-transparent border-none p-0"
          onClick={() => navigate(registerPath || "/register/mentee")}
        >
          Register here
        </button>
      </p>
    </div>
  );
};
LoginForm.propTypes = {
  placeholder: PropTypes.string,
  registerPath: PropTypes.string,
};
export default LoginForm;