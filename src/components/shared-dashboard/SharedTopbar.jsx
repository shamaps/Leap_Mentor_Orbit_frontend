// src/components/shared-dashboard/SharedTopbar.jsx
import { useNavigate } from "react-router-dom";
import { IMAGES } from "../../constants/images";
import PropTypes from "prop-types";
const SharedTopbar = ({ viewerRole, onMenuToggle, onLogoClick }) => {
  const navigate = useNavigate();

  const backPath =
    viewerRole === "mentor" ? "/dashboard/mentor" : "/dashboard/mentee";

  return (
    <header
      style={{
        height: "56px",
        backgroundColor: "white",
        borderBottom: "1px solid #f1f5f9",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        position: "sticky",
        top: 0,
        zIndex: 20,
        flexShrink: 0,
      }}
    >
      {/* Left — hamburger + logo + session badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          minWidth: 0,
        }}
      >
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
          style={{
            display: "none",
            padding: "6px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "transparent",
            cursor: "pointer",
            color: "#64748b",
            flexShrink: 0,
          }}
          className="shared-hamburger"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={onLogoClick}
        >
          <img
            src={IMAGES.logo}
            alt="LeapMentor logo"
            className="h-8 w-8"
            width={32}
            height={32}
          />
          <span className="text-xl font-bold text-gray-900 tracking-tight">
            LeapMentor
          </span>
        </div>

        {/* Session badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            padding: "3px 8px",
            borderRadius: "999px",
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#22c55e",
              display: "inline-block",
              animation: "pulse 2s infinite",
            }}
          />
          {/* ✅ Short text on mobile, full text on desktop */}
          <span
            className="shared-session-full"
            style={{ fontSize: "11px", fontWeight: "600", color: "#1d4ed8" }}
          >
            Shared Session
          </span>
          <span
            className="shared-session-short"
            style={{
              fontSize: "11px",
              fontWeight: "600",
              color: "#1d4ed8",
              display: "none",
            }}
          >
            Live
          </span>
        </div>
      </div>

      {/* Right — back button */}
      <button
        onClick={() => navigate(backPath)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "7px 12px",
          borderRadius: "10px",
          border: "1px solid #1e3a8a",
          backgroundColor: "#1e3a8a",
          cursor: "pointer",
          fontSize: "12px",
          fontWeight: "600",
          color: "white",
          transition: "all 0.15s",
          flexShrink: 0,
        }}
        onMouseEnter={(e) =>
          (e.currentTarget.style.backgroundColor = "#1e40af")
        }
        onMouseLeave={(e) =>
          (e.currentTarget.style.backgroundColor = "#1e3a8a")
        }
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        {/* ✅ Short text on mobile */}
        <span className="shared-back-full">Back</span>
        <span className="shared-back-short" style={{ display: "none" }}>
          Back
        </span>
      </button>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @media (max-width: 767px) {
          .shared-hamburger       { display: flex !important; }
          .shared-logo-text       { display: none !important; }
          .shared-session-full    { display: none !important; }
          .shared-session-short   { display: inline !important; }
          .shared-back-full       { display: none !important; }
          .shared-back-short      { display: inline !important; }
        }
      `}</style>
    </header>
  );
};
SharedTopbar.propTypes = {
  viewerRole: PropTypes.oneOf(["mentor", "mentee"]).isRequired,
  onMenuToggle: PropTypes.func.isRequired,
  onLogoClick: PropTypes.func.isRequired,
};
export default SharedTopbar;
