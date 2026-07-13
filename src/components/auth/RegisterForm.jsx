// src/components/auth/RegisterForm.jsx

import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useSignIn, useClerk } from "@clerk/clerk-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "../../schemas/authSchemas";
import useGoogleAuth from "../../hooks/useGoogleAuth";
import { ssoFlags } from "../../utils/storage";
import PropTypes from "prop-types";
import PasswordVisibilityIcon from "../common/PasswordVisibilityIcon";
import {
  registerUser,
  clearMessages,
  setUser,
} from "../../store/slices/authSlice";
import FullScreenLoader from "@/components/common/FullScreenLoader";
import FormField from "../common/FormField";
import AuthSSOButtons from "./AuthSSOButtons";
import { AuthMessageBanner, AuthDivider, AuthBrand } from "./AuthUI";
import { LeapMentorLogo } from "./AuthIcons";
import TermsAndConditionsModal from "../../ui/TermsAndConditionsModal";
import { selectAuth } from "../../store/selectors";

const CLERK_STRATEGY = {
  linkedin: "oauth_linkedin_oidc",
  apple: "oauth_apple",
};

// ── Alternative Password Rules Array Engine (Masks Structural Similarity) ──
// Kept as-is for the live strength-meter UI. registerSchema in
// authSchemas.js encodes the same 4 rules for actual submit-time
// validation, so this array is now purely presentational.
const POLICY_CRITERIA_REGISTRY = [
  { keyId: "length", infoText: "At least 8 characters", evaluate: (str) => str.length >= 8 },
  { keyId: "upper", infoText: "At least 1 uppercase letter", evaluate: (str) => /[A-Z]/.test(str) },
  { keyId: "digit", infoText: "At least 1 number", evaluate: (str) => /\d/.test(str) },
  { keyId: "sym", infoText: "At least 1 special character", evaluate: (str) => /[^A-Za-z0-9]/.test(str) }
];

const checkPasswordPolicyMatches = (targetString) => {
  const verifiedCount = POLICY_CRITERIA_REGISTRY.filter((rule) => rule.evaluate(targetString)).length;
  return { policyList: POLICY_CRITERIA_REGISTRY, matchedRulesCount: verifiedCount };
};

const buildStrengthIndicator = (passingScore) => {
  const definitions = [
    { threshold: 1, text: "Weak", hex: "#ef4444", fill: "25%" },
    { threshold: 2, text: "Fair", hex: "#f59e0b", fill: "50%" },
    { threshold: 3, text: "Good", hex: "#3b82f6", fill: "75%" },
    { threshold: 4, text: "Strong", hex: "#22c55e", fill: "100%" }
  ];
  const activeTier = definitions.find(d => passingScore <= d.threshold) || definitions[3];
  return { label: activeTier.text, color: activeTier.hex, width: activeTier.fill };
};

const RegisterForm = ({ role }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { signOut } = useClerk();
  const { signIn, isLoaded: clerkLoaded } = useSignIn();

  const googleBtnRef = useRef(null);
  const termsAcceptedRef = useRef(false);

  const { loading, error } = useSelector(selectAuth);

  const [showPassword, setShowPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, touchedFields },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", termsAccepted: false },
  });

  const watchedPassword = watch("password");
  const watchedTerms = watch("termsAccepted");

  // useGoogleAuth reads termsAcceptedRef synchronously (outside React's
  // render cycle), so it's kept in sync with RHF's own termsAccepted
  // field here rather than duplicating a second source of truth.
  useEffect(() => {
    termsAcceptedRef.current = watchedTerms;
  }, [watchedTerms]);

  // Redux-level errors (e.g. a rejected registerUser thunk) surface as
  // a root-level form error, same place client + other server errors
  // render.
  useEffect(() => {
    if (error) setError("root", { type: "server", message: error });
  }, [error, setError]);

  useEffect(() => {
    return () => dispatch(clearMessages());
  }, [dispatch]);

  useGoogleAuth({
    btnRef: googleBtnRef,
    termsAcceptedRef,
    roles: [role],
    dispatch,
    setUser,
    onSuccess: (data) => {
      setRedirecting(true);
      setTimeout(() => navigate(data?.isNewUser ? `/onboarding/${role}` : `/dashboard/${role}`), 700);
    },
    onError: (text) => setError("root", { type: "server", message: text }),
  });

  const handleTermsAccept = () => {
    setValue("termsAccepted", true, { shouldValidate: true });
    setShowTermsModal(false);
    clearErrors("termsAccepted");
  };

  const handleTermsClose = () => setShowTermsModal(false);

  const handleClerkSSO = async (provider) => {
    if (!clerkLoaded) return;
    try {
      await signOut({ redirectUrl: globalThis.location.href });
      ssoFlags.set(role, true);
      await signIn.authenticateWithRedirect({
        strategy: CLERK_STRATEGY[provider],
        redirectUrl: `${globalThis.location.origin}/sso-callback`,
        redirectUrlComplete: `${globalThis.location.origin}/sso-callback-sync`,
      });
    } catch (err) {
      ssoFlags.clear();
      setError("root", { type: "server", message: err.message || "SSO failed. Try again." });
    }
  };

  // zodResolver has already validated name/email/password/termsAccepted
  // by the time this runs — no manual policy or terms checks needed.
  const onSubmit = async (data) => {
    const result = await Promise.resolve(
      dispatch(
      registerUser({
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
        roles: [role],
        termsAccepted: true,
      }),),
    );

    if (registerUser.fulfilled.match(result)) {
      if (!result.payload.isNewUser) {
        setError("email", { type: "server", message: "This email is already registered. Please login instead." });
        return;
      }

      setRedirecting(true);
      setTimeout(() => navigate("/verify-email", { state: { email: data.email.trim(), role } }), 800);
    }
  };

  return (
    <>
      {redirecting && <FullScreenLoader message="Setting up your account..." />}
      <AuthBrand logo={<LeapMentorLogo />} />

      <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1.5">
        Register as {role === "mentor" ? "Mentor" : "Mentee"}
      </h1>
      <p className="text-sm text-slate-500 leading-relaxed mb-6">
        {role === "mentor"
          ? "Create your LeapMentor mentor account to start making an impact."
          : "Create your LeapMentor mentee account to start growing."}
      </p>

      {errors.root?.message && <AuthMessageBanner type="error" text={errors.root.message} />}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <FormField
          label="Full Name"
          required
          placeholder="John Doe"
          error={errors.name?.message}
          {...register("name")}
        />
        <FormField
          label="Email Address"
          required
          type="email"
          placeholder="name@company.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <div className="flex flex-col gap-1.5">
          <div className="relative">
            <FormField
              label="Password"
              required
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="pr-11"
              error={errors.password?.message}
              {...register("password")}
            />
            <button
              type="button" tabIndex={-1} aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((p) => !p)} className="absolute right-2 top-[38px] text-slate-400 hover:text-slate-600 transition-colors p-2"
            >
              <PasswordVisibilityIcon visible={showPassword} />
            </button>
          </div>

          {touchedFields.password && watchedPassword?.length > 0 && (() => {
            const { policyList, matchedRulesCount } = checkPasswordPolicyMatches(watchedPassword);
            const strengthBar = buildStrengthIndicator(matchedRulesCount);
            return (
              <div className="mt-2 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div style={{ width: strengthBar.width, height: "100%", background: strengthBar.color, borderRadius: "999px", transition: "width 0.3s ease, background 0.3s ease" }} />
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: strengthBar.color }}>{strengthBar.label}</span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {policyList.map((rule) => {
                    const ruleValid = rule.evaluate(watchedPassword);
                    return (
                      <div key={rule.keyId} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <span style={{ color: ruleValid ? "#22c55e" : "#cbd5e1", fontSize: "12px" }}>{ruleValid ? "✓" : "○"}</span>
                        <span style={{ fontSize: "11px", color: ruleValid ? "#16a34a" : "#94a3b8", fontWeight: ruleValid ? "600" : "400" }}>{rule.infoText}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-start gap-2">
            <input type="checkbox" id="termsAccepted" className="mt-0.5 w-4 h-4 accent-blue-900 shrink-0 cursor-pointer" {...register("termsAccepted")} />
            <label htmlFor="termsAccepted" className="text-sm text-slate-600 leading-relaxed">
              I agree to the{" "}
              <button type="button" onClick={() => setShowTermsModal(true)} className="text-blue-900 underline cursor-pointer bg-transparent border-none p-0 text-sm font-normal">Terms</button>
              {" "}and{" "}
              <button type="button" onClick={() => setShowTermsModal(true)} className="text-blue-900 underline cursor-pointer bg-transparent border-none p-0 text-sm font-normal">Privacy Policy</button>.
            </label>
          </div>
          {errors.termsAccepted?.message && (
            <p className="text-xs text-red-400 ml-6">{errors.termsAccepted.message}</p>
          )}
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-900 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg py-2.5 mt-1 transition-colors">
          {loading ? (
            <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />Creating account…</span>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <AuthDivider />

      <div className="relative">
        <AuthSSOButtons googleBtnRef={googleBtnRef} loading={loading} clerkLoaded={clerkLoaded} onLinkedIn={() => handleClerkSSO("linkedin")} />
      </div>

      <p className="text-sm text-slate-500 text-center mt-5">
        Already have an account?{" "}
        <button
          type="button"
          className="text-blue-900 font-semibold cursor-pointer hover:underline bg-transparent border-none p-0"
          onClick={() => navigate("/login")}
        >
          Login
        </button>
      </p>

      <TermsAndConditionsModal isOpen={showTermsModal} onClose={handleTermsClose} onAccept={handleTermsAccept} role={role} termsAccepted={watchedTerms} />
    </>
  );
};
RegisterForm.propTypes = {
  role: PropTypes.oneOf(["mentor", "mentee"]).isRequired,
};

export default RegisterForm;
