import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TermsAndConditionsModal from "./TermsAndConditionsModal";
import { IMAGES } from "../constants/images";
const footerLinks = {
  "For Mentees": ["Find a Mentor"],
  "For Mentors": ["Become a Mentor"],
  Company: ["Contact"],
};

export default function Footer() {
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const contactDialogRef = useRef<HTMLDialogElement | null>(null);
  const contactBackdropRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const dialogEl = contactDialogRef.current;
    if (!dialogEl) return;
    if (isContactOpen && !dialogEl.open) {
      dialogEl.showModal();
    } else if (!isContactOpen && dialogEl.open) {
      dialogEl.close();
    }
  }, [isContactOpen]);
  const navigate = useNavigate();

  // Same routes the navbar uses
  const handleLinkClick = (link: string) => {
    if (link === "Find a Mentor") return navigate("/register/mentee");
    if (link === "Become a Mentor") return navigate("/register/mentor");
  };

  return (
    <>
      <footer
        style={{
          background:
            "linear-gradient(135deg, #0d1117 0%, #0f1923 50%, #0d1117 100%)",
          position: "relative",
          overflow: "hidden",
        }}
        className="text-gray-300 pt-8 pb-5 px-6"
      >
        {/* Subtle glow accents */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            left: "20%",
            width: "400px",
            height: "300px",
            background:
              "radial-gradient(ellipse, rgba(99,102,241,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "0",
            right: "10%",
            width: "300px",
            height: "200px",
            background:
              "radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          className="max-w-6xl mx-auto"
          style={{ position: "relative", zIndex: 1 }}
        >
          {/* Top section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-6">
            {/* Brand */}
            <div className="col-span-1">
              <div className="flex items-center gap-2 mb-2">
                <img
                  src={IMAGES.logo}
                  alt="LeapMentor logo"
                  className="h-8 w-8"
                  width={32}
                  height={32}
                />
                <span className="text-white font-bold text-xl tracking-tight">
                  LeapMentor
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-0">
                The world&apos;s leading mentorship platform for professional career
                growth and leadership development.
              </p>
            </div>

            {/* Link Columns */}
            {Object.entries(footerLinks).map(([heading, links]) => (
              <div key={heading}>
                <h4
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#6366f1",
                    marginBottom: "14px",
                  }}
                >
                  {heading}
                </h4>
                <ul className="space-y-3">
                  {links.map((link) => (
                    <li key={link}>
                      {link === "Contact" ? (
                        <button
                          onClick={() => setIsContactOpen(true)}
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            fontSize: "14px",
                            color: "#9ca3af",
                            cursor: "pointer",
                            transition: "color 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#fff";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "#9ca3af";
                          }}
                        >
                          {link}
                        </button>
                      ) : (
                        // Find a Mentor + Become a Mentor now use navigate
                        <button
                          onClick={() => handleLinkClick(link)}
                          style={{
                            background: "none",
                            border: "none",
                            padding: 0,
                            fontSize: "14px",
                            color: "#9ca3af",
                            cursor: "pointer",
                            transition: "color 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = "#fff";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = "#9ca3af";
                          }}
                        >
                          {link}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Divider + Bottom bar */}
          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,0.07)",
              paddingTop: "24px",
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            <p
              style={{
                color: "#4b5563",
                fontSize: "12px",
                textAlign: "center",
              }}
            >
              © 2026 LeapMentor Inc. All rights reserved.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <button
                onClick={() => setIsTermsOpen(true)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "#4b5563",
                  fontSize: "12px",
                  cursor: "pointer",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#9ca3af";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#4b5563";
                }}
              ></button>
            </div>
          </div>
        </div>
      </footer>

      {/* Terms & Conditions Modal */}
      <TermsAndConditionsModal
        isOpen={isTermsOpen}
        onClose={() => setIsTermsOpen(false)}
        onAccept={() => setIsTermsOpen(false)}
        role="mentor"
        readOnly={true}
      />

      {/* Contact Modal */}
      <dialog
        ref={contactDialogRef}
        onClose={() => setIsContactOpen(false)}
        aria-labelledby="contact-modal-title"
        className="fixed inset-0 z-50 m-0 p-0 max-w-none max-h-none w-full h-full bg-transparent backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      >
        <div
          ref={contactBackdropRef}
          role="presentation"
          onClick={(e) => {
            if (e.target === contactBackdropRef.current) setIsContactOpen(false);
          }}
          className="flex items-center justify-center w-full h-full px-4"
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
              width: "100%",
              maxWidth: "420px",
              padding: "32px",
              animation: "modal-in 0.22s ease both",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>

            <h2
              id="contact-modal-title"
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: "#0f172a",
                marginBottom: "6px",
              }}
            >
              Contact Us
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "#94a3b8",
                marginBottom: "20px",
              }}
            >
              Have questions? We&apos;d love to hear from you.
            </p>

            <a
              href="https://mail.google.com/mail/?view=cm&to=leapmentor2026@gmail.com"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#4f46e5",
                textDecoration: "none",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#ede9fe";
                e.currentTarget.style.borderColor = "#a5b4fc";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f1f5f9";
                e.currentTarget.style.borderColor = "#e2e8f0";
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              leapmentor2026@gmail.com
            </a>

            <div style={{ marginTop: "24px" }}>
              <button
                onClick={() => setIsContactOpen(false)}
                style={{
                  background: "none",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "8px 24px",
                  fontSize: "13px",
                  color: "#64748b",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                }}
              >
                Close
              </button>
            </div>
          </div>

          <style>{`
            @keyframes modal-in {
              from { opacity: 0; transform: translateY(16px) scale(0.97); }
              to   { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>
        </div>
      </dialog>
    </>
  );
}