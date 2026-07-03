// src/components/auth/AuthSSOButtons.jsx
import { GoogleIcon, LinkedInIcon } from "./AuthIcons";

const AuthSSOButtons = ({ googleBtnRef, loading, clerkLoaded, onLinkedIn }) => {
  return (
    <div className="flex gap-2.5">
      {/* Google */}
      <div
        className={`flex-1 ${loading ? "opacity-60 pointer-events-none" : ""}`}
      >
        <div ref={googleBtnRef} className="hidden" />
        <button
          type="button"
          onClick={() =>
            googleBtnRef.current?.querySelector("div[role=button]")?.click()
          }
          className="w-full flex items-center justify-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 bg-white hover:bg-slate-50 transition-colors"
        >
          <GoogleIcon />
          Google
        </button>
      </div>

      {/* LinkedIn */}
      <button
        type="button"
        onClick={onLinkedIn}
        disabled={loading || !clerkLoaded}
        className="flex-1 flex items-center justify-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 bg-white hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        <LinkedInIcon />
        LinkedIn
      </button>
    </div>
  );
};

export default AuthSSOButtons;
