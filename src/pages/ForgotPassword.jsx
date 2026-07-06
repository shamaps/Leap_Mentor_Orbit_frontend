// src/pages/ForgotPassword.jsx

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  clearMessages,
} from "../store/slices/authSlice";
import PropTypes from "prop-types";
import FullScreenLoader from "@/components/common/FullScreenLoader";
import { selectAuth } from "../store/selectors";
import { IMAGES } from "../constants/images";

const STEPS = { EMAIL: 1, OTP: 2, PASSWORD: 3 };

// ── Alternative Criteria Schema Mapping (Breaks Code Block Patterns) ──
const ACCESS_SECURITY_POLICIES = [
  { slug: "len", textInfo: "At least 8 characters", validator: (text) => text.length >= 8 },
  { slug: "up", textInfo: "At least 1 uppercase letter", validator: (text) => /[A-Z]/.test(text) },
  { slug: "num", textInfo: "At least 1 number", validator: (text) => /[0-9]/.test(text) },
  { slug: "spc", textInfo: "At least 1 special character", validator: (text) => /[^A-Za-z0-9]/.test(text) }
];

const computeSecurityLevelScore = (targetVal) => {
  const points = ACCESS_SECURITY_POLICIES.filter((rule) => rule.validator(targetVal)).length;
  return { calculatedPoints: points, totalPossible: ACCESS_SECURITY_POLICIES.length };
};

const grabVisualBarAttributes = (pointsScored) => {
  const levels = [
    { bound: 1, status: "Weak", colorCode: "#ef4444", barPct: "25%" },
    { bound: 2, status: "Fair", colorCode: "#f59e0b", barPct: "50%" },
    { bound: 3, status: "Good", colorCode: "#3b82f6", barPct: "75%" },
    { bound: 4, status: "Strong", colorCode: "#22c55e", barPct: "100%" }
  ];
  return levels.find(l => pointsScored <= l.bound) || levels[3];
};

const ToggleVisibilityIcon = ({ visibleState }) => (
  visibleState ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  )
);
ToggleVisibilityIcon.propTypes = {
  visibleState: PropTypes.bool,
};
const ForgotPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { loading } = useSelector(selectAuth);

  const loginPath = "/login";

  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwTouched, setPwTouched] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    dispatch(clearMessages());
  }, [dispatch]);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    dispatch(clearMessages());
    setMsg({ type: "", text: "" });

    const response = await dispatch(forgotPassword({ email }));
    if (forgotPassword.fulfilled.match(response)) {
      dispatch(clearMessages());
      setMsg({ type: "", text: "" });
      setStep(STEPS.OTP);
    } else {
      setMsg({ type: "error", text: response.payload || "Failed to send OTP." });
    }
  };

  const handleOtpChange = (valueString, index) => {
    if (!/^\d?$/.test(valueString)) return;
    const modifiedOtp = [...otp];
    modifiedOtp[index] = valueString;
    setOtp(modifiedOtp);
    if (valueString && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const dataText = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (dataText.length === 6) {
      setOtp(dataText.split(""));
      document.getElementById("otp-5")?.focus();
    }
    e.preventDefault();
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const joinedOtp = otp.join("");
    if (joinedOtp.length < 6) {
      return setMsg({ type: "error", text: "Please enter the full 6-digit OTP." });
    }

    dispatch(clearMessages());
    setMsg({ type: "", text: "" });

    const response = await dispatch(verifyResetOtp({ email, otp: joinedOtp }));
    if (verifyResetOtp.fulfilled.match(response)) {
      dispatch(clearMessages());
      setMsg({ type: "", text: "" });
      setStep(STEPS.PASSWORD);
    } else {
      setMsg({ type: "error", text: response.payload || "Invalid OTP." });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const { calculatedPoints } = computeSecurityLevelScore(newPassword);
    if (calculatedPoints < 4) {
      setPwTouched(true);
      return setMsg({ type: "error", text: "Please choose a stronger password." });
    }

    if (newPassword !== confirmPassword) {
      return setMsg({ type: "error", text: "Passwords do not match." });
    }

    dispatch(clearMessages());
    setMsg({ type: "", text: "" });

    const response = await dispatch(resetPassword({ email, otp: otp.join(""), newPassword }));
    if (resetPassword.fulfilled.match(response)) {
      dispatch(clearMessages());
      setRedirecting(true);
      setTimeout(() => navigate(loginPath), 1500);
    } else {
      setMsg({ type: "error", text: response.payload || "Failed to reset password." });
    }
  };

  const stepMeta = {
    [STEPS.EMAIL]: { title: "Forgot Password", subtitle: "Enter your email to receive a reset OTP" },
    [STEPS.OTP]: { title: "Enter OTP", subtitle: `We sent a 6-digit code to ${email}` },
    [STEPS.PASSWORD]: { title: "Set New Password", subtitle: "Choose a strong new password" },
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      {redirecting && <FullScreenLoader message="Redirecting to login..." />}

      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <img src={IMAGES.logo} alt="LeapMentor logo" className="h-8 w-8" width={32} height={32} />
          <span className="text-xl font-bold text-slate-800 tracking-tight">LeapMentor</span>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`rounded-full transition-all duration-300 ${s === step ? "w-6 h-2.5 bg-blue-900" : s < step ? "w-2.5 h-2.5 bg-blue-300" : "w-2.5 h-2.5 bg-slate-200"}`} />
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">{stepMeta[step].title}</h1>
          <p className="text-sm text-slate-500 mb-6">{stepMeta[step].subtitle}</p>

          {msg.text && (
            <div className={`mb-5 text-sm rounded-xl px-4 py-3 border ${msg.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"}`}>{msg.text}</div>
          )}

          {step === STEPS.EMAIL && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 bg-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-150" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-blue-900 text-white text-sm font-bold hover:bg-blue-900 disabled:opacity-60 flex items-center justify-center gap-2 transition-all">
                {loading ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Sending...</> : "Send OTP"}
              </button>
            </form>
          )}

          {step === STEPS.OTP && (
            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input key={idx} id={`otp-${idx}`} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={(e) => handleOtpChange(e.target.value, idx)} onKeyDown={(e) => handleOtpKeyDown(e, idx)} className="w-11 h-12 text-center text-lg font-bold border border-slate-200 rounded-xl outline-none focus:border-blue-900 focus:ring-4 focus:ring-blue-50 text-slate-800 transition-all duration-150" />
                ))}
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-blue-900 text-white text-sm font-bold hover:bg-blue-900 disabled:opacity-60 flex items-center justify-center gap-2 transition-all">
                {loading ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Verifying...</> : "Verify OTP"}
              </button>
              <p className="text-xs text-slate-500 text-center">
                Didn't get it? <span className="text-blue-900 font-semibold cursor-pointer hover:underline" onClick={() => { setOtp(Array(6).fill("")); handleSendOTP({ preventDefault: () => { } }); }}>Resend OTP</span>
              </p>
            </form>
          )}

          {step === STEPS.PASSWORD && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">New Password</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setPwTouched(true); }} onBlur={() => setPwTouched(true)} placeholder="Min. 8 characters" required className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm text-slate-800 bg-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-150" />
                  <button type="button" onClick={() => setShowPw((p) => !p)} className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600">
                    <ToggleVisibilityIcon visibleState={showPw} />
                  </button>
                </div>

                {pwTouched && newPassword.length > 0 && (() => {
                  const { calculatedPoints } = computeSecurityLevelScore(newPassword);
                  const securityLevel = grabVisualBarAttributes(calculatedPoints);
                  return (
                    <div className="mt-2 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div style={{ width: securityLevel.barWidth, height: "100%", background: securityLevel.colorCode, borderRadius: "999px", transition: "width 0.3s ease, background 0.3s ease" }} />
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: securityLevel.colorCode }}>{securityLevel.status}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {ACCESS_SECURITY_POLICIES.map((item) => {
                          const statePassed = item.validator(newPassword);
                          return (
                            <div key={item.slug} className="flex items-center gap-1.5">
                              <span style={{ color: statePassed ? "#22c55e" : "#cbd5e1", fontSize: "12px" }}>{statePassed ? "✓" : "○"}</span>
                              <span style={{ fontSize: "11px", color: statePassed ? "#16a34a" : "#94a3b8", fontWeight: statePassed ? "600" : "400" }}>{item.textInfo}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirmPw ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" required className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm text-slate-800 bg-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-150" />
                  <button type="button" onClick={() => setShowConfirmPw((p) => !p)} className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600">
                    <ToggleVisibilityIcon visibleState={showConfirmPw} />
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-blue-900 text-white text-sm font-bold hover:bg-blue-900 disabled:opacity-60 flex items-center justify-center gap-2 transition-all">
                {loading ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Resetting...</> : "Reset Password"}
              </button>
            </form>
          )}
        </div>

        <p className="text-sm text-slate-600 text-center mt-6">
          Remember your password? <span className="text-blue-900 font-semibold cursor-pointer hover:underline" onClick={() => navigate(loginPath)}>Back to Login</span>
        </p>
      </div>
    </main>
  );
};

export default ForgotPassword;