import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false); // 👈 new
  const registerRef = useRef(null); // 👈 new
  const navigate = useNavigate();

  // Close dropdown on outside click 👈 new
  useEffect(() => {
    const handler = (e) => {
      if (registerRef.current && !registerRef.current.contains(e.target)) {
        setRegisterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="w-full px-6 py-4 flex items-center justify-between">
        {/* Logo — untouched */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => {
            if (window.location.pathname === "/") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            } else {
              navigate("/");
            }
          }}
        >
          <img
            src="/images/logo.webp"
            alt="LeapMentor logo"
            className="h-8 w-8"
            width={32}
            height={32}
          />
          <span className="text-xl font-bold text-gray-900 tracking-tight">
            LeapMentor
          </span>
        </div>

        {/* Desktop Buttons — only this block changed */}
        <div className="hidden md:flex items-center gap-3">
          {/* Register dropdown */}
          <div className="relative" ref={registerRef}>
            <button
              onClick={() => setRegisterOpen((o) => !o)}
              className="w-32 flex items-center gap-1 px-5 py-[9px] text-sm font-semibold text-blue-900 border-2 border-blue-900 rounded-lg hover:bg-blue-50 transition-colors duration-200"
            >
              Register
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${registerOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {registerOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border-2 border-blue-900/10 z-50 overflow-hidden p-2">
                {/* Become a Mentor */}
                <button
                  onClick={() => {
                    navigate("/register/mentor");
                    setRegisterOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 transition-all duration-150 group text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-900 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-150">
                    <span className="text-base">🚀</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 group-hover:text-blue-900">
                      Become a Mentor
                    </p>
                    <p className="text-xs text-slate-400">
                      Share your expertise
                    </p>
                  </div>
                </button>

                <div className="h-px bg-blue-900/10 mx-3 my-1" />

                {/* Find a Mentor */}
                <button
                  onClick={() => {
                    navigate("/register/mentee");
                    setRegisterOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 transition-all duration-150 group text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-150">
                    <span className="text-base">🎓</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 group-hover:text-blue-900">
                      Find a Mentor
                    </p>
                    <p className="text-xs text-slate-400">
                      Accelerate your growth
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Login button */}
          <button
            onClick={() => navigate("/login")}
            className="w-32 px-5 py-[9px] text-sm font-semibold text-white bg-blue-900 border-2 border-transparent rounded-lg hover:bg-blue-800 transition-colors duration-200"
          >
            Login
          </button>
        </div>

        {/* Mobile Hamburger — untouched */}
        <button
          className="md:hidden text-gray-700"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg
            width="24"
            height="24"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu — updated to match new buttons */}
      {menuOpen && (
        <div className="md:hidden px-6 pb-4 flex flex-col gap-3 bg-white border-t border-gray-100">
          <button
            onClick={() => {
              navigate("/register/mentor");
              setMenuOpen(false);
            }}
            className="w-full px-5 py-2 text-sm font-semibold text-blue-900 border-2 border-blue-900 rounded-lg hover:bg-blue-50 transition-colors"
          >
            🚀 Become a Mentor
          </button>
          <button
            onClick={() => {
              navigate("/register/mentee");
              setMenuOpen(false);
            }}
            className="w-full px-5 py-2 text-sm font-semibold text-blue-900 border-2 border-blue-900 rounded-lg hover:bg-blue-50 transition-colors"
          >
            🎓 Find a Mentor
          </button>
          <button
            onClick={() => {
              navigate("/login");
              setMenuOpen(false);
            }}
            className="w-full px-5 py-2 text-sm font-semibold text-white bg-blue-900 rounded-lg hover:bg-blue-800 transition-colors shadow-md"
          >
            Login
          </button>
        </div>
      )}
    </nav>
  );
}
