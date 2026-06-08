// src/components/auth/RegisterForm.jsx
import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useSignIn, useClerk } from "@clerk/clerk-react";
import useGoogleAuth from "../../hooks/useGoogleAuth";
import { registerUser, clearMessages , setUser } from "../../store/slices/authSlice";
import FullScreenLoader from "@/components/atoms/FullScreenLoader";
import AuthSSOButtons from "./AuthSSOButtons";
import { AuthMessageBanner, AuthDivider, AuthField, AuthBrand } from "./AuthUI";
import { LeapMentorLogo } from "./AuthIcons";
import TermsAndConditionsModal from "../../ui/TermsAndConditionsModal";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const CLERK_STRATEGY = {
  linkedin: "oauth_linkedin_oidc",
  apple: "oauth_apple",
};
// ✅ Password validation rules
const validatePassword = (password) => {
  const rules = [
    { id: "length", label: "At least 8 characters", test: (p) => p.length >= 8 },
    { id: "uppercase", label: "At least 1 uppercase letter", test: (p) => /[A-Z]/.test(p) },
    { id: "number", label: "At least 1 number", test: (p) => /[0-9]/.test(p) },
    { id: "special", label: "At least 1 special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
  ];
  const passed = rules.filter((r) => r.test(password)).length;
  return { rules, passed, total: rules.length };
};

// ✅ Strength label + color based on how many rules passed
const getStrength = (passed) => {
  if (passed <= 1) return { label: "Weak", color: "#ef4444", width: "25%" };
  if (passed === 2) return { label: "Fair", color: "#f59e0b", width: "50%" };
  if (passed === 3) return { label: "Good", color: "#3b82f6", width: "75%" };
  return { label: "Strong", color: "#22c55e", width: "100%" };
};

const RegisterForm = ({ role }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { signOut } = useClerk();
  const { signIn, isLoaded: clerkLoaded } = useSignIn();

  const googleBtnRef = useRef(null);
  const termsAcceptedRef = useRef(true);

  const { loading, error, successMsg } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    name: "", email: "", password: "", termsAccepted: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [localMsg, setLocalMsg] = useState({ type: "", text: "" });
  const [pwTouched, setPwTouched] = useState(false); // ✅ track if user typed in password
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
  if (error) setLocalMsg({ type: "error", text: error });
}, [error, successMsg]);

  useEffect(() => {
    return () => dispatch(clearMessages());
  }, [dispatch]);

  useEffect(() => {
    if (form.termsAccepted && localMsg.text === "Please accept the terms to continue.") {
      setLocalMsg({ type: "", text: "" });
    }
  }, [form.termsAccepted]);

  useGoogleAuth({
    btnRef: googleBtnRef,
    termsAcceptedRef,
    roles: [role],
    dispatch,
    setUser,  
    onSuccess: (data) => {
      setLocalMsg({ type: "success", text: "Google signup successful! Redirecting..." });
      setTimeout(() => navigate(data?.isNewUser ? `/onboarding/${role}` : `/dashboard/${role}`), 700);
    },
    onError: (text) => setLocalMsg({ type: "error", text }),
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "termsAccepted") termsAcceptedRef.current = checked;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleTermsAccept = () => {
    termsAcceptedRef.current = true;
    setForm((prev) => ({ ...prev, termsAccepted: true }));
    setShowTermsModal(false);
    setLocalMsg({ type: "", text: "" });
  };

  const handleTermsClose = () => setShowTermsModal(false);

  const handleClerkSSO = async (provider) => {
    if (!clerkLoaded) return;
    try {
      await signOut({ redirectUrl: window.location.href });
      localStorage.setItem("sso_role", role);
      localStorage.setItem("sso_terms", "true");
      await signIn.authenticateWithRedirect({
        strategy: CLERK_STRATEGY[provider],
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/sso-callback-sync`,
      });
    } catch (err) {
      localStorage.removeItem("sso_role");
      localStorage.removeItem("sso_terms");
      setLocalMsg({ type: "error", text: err.message || "SSO failed. Try again." });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalMsg({ type: "", text: "" });

    if (!form.termsAccepted) return setLocalMsg({ type: "error", text: "Please accept the terms to continue." });

    // ✅ Password validation — block if not all 4 rules pass
    const { passed } = validatePassword(form.password);
    if (passed < 4) {
      setPwTouched(true);
      return setLocalMsg({ type: "error", text: "Please choose a stronger password." });
    }

    const result = await dispatch(registerUser({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      roles: [role],
      termsAccepted: true,
    }));

    if (registerUser.fulfilled.match(result)) {
      const { isNewUser } = result.payload;

      if (!isNewUser) {
        return setLocalMsg({
          type: "error",
          text: "This email is already registered. Please login instead.",
        });
      }
        setRedirecting(true);  
      setTimeout(() => navigate("/verify-email", {
        state: { email: form.email.trim(), role },
      }), 800);
    }
  };

  return (
    <>
        {redirecting && <FullScreenLoader message="Setting up your account..." />} 
      <AuthBrand logo={<LeapMentorLogo />} />

      <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-1.5">
        Register as {role === "mentor" ?   "Mentor" : "Mentee"}
      </h1>
      <p className="text-sm text-slate-500 leading-relaxed mb-6">
        {role === "mentor"
          ? "Create your LeapMentor mentor account to start making an impact."
          : "Create your LeapMentor mentee account to start growing."}
      </p>

{localMsg.type === "error" && <AuthMessageBanner type="error" text={localMsg.text} />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthField
          label="Full Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="John Doe"
          required
        />
        <AuthField
          label="Email Address"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          placeholder="name@company.com"
          required
        />

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => { handleChange(e); setPwTouched(true); }}
              onBlur={() => setPwTouched(true)}
              placeholder="••••••••"
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm text-slate-800 bg-white outline-none focus:border-blue-900 focus:ring-4 focus:ring-blue-50 transition-all duration-150"
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((p) => !p)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-2"
            >
              {showPassword ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>

          {/* ✅ Strength bar + rules checklist — appears after user starts typing */}
          {pwTouched && form.password.length > 0 && (() => {
            const { rules, passed } = validatePassword(form.password);
            const strength = getStrength(passed);
            return (
              <div className="mt-2 flex flex-col gap-2">
                {/* Strength bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div style={{
                      width: strength.width,
                      height: "100%",
                      background: strength.color,
                      borderRadius: "999px",
                      transition: "width 0.3s ease, background 0.3s ease",
                    }} />
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
                {/* Rules checklist */}
                <div className="grid grid-cols-2 gap-1">
                  {rules.map((rule) => (
                    <div key={rule.id} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <span style={{ color: rule.test(form.password) ? "#22c55e" : "#cbd5e1", fontSize: "12px" }}>
                        {rule.test(form.password) ? "✓" : "○"}
                      </span>
                      <span style={{
                        fontSize: "11px",
                        color: rule.test(form.password) ? "#16a34a" : "#94a3b8",
                        fontWeight: rule.test(form.password) ? "600" : "400",
                      }}>
                        {rule.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="termsAccepted"
            name="termsAccepted"
            checked={form.termsAccepted}
            onChange={handleChange}
            className="mt-0.5 w-4 h-4 accent-blue-900 shrink-0 cursor-pointer"
          />
          <label htmlFor="termsAccepted" className="text-sm text-slate-600 leading-relaxed">
            I agree to the{" "}
            <button type="button" onClick={() => setShowTermsModal(true)}
              className="text-blue-900 underline cursor-pointer bg-transparent border-none p-0 text-sm font-normal">
              Terms
            </button>{" "}
            and{" "}
            <button type="button" onClick={() => setShowTermsModal(true)}
              className="text-blue-900 underline cursor-pointer bg-transparent border-none p-0 text-sm font-normal">
              Privacy Policy
            </button>.
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-900 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg py-2.5 mt-1 transition-colors"
        >
          {loading ? (
  <span className="flex items-center justify-center gap-2">
    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
    Creating account…
  </span>
) : "Create Account"}
        </button>
      </form>

      <AuthDivider />

      {/* Google button interceptor */}
      <div className="relative">
        <AuthSSOButtons
          googleBtnRef={googleBtnRef}
          loading={loading}
          clerkLoaded={clerkLoaded}
          onLinkedIn={() => handleClerkSSO("linkedin")}
        />
      </div>

      <p className="text-sm text-slate-500 text-center mt-5">
        Already have an account?{" "}
        <span
          className="text-blue-900 font-semibold cursor-pointer hover:underline"
          onClick={() => navigate("/login")}
        >
          Login
        </span>
      </p>

      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onClose={handleTermsClose}
        onAccept={handleTermsAccept}
        role={role}
        termsAccepted={form.termsAccepted}
      />
    </>
  );
};

export default RegisterForm;
