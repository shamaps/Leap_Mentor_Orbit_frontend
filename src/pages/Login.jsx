// src/pages/Login.jsx
// NON FUNCTIONAL AS ITS DIVIDED INTO LOGINMENTEE AND LOGINMENTOR PAGES
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axiosInstance";
import { useSignIn, useClerk } from "@clerk/clerk-react";
import useGoogleAuth from "../hooks/useGoogleAuth";
import { useDispatch } from "react-redux";         // ← ADDED
import { setUser } from "../store/slices/authSlice"; // ← ADDED

const redirectByRole = (roles, navigate) => {
  if (roles.includes("mentor") && roles.includes("mentee")) {
    navigate("/dashboard/mentor");
  } else if (roles.includes("mentor")) {
    navigate("/dashboard/mentor");
  } else {
    navigate("/dashboard/mentee");
  }
};

const CLERK_STRATEGY = {
  linkedin: "oauth_linkedin_oidc",
  apple: "oauth_apple",
};

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();  // ← ADDED
  const googleBtnRef = useRef(null);
  const { signIn, isLoaded: clerkLoaded } = useSignIn();
  const { signOut } = useClerk();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useGoogleAuth({
    btnRef: googleBtnRef,
    termsAcceptedRef: null,
    roles: [],
    onSuccess: (data) => {
      setMsg({ type: "success", text: "Google login successful! Redirecting..." });
      setTimeout(() => redirectByRole(data?.user?.roles || [], navigate, setMsg), 700);
    },
    onError: (text) => setMsg({ type: "error", text }),
    onLoadingChange: setLoading,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ✅ LinkedIn + Apple via Clerk — FIXED redirect URLs
  const handleClerkSSO = async (provider) => {
    if (!clerkLoaded) return;

    try {
      setLoading(true);

      // ✅ Force sign out and wait fully before proceeding
      await signOut({ redirectUrl: window.location.href });

      localStorage.setItem("sso_role", "existing");
      localStorage.setItem("sso_terms", "true");

      await signIn.authenticateWithRedirect({
        strategy: CLERK_STRATEGY[provider],
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/sso-callback-sync`,
      });
    } catch (err) {
      localStorage.removeItem("sso_role");
      localStorage.removeItem("sso_terms");
      setMsg({ type: "error", text: err.message || "SSO failed. Try again." });
      setLoading(false);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    try {
      setLoading(true);

      const res = await axiosInstance.post("/auth/login", {
        email: form.email.trim(),
        password: form.password,
      });

      // ← FIXED: was localStorage.setItem("token") — backend now returns accessToken not token
      if (res.data?.accessToken) {
        dispatch(setUser({ token: res.data.accessToken, user: res.data.user || null }));
      }

      setMsg({ type: "success", text: "Login successful! Redirecting..." });
      setTimeout(() => redirectByRole(res.data?.user?.roles || [], navigate), 800);
    } catch (err) {
      const apiMsg = err?.response?.data?.message || err?.message || "Invalid credentials";
      setMsg({ type: "error", text: apiMsg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md border rounded-xl p-6">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back to LeapMentor.</p>

        {msg.text && (
          <div
            className={`mt-4 text-sm rounded-md p-3 ${msg.type === "success"
              ? "bg-green-50 text-green-700"
              : msg.type === "info"
                ? "bg-blue-50 text-blue-900"
                : "bg-red-50 text-red-700"
              }`}
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
            <label className="text-sm">Email</label>
            <input
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
            <label className="text-sm">Password</label>
            <input
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
          Don't have an account?{" "}
          <span className="underline cursor-pointer" onClick={() => navigate("/register/mentee")}>
            Register
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;