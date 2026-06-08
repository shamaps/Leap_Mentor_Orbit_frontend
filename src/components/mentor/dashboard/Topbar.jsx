// src/components/mentor/dashboard/Topbar.jsx
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";           // ✅ ADDED
import { logoutUser } from "../../../store/slices/authSlice"; // ✅ ADDED

const Topbar = ({ onMenuToggle, onLogoClick }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();                     // ✅ ADDED

  const handleLogout = async () => {
    await dispatch(logoutUser());   // ✅ FIXED: hits /auth/logout → clears HttpOnly cookie server-side
    //          then clears Redux state
    // OLD: localStorage.removeItem("token") — never cleared the cookie
    navigate("/login");
  };

  return (
    <header className="h-14 bg-white border-b border-slate-100 flex items-center justify-between px-4 sticky top-0 z-20 shadow-sm">
      <div className="flex items-center gap-2.5">

        {/* Hamburger */}
        <button
          onClick={onMenuToggle}
          aria-label="Open menu"
          className="flex md:hidden items-center justify-center p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Logo + Name — clicking navigates to Home tab */}
        <button
          onClick={onLogoClick}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          aria-label="Go to Home"
        >
          <img
            src="/images/logo.webp"
            alt="LeapMentor logo"
            className="h-8 w-8"
            width={32}
            height={32}
          />
          <span className="text-xl font-bold text-slate-800">LeapMentor</span>
        </button>

      </div>

      <button
        onClick={handleLogout}
        className="text-xs font-semibold px-4 py-2 rounded-xl bg-blue-900 text-white hover:bg-blue-700 transition-colors duration-150"
      >
        Logout
      </button>
    </header>
  );
};

export default Topbar;