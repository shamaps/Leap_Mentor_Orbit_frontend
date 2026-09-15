// src/pages/Login.tsx
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginRequestRaw } from "@/features/auth/model/auth.api";
import { useSignIn, useClerk } from "@clerk/clerk-react";
import useGoogleAuth from "@/features/auth/presenter/useGoogleAuth";
import { useDispatch } from "react-redux";
import { setUser } from "@/app/store/slices/authSlice";
import { ssoFlags } from "@/shared/utils/storage";

const redirectByRole = (roles: string[], navigate: (path: string) => void) => {
  if (roles.includes("mentor") && roles.includes("mentee")) {
    navigate("/dashboard/mentor");
  } else if (roles.includes("mentor")) {
    navigate("/dashboard/mentor");
  } else {
    navigate("/dashboard/mentee");
  }
};

const CLERK_STRATEGY: Record<string, string> = {
  linkedin: "oauth_linkedin_oidc",
  apple: "oauth_apple",
};

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const googleBtnRef = useRef < HTMLDivElement > (null);
  const { signIn, isLoaded: clerkLoaded } = useSignIn();
  const { signOut } = useClerk();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState < { type: string; text: string } > ({ type: "", text: "" });

  useGoogleAuth({
    btnRef: googleBtnRef,
    termsAcceptedRef: null,
    roles: [],
    onSuccess: (data: any) => {
      setMsg({
        type: "success",
        text: "Google login successful! Redirecting...",
      });
      setTimeout(
        () => redirectByRole(data?.user?.roles || [], navigate),
        700,
      );
    },
    onError: (text: string) => setMsg({ type: "error", text }),
    onLoadingChange: setLoading,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // LinkedIn + Apple via Clerk — FIXED redirect URLs
  const handleClerkSSO = async (provider: string) => {
    if (!clerkLoaded) return;

    try {
      setLoading(true);

      // Force sign out and wait fully before proceeding
      await signOut({ redirectUrl: globalThis.location.href } as any);

      ssoFlags.set("existing", true);

      await signIn!.authenticateWithRedirect({
        strategy: CLERK_STRATEGY[provider] as any,
        redirectUrl: `${globalThis.location.origin}/sso-callback`,
        redirectUrlComplete: `${globalThis.location.origin}/sso-callback-sync`,
      });
    } catch (err: any) {
      ssoFlags.clear();
      setMsg({ type: "error", text: err.message || "SSO failed. Try again." });
      setLoading(false);
    }
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    try {
      setLoading(true);

      const res = await loginRequestRaw(form.email.trim(), form.password);

      // ← FIXED: was localStorage.setItem("token") — backend now returns accessToken not token
      if (res.data?.accessToken) {
        dispatch(
          setUser({ token: res.data.accessToken, user: res.data.user || null }),
        );
      }

      setMsg({ type: "success", text: "Login successful! Redirecting..." });
      setTimeout(
        () => redirectByRole(res.data?.user?.roles || [], navigate),
        800,
      );
    } catch (err: any) {
      const apiMsg =
        err?.response?.data?.message || err?.message || "Invalid credentials";
      setMsg({ type: "error", text: apiMsg });
    } finally {
      setLoading(false);
    }
  };
  let msgBannerClass = "bg-red-50 text-red-700";
  if (msg.type === "success") {
    msgBannerClass = "bg-green-50 text-green-700";
  } else if (msg.type === "info") {
    msgBannerClass = "bg-blue-50 text-blue-900";
  }
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md border rounded-xl p-6">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="text-sm text-gray-500 mt-1">
          Welcome back to LeapMentor.
        </p>

        {msg.text && (
          <div
            className={`mt-4 text-sm rounded-md p-3 ${msgBannerClass}`}
          >
            {msg.text}
          </div>
        )}

        <div className="mt-5 space-y-2">
          <div className={loading ? "opacity-60 pointer-events-none" : ""}>
            <div ref={googleBtnRef} className="w-full" />
          </div>
          <button
            type="button"
            onClick={() => handleClerkSSO("linkedin")}
            className="w-full border rounded-lg py-2 text-sm"
            disabled={loading || !clerkLoaded}
          >
            Continue with LinkedIn
          </button>
          <button
            type="button"
            onClick={() => handleClerkSSO("apple")}
            className="w-full border rounded-lg py-2 text-sm"
            disabled={loading || !clerkLoaded}
          >
            Continue with Apple
          </button>
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px bg-gray-200 flex-1" />
          <span className="text-xs text-gray-400">OR</span>
          <div className="h-px bg-gray-200 flex-1" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="login-email" className="text-sm">Email</label>
            <input
              id="login-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 mt-1"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label htmlFor="login-password" className="text-sm">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 mt-1"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2 text-sm bg-black text-white disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-sm text-gray-600 mt-4">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            className="underline cursor-pointer bg-transparent border-none p-0"
            onClick={() => navigate("/register/mentee")}
          >
            Register
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;