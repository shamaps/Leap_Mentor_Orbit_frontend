// src/pages/ForgotPassword.jsx

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  clearMessages,
} from "@/app/store/slices/authSlice";
import FullScreenLoader from "@/shared/components/FullScreenLoader";
import { selectAuth } from "@/app/store/selectors";
import { IMAGES } from "@/shared/constants/images";
import { forgotPasswordSchema, otpStepSchema, newPasswordStepSchema } from "@/shared/schemas/authSchemas";
import PasswordVisibilityIcon from "@/shared/components/PasswordVisibilityIcon";
const STEPS = { EMAIL: 1, OTP: 2, PASSWORD: 3 };

// ── Alternative Criteria Schema Mapping (Breaks Code Block Patterns) ──
// Kept for the live strength-meter UI; newPasswordStepSchema in
// authSchemas.js encodes the same 4 rules for actual submit validation.
const ACCESS_SECURITY_POLICIES = [
  { slug: "len", textInfo: "At least 8 characters", validator: (text) => text.length >= 8 },
  { slug: "up", textInfo: "At least 1 uppercase letter", validator: (text) => /[A-Z]/.test(text) },
  { slug: "num", textInfo: "At least 1 number", validator: (text) => /\d/.test(text) },
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

const ForgotPassword = () => {
  const navigate = useNavigate();
  useSearchParams();
  const dispatch = useDispatch();
  const { loading } = useSelector(selectAuth);

  const loginPath = "/login";

  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const OTP_INPUT_KEYS = ["otp-box-0", "otp-box-1", "otp-box-2", "otp-box-3", "otp-box-4", "otp-box-5"];
  // Three independent forms, one per step — only one is ever mounted
  // at a time, so there's no need for a single combined schema.
  const emailForm = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const otpForm = useForm({
    resolver: zodResolver(otpStepSchema),
    defaultValues: { otp: "" },
  });

  const passwordForm = useForm({
    resolver: zodResolver(newPasswordStepSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  const watchedNewPassword = passwordForm.watch("newPassword");

  useEffect(() => {
    dispatch(clearMessages());
  }, [dispatch]);

  const handleSendOTP = async (data) => {
    dispatch(clearMessages());
    emailForm.clearErrors("root");

    const response = await Promise.resolve(dispatch(forgotPassword({ email: data.email })));
    if (forgotPassword.fulfilled.match(response)) {
      setEmail(data.email);
      dispatch(clearMessages());
      setStep(STEPS.OTP);
    } else {
      emailForm.setError("root", { type: "server", message: response.payload || "Failed to send OTP." });
    }
  };

  const handleResendOtp = () => {
    setOtp(new Array(6).fill(""));
    otpForm.setValue("otp", "");
    handleSendOTP({ email });
  };

  const handleOtpChange = (valueString, index) => {
    if (!/^\d?$/.test(valueString)) return;
    const modifiedOtp = [...otp];
    modifiedOtp[index] = valueString;
    setOtp(modifiedOtp);
    otpForm.setValue("otp", modifiedOtp.join(""), { shouldValidate: true });
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
    const dataText = e.clipboardData.getData("text").replaceAll(/\D/g, "").slice(0, 6);
    if (dataText.length === 6) {
      const digits = dataText.split("");
      setOtp(digits);
      otpForm.setValue("otp", digits.join(""), { shouldValidate: true });
      document.getElementById("otp-5")?.focus();
    }
    e.preventDefault();
  };

  const handleVerifyOTP = async (data) => {
    dispatch(clearMessages());
    otpForm.clearErrors("root");

    const response = await Promise.resolve(dispatch(verifyResetOtp({ email, otp: data.otp })));
    if (verifyResetOtp.fulfilled.match(response)) {
      dispatch(clearMessages());
      setStep(STEPS.PASSWORD);
    } else {
      otpForm.setError("root", { type: "server", message: response.payload || "Invalid OTP." });
    }
  };

  const handleResetPassword = async (data) => {
    dispatch(clearMessages());
    passwordForm.clearErrors("root");

    const response = await Promise.resolve(dispatch(resetPassword({ email, otp: otp.join(""), newPassword: data.newPassword })));
    if (resetPassword.fulfilled.match(response)) {
      dispatch(clearMessages());
      setRedirecting(true);
      setTimeout(() => navigate(loginPath), 1500);
    } else {
      passwordForm.setError("root", { type: "server", message: response.payload || "Failed to reset password." });
    }
  };

  const stepMeta = {
    [STEPS.EMAIL]: { title: "Forgot Password", subtitle: "Enter your email to receive a reset OTP" },
    [STEPS.OTP]: { title: "Enter OTP", subtitle: `We sent a 6-digit code to ${email}` },
    [STEPS.PASSWORD]: { title: "Set New Password", subtitle: "Choose a strong new password" },
  };

  let activeRootError = passwordForm.formState.errors.root?.message;
  if (step === STEPS.EMAIL) {
    activeRootError = emailForm.formState.errors.root?.message;
  } else if (step === STEPS.OTP) {
    activeRootError = otpForm.formState.errors.root?.message;
  }
  const getStepDotClass = (s, step) => {
    if (s === step) return "w-6 h-2.5 bg-blue-900";
    if (s < step) return "w-2.5 h-2.5 bg-blue-300";
    return "w-2.5 h-2.5 bg-slate-200";
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
            <div key={s} className={`rounded-full transition-all duration-300 ${getStepDotClass(s, step)}`} />
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">{stepMeta[step].title}</h1>
          <p className="text-sm text-slate-500 mb-6">{stepMeta[step].subtitle}</p>

          {activeRootError && (
            <div className="mb-5 text-sm rounded-xl px-4 py-3 border bg-red-50 text-red-600 border-red-200">{activeRootError}</div>
          )}

          {step === STEPS.EMAIL && (
            <form onSubmit={emailForm.handleSubmit(handleSendOTP)} className="space-y-4" noValidate>
              <div>
                <label htmlFor="forgot-email" className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address</label>
                <input
                  id="forgot-email"
                  type="email" placeholder="you@example.com"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 bg-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-150"
                  {...emailForm.register("email")}
                />
                {emailForm.formState.errors.email?.message && (
                  <p className="text-xs text-red-400 mt-1">{emailForm.formState.errors.email.message}</p>
                )}
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-blue-900 text-white text-sm font-bold hover:bg-blue-900 disabled:opacity-60 flex items-center justify-center gap-2 transition-all">
                {loading ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Sending...</> : "Send OTP"}
              </button>
            </form>
          )}

          {step === STEPS.OTP && (
            <form onSubmit={otpForm.handleSubmit(handleVerifyOTP)} className="space-y-5" noValidate>
              <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input key={OTP_INPUT_KEYS[idx]} id={`otp-${idx}`} type="text" inputMode="numeric" maxLength={1} value={digit} onChange={(e) => handleOtpChange(e.target.value, idx)} onKeyDown={(e) => handleOtpKeyDown(e, idx)} className="w-11 h-12 text-center text-lg font-bold border border-slate-200 rounded-xl outline-none focus:border-blue-900 focus:ring-4 focus:ring-blue-50 text-slate-800 transition-all duration-150" />
                ))}
              </div>
              {otpForm.formState.errors.otp?.message && (
                <p className="text-xs text-red-400 text-center">{otpForm.formState.errors.otp.message}</p>
              )}
              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-blue-900 text-white text-sm font-bold hover:bg-blue-900 disabled:opacity-60 flex items-center justify-center gap-2 transition-all">
                {loading ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Verifying...</> : "Verify OTP"}
              </button>
              <p className="text-xs text-slate-500 text-center">
                Didn't get it?{" "}
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-blue-900 font-semibold cursor-pointer hover:underline bg-transparent border-none p-0 inline"
                >
                  Resend OTP
                </button>
              </p>
            </form>
          )}

          {step === STEPS.PASSWORD && (
            <form onSubmit={passwordForm.handleSubmit(handleResetPassword)} className="space-y-4" noValidate>
              <div>
                <label htmlFor="new-password" className="block text-xs font-semibold text-slate-600 mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPw ? "text" : "password"} placeholder="Min. 8 characters"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm text-slate-800 bg-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-150"
                    {...passwordForm.register("newPassword")}
                  />
                  <button type="button" onClick={() => setShowPw((p) => !p)} className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600">
                    <PasswordVisibilityIcon visible={showPw} />
                  </button>
                </div>
                {passwordForm.formState.errors.newPassword?.message && (
                  <p className="text-xs text-red-400 mt-1">{passwordForm.formState.errors.newPassword.message}</p>
                )}

                {passwordForm.formState.touchedFields.newPassword && watchedNewPassword?.length > 0 && (() => {
                  const { calculatedPoints } = computeSecurityLevelScore(watchedNewPassword);
                  const securityLevel = grabVisualBarAttributes(calculatedPoints);
                  return (
                    <div className="mt-2 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div style={{ width: securityLevel.barPct, height: "100%", background: securityLevel.colorCode, borderRadius: "999px", transition: "width 0.3s ease, background 0.3s ease" }} />
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: "700", color: securityLevel.colorCode }}>{securityLevel.status}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1">
                        {ACCESS_SECURITY_POLICIES.map((item) => {
                          const statePassed = item.validator(watchedNewPassword);
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
                <label htmlFor="confirm-password" className="block text-xs font-semibold text-slate-600 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showConfirmPw ? "text" : "password"} placeholder="Re-enter your password"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm text-slate-800 bg-white outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all duration-150"
                    {...passwordForm.register("confirmPassword")}
                  />
                  <button type="button" onClick={() => setShowConfirmPw((p) => !p)} className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600">
                    <PasswordVisibilityIcon visible={showConfirmPw} />
                  </button>
                </div>
                {passwordForm.formState.errors.confirmPassword?.message && (
                  <p className="text-xs text-red-400 mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-blue-900 text-white text-sm font-bold hover:bg-blue-900 disabled:opacity-60 flex items-center justify-center gap-2 transition-all">
                {loading ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Resetting...</> : "Reset Password"}
              </button>
            </form>
          )}
        </div>

        <p className="text-sm text-slate-600 text-center mt-6">
          Remember your password?{" "}
          <button
            type="button"
            onClick={() => navigate(loginPath)}
            className="text-blue-900 font-semibold cursor-pointer hover:underline bg-transparent border-none p-0 inline"
          >
            Back to Login
          </button>
        </p>
      </div>
    </main>
  );
};

export default ForgotPassword;
