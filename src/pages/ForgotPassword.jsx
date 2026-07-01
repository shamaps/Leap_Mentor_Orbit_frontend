// src/pages/ForgotPassword.jsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { forgotPassword, verifyResetOtp, resetPassword, clearMessages } from "../store/slices/authSlice";
import FullScreenLoader from "@/components/common/FullScreenLoader";
import { selectAuth} from "../store/selectors";

// ── Steps: 1 = enter email, 2 = enter OTP, 3 = new password ──
const STEPS = { EMAIL: 1, OTP: 2, PASSWORD: 3 };

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

const getStrength = (passed) => {
  if (passed <= 1) return { label: "Weak", color: "#ef4444", width: "25%" };
  if (passed === 2) return { label: "Fair", color: "#f59e0b", width: "50%" };
  if (passed === 3) return { label: "Good", color: "#3b82f6", width: "75%" };
  return { label: "Strong", color: "#22c55e", width: "100%" };
};

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { loading } = useSelector(selectAuth);

  const role = searchParams.get("role") || "mentor";
  const loginPath = role === "mentee" ? "/login" : "/login";

  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwTouched, setPwTouched] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    dispatch(clearMessages());
  }, []);

  // ── Step 1 — Send OTP ─────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    dispatch(clearMessages());
    setMsg({ type: "", text: "" });
    const action = await dispatch(forgotPassword({ email }));
   if (forgotPassword.fulfilled.match(action)) {
  dispatch(clearMessages());
  setMsg({ type: "", text: "" });
  setStep(STEPS.OTP);
}else {
      setMsg({ type: "error", text: action.payload || "Failed to send OTP." });
    }
  };

  // ── OTP box helpers ───────────────────────────────────────
  const handleOtpChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      document.getElementById("otp-5")?.focus();
    }
    e.preventDefault();
  };

  // ── Step 2 — Verify OTP ───────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpStr = otp.join("");
    if (otpStr.length < 6) {
      return setMsg({ type: "error", text: "Please enter the full 6-digit OTP." });
    }
    dispatch(clearMessages());
    setMsg({ type: "", text: "" });
    const action = await dispatch(verifyResetOtp({ email, otp: otpStr }));
    if (verifyResetOtp.fulfilled.match(action)) {
  dispatch(clearMessages());
  setMsg({ type: "", text: "" });
  setStep(STEPS.PASSWORD);
}else {
      setMsg({ type: "error", text: action.payload || "Invalid OTP." });
    }
  };

  // ── Step 3 — Reset Password ───────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    const { passed } = validatePassword(newPassword);
    if (passed < 4) {
      setPwTouched(true);
      return setMsg({ type: "error", text: "Please choose a stronger password." });
    }
    if (newPassword !== confirmPassword) {
      return setMsg({ type: "error", text: "Passwords do not match." });
    }
    dispatch(clearMessages());
    setMsg({ type: "", text: "" });
    const action = await dispatch(resetPassword({ email, otp: otp.join(""), newPassword }));
    if (resetPassword.fulfilled.match(action)) {
  dispatch(clearMessages());
  setRedirecting(true);
  setTimeout(() => navigate(loginPath), 1500);
}else {
      setMsg({ type: "error", text: action.payload || "Failed to reset password." });
    }
  };

  // ── Step labels ───────────────────────────────────────────
  const stepMeta = {
    [STEPS.EMAIL]: { title: "Forgot Password", subtitle: "Enter your email to receive a reset OTP" },
    [STEPS.OTP]: { title: "Enter OTP", subtitle: `We sent a 6-digit code to ${email}` },
    [STEPS.PASSWORD]: { title: "Set New Password", subtitle: "Choose a strong new password" },
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        {redirecting && <FullScreenLoader message="Redirecting to login..." />}

      <div className="w-full max-w-sm">

        {/* ── Logo ── */}
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <img
            src="/images/logo.webp"
            alt="LeapMentor logo"
            className="h-8 w-8"
            width={32}
            height={32}
          />
          <span className="text-xl font-bold text-slate-800 tracking-tight">LeapMentor</span>
        </div>

        {/* ── Step progress dots ── */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`rounded-full transition-all duration-300 ${s === step ? "w-6 h-2.5 bg-blue-900" : s < step ? "w-2.5 h-2.5 bg-blue-300" : "w-2.5 h-2.5 bg-slate-200"
              }`} />
          ))}
        </div>

        {/* ── Card ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">
            {stepMeta[step].title}
          </h1>
          <p className="text-sm text-slate-500 mb-6">{stepMeta[step].subtitle}</p>

          {/* Message banner */}
          {msg.text && (
            <div className={`mb-5 text-sm rounded-xl px-4 py-3 border ${msg.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-red-50 text-red-600 border-red-200"
              }`}>
              {msg.text}
            </div>
          )}

          {/* ── STEP 1: Email ── */}
          {step === STEPS.EMAIL && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 bg-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-150"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-900 text-white text-sm font-bold hover:bg-blue-900 disabled:opacity-60 transition-all flex items-center justify-center gap-2">
                {loading
                  ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Sending...</>
                  : "Send OTP"}
              </button>
            </form>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === STEPS.OTP && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    className="w-11 h-12 text-center text-lg font-bold border border-slate-200 rounded-xl outline-none focus:border-blue-900 focus:ring-4 focus:ring-blue-50 transition-all duration-150 text-slate-800"
                  />
                ))}
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-900 text-white text-sm font-bold hover:bg-blue-900 disabled:opacity-60 transition-all flex items-center justify-center gap-2">
                {loading
                  ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Verifying...</>
                  : "Verify OTP"}
              </button>
              <p className="text-xs text-slate-500 text-center">
                Didn't get it?{" "}
                <span className="text-blue-900 font-semibold cursor-pointer hover:underline"
                  onClick={() => { setOtp(["", "", "", "", "", ""]); handleSendOTP({ preventDefault: () => { } }); }}>
                  Resend OTP
                </span>
              </p>
            </form>
          )}

          {/* ── STEP 3: New Password ── */}
          {step === STEPS.PASSWORD && (
            <form onSubmit={handleResetPassword} className="space-y-4">

              {/* New Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => { setNewPassword(e.target.value); setPwTouched(true); }}
                    onBlur={() => setPwTouched(true)}
                    placeholder="Min. 8 characters"
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm text-slate-800 bg-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-150"
                  />
                  <button type="button" onClick={() => setShowPw((p) => !p)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600">
                    {showPw ? (
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
                </div>{/* ← relative closes here */}

                {/* Strength bar — outside relative, inside New Password div */}
                {pwTouched && newPassword.length > 0 && (() => {
                  const { rules, passed } = validatePassword(newPassword);
                  const strength = getStrength(passed);
                  return (
                    <div className="mt-2 flex flex-col gap-2">
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
                      <div className="grid grid-cols-2 gap-1">
                        {rules.map((rule) => (
                          <div key={rule.id} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <span style={{ color: rule.test(newPassword) ? "#22c55e" : "#cbd5e1", fontSize: "12px" }}>
                              {rule.test(newPassword) ? "✓" : "○"}
                            </span>
                            <span style={{
                              fontSize: "11px",
                              color: rule.test(newPassword) ? "#16a34a" : "#94a3b8",
                              fontWeight: rule.test(newPassword) ? "600" : "400",
                            }}>
                              {rule.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>{/* ← New Password div closes here */}

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm text-slate-800 bg-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-150"
                  />
                  <button type="button" onClick={() => setShowConfirmPw((p) => !p)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600">
                    {showConfirmPw ? (
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
              </div>{/* ← Confirm Password div closes here */}

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl bg-blue-900 text-white text-sm font-bold hover:bg-blue-900 disabled:opacity-60 transition-all flex items-center justify-center gap-2">
                {loading
                  ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Resetting...</>
                  : "Reset Password"}
              </button>
            </form>
          )}
        </div>

        {/* Back to login */}
        <p className="text-sm text-slate-600 text-center mt-6">
          Remember your password?{" "}
          <span className="text-blue-900 font-semibold cursor-pointer hover:underline"
            onClick={() => navigate(loginPath)}>
            Back to Login
          </span>
        </p>
      </div>
    </main>
  );
};

export default ForgotPassword;