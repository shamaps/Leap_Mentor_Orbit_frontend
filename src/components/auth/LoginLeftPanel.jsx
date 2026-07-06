// src/components/auth/LoginLeftPanel.jsx
import { IMAGES } from "../../constants/images";
import PropTypes from "prop-types";
const LoginLeftPanel = ({ role }) => {
  const isMentor = role === "mentor";

  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden">
      {/* Background image */}
      <img
        src={IMAGES.loginHero} 
        alt="Login visual"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/10" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-10 text-white">
        {/* Headline */}
        <h2 className="text-4xl font-extrabold leading-tight mb-4 tracking-tight">
          {isMentor ? (
            <>
              Empower the next
              <br />
              generation of talent.
            </>
          ) : (
            <>
              Find the mentor who
              <br />
              unlocks your potential.
            </>
          )}
        </h2>

        {/* Subtext */}
        <p className="text-sm text-white/70 leading-relaxed max-w-xs">
          {isMentor
            ? "Share your expertise and help aspiring professionals leap forward in their careers through meaningful mentorship."
            : "Connect with experienced mentors who've walked the path you're on and are ready to guide you forward."}
        </p>
      </div>
    </div>
  );
};
LoginLeftPanel.propTypes = {
  role: PropTypes.oneOf(["mentor", "mentee"]),
};
export default LoginLeftPanel;
