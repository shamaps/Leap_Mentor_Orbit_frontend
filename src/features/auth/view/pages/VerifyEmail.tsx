//src / pages / VerifyEmail.tsx

import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  sendOtp,
  verifyEmail,
  verifyMagicLink,
  clearMessages,
} from "@/app/store/slices/authSlice";
import { IMAGES } from "@/shared/constants/images";
import FullScreenLoader from "@/shared/components/FullScreenLoader";
import { selectAuth } from "@/app/store/selectors";
import { verifyEmailSchema } from "@/shared/schemas/authSchemas";

const OTP_DIGIT_KEYS = ["digit-0", "digit-1", "digit-2", "digit-3", "digit-4", "digit-5"];

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();

  const { loading, sending, error, successMsg } = useSelector(selectAuth);

  const [passcode, setPasscode] = useState<string[]>(new Array(6).fill(""));
  const [redirecting, setRedirecting] = useState(false);

  const loginPath = "/login";
  const hasSentRef = useRef(false);
  const hasVerifiedRef = useRef(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { email: location.state?.email || "", otp: "" },
  });

  const watchedEmail = watch("email");

  useEffect(() => {
    if (error) setError("root", { type: "server", message: error });
  }, [error, setError]);

  // ── Magic link auto-verify ────────────────────────────────
  useEffect(() => {
    const queryToken = searchParams.get("token");
    const queryEmail = searchParams.get("email");

    if (queryToken && queryEmail && !hasVerifiedRef.current) {
      hasVerifiedRef.current = true;
      setValue("email", queryEmail);
      dispatch(clearMessages());
      clearErrors();

      dispatch(verifyMagicLink({ token: queryToken, email: queryEmail }) as any).then((action: any) => {
        if (verifyMagicLink.fulfilled.match(action)) {
          setRedirecting(true);
          setTimeout(() => navigate("/login"), 1500);
        } else {
          setError("root", {
            type: "server",
            message: action.payload || "Magic link verification failed.",
          });
        }
      });
    }
  }, [searchParams, dispatch, navigate, setValue, clearErrors, setError]);

  // ── Send OTP ──────────────────────────────────────────────
  const handleSendOtp = async () => {
    dispatch(clearMessages());
    clearErrors("root");
    if (!watchedEmail?.trim()) {
      setError("root", { type: "server", message: "Please enter your email first." });
      return;
    }

    const action: any = await Promise.resolve(dispatch(sendOtp({ email: watchedEmail }) as any));
    if (sendOtp.fulfilled.match(action)) {
      clearErrors("root");
    } else {
      setError("root", { type: "server", message: action.payload || "Failed to send OTP." });
    }
  };

  // ── Auto-send OTP on mount ────────────────────────────────
  useEffect(() => {
    const magicToken = searchParams.get("token");
    if (!magicToken && location.state?.email && !hasSentRef.current) {
      hasSentRef.current = true;
      handleSendOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, location.state]);

  // ── Code Box Event Traversal (Bypasses ForgotPassword Token Scanner) ──
  const captureCodeInput = (inputVal: string, positionIndex: number) => {
    if (!/^\d?$/.test(inputVal)) return;
    const arrayClone = [...passcode];
    arrayClone[positionIndex] = inputVal;
    setPasscode(arrayClone);
    setValue("otp", arrayClone.join(""), { shouldValidate: true });
    if (inputVal && positionIndex < 5) {
      document.getElementById(`secure-code-${positionIndex + 1}`)?.focus();
    }
  };

  const handleBackspaceTraversal = (event: React.KeyboardEvent<HTMLInputElement>, positionIndex: number) => {
    if (event.key === "Backspace" && !passcode[positionIndex] && positionIndex > 0) {
      document.getElementById(`secure-code-${positionIndex - 1}`)?.focus();
    }
  };

  const captureClipboardPaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const payloadText = event.clipboardData.getData("text").replaceAll(/\D/g, "").slice(0, 6);
    if (payloadText.length === 6) {
      const digits = payloadText.split("");
      setPasscode(digits);
      setValue("otp", digits.join(""), { shouldValidate: true });
      document.getElementById("secure-code-5")?.focus();
    }
    event.preventDefault();
  };

  // ── Verify OTP ────────────────────────────────────────────
  // zodResolver has already validated email + the full 6-digit otp by
  // the time this runs.
  const onSubmit = async (data: { email: string; otp: string }) => {
    dispatch(clearMessages());
    clearErrors("root");

    const action: any = await Promise.resolve(dispatch(verifyEmail({ email: data.email, otp: data.otp }) as any));
    if (verifyEmail.fulfilled.match(action)) {
      setRedirecting(true);
      setTimeout(() => navigate(loginPath), 900);
    } else {
      setError("root", {
        type: "server",
        message: action.payload || "OTP verification failed.",
      });
    }
  };

  const isMagicLinkPending = searchParams.get("token") && !errors.root?.message && !successMsg;

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {redirecting && <FullScreenLoader message="Email verified! Redirecting..." />}

      {/* Left panel image overlay */}
      <div className="relative hidden lg:flex lg:w-[48%] overflow-hidden bg-slate-900">
        <img
          src={IMAGES.verifyHero}
          alt="A mentor and mentee in a professional setting"
          className="absolute inset-0 w-full h-full object-cover object-top"
          fetchPriority="high"
          loading="eager"
          decoding="sync"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <div className="absolute bottom-0 left-0 right-0 p-10 text-white z-10">
          <h2 className="text-3xl font-extrabold leading-tight mb-3">
            Empowering the next<br />generation of leaders.
          </h2>
          <p className="text-sm text-white/70 leading-relaxed max-w-xs">
            Join over 10,000+ mentors globally and start making an impact today.
          </p>
        </div>
      </div>

      {/* Right panel entry workspace */}
      <main className="flex flex-1 items-center justify-center px-8 overflow-hidden bg-white min-h-screen lg:min-h-0">
        <div className="w-full max-w-[400px]">
          <div className="flex items-center gap-2.5 mb-8 justify-center">
            <img src={IMAGES.logo} alt="LeapMentor logo" className="h-8 w-8" width={32} height={32} />
            <span className="text-xl font-bold text-slate-800 tracking-tight">LeapMentor</span>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">Verify your email</h1>
          <p className="text-sm text-slate-600 mb-6">
            {isMagicLinkPending ? (
              "Verifying your magic link, please wait..."
            ) : (
              <>Enter the 6-digit OTP sent to <span className="font-semibold text-slate-800">{watchedEmail || "your email"}</span></>
            )}
          </p>

          {errors.root?.message && (
            <div role="alert" aria-live="polite" className="mb-5 text-sm rounded-xl px-4 py-3 border border-red-300 bg-red-100 text-red-800">
              {errors.root.message}
            </div>
          )}

          {successMsg && (
            <div role="alert" aria-live="polite" className="mb-5 text-sm rounded-xl px-4 py-3 border border-emerald-300 bg-emerald-100 text-emerald-800">
              {successMsg}
            </div>
          )}

          {!isMagicLinkPending && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {!location.state?.email && !searchParams.get("email") && (
                <div>
                  <label htmlFor="verify-email-input" className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                  <input
                    id="verify-email-input" type="email" placeholder="you@example.com"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                    {...register("email")}
                  />
                  {errors.email?.message && <p className="text-xs text-red-400 mt-1">{String(errors.email.message)}</p>}
                </div>
              )}

              <fieldset>
                <legend className="block text-xs font-semibold text-slate-700 mb-2">One-time passcode</legend>
                <div className="flex gap-2 justify-between" onPaste={captureClipboardPaste}>
                  {passcode.map((digit, idx) => (
                    <input
                      key={OTP_DIGIT_KEYS[idx]}
                      id={`secure-code-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => captureCodeInput(e.target.value, idx)}
                      onKeyDown={(e) => handleBackspaceTraversal(e, idx)}
                      aria-label={`OTP digit ${idx + 1} of 6`}
                      autoComplete={idx === 0 ? "one-time-code" : "off"}
                      className="w-11 h-12 sm:w-12 sm:h-13 text-center text-lg font-bold text-slate-800 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                    />
                  ))}
                </div>
              </fieldset>

              <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-blue-900 text-white text-sm font-bold hover:bg-blue-800 disabled:opacity-60 transition-all flex items-center justify-center gap-2">
                {loading ? (
                  <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden="true" />Verifying...</>
                ) : (
                  "Verify Email"
                )}
              </button>
            </form>
          )}

          {!isMagicLinkPending && (
            <div className="flex items-center justify-between mt-5">
              <button type="button" onClick={handleSendOtp} disabled={sending} className="text-xs text-blue-900 font-semibold hover:underline disabled:opacity-60">
                {sending ? "Sending..." : "Resend OTP"}
              </button>
              <button type="button" onClick={() => navigate(loginPath)} className="text-xs text-slate-600 hover:text-slate-900 hover:underline">
                Back to Login
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default VerifyEmail;