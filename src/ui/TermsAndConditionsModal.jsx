import { useEffect, useRef, useState } from "react";

/**
 * TermsAndConditionsModal
 *
 * Props:
 *  - isOpen        {boolean}   — controls visibility
 *  - onClose       {function}  — called when modal is dismissed without accepting
 *  - onAccept      {function}  — called when user checks the box and clicks "Accept & Continue"
 *  - role          {string}    — "mentor" | "mentee" (optional, affects heading copy)
 *  - readOnly      {boolean}   — if true, hides the checkbox and action buttons (view-only mode)
 */
const TermsAndConditionsModal = ({ isOpen, onClose, onAccept, role = "mentor", readOnly = false }) => {
    const [agreed, setAgreed] = useState(false);
    const overlayRef = useRef(null);

    // Reset checkbox whenever modal opens
    useEffect(() => {
        if (isOpen) setAgreed(false);
    }, [isOpen]);

    // Close on Escape key
    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    // Prevent background scroll while open
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === overlayRef.current) onClose();
    };

    const handleAccept = () => {
        if (!agreed) return;
        onAccept();
    };

    return (
        <div
            ref={overlayRef}
            onClick={handleOverlayClick}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="terms-modal-title"
        >
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-modal-in">

                {/* ── Header ── */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 shrink-0">
                    <div>
                        <h2 id="terms-modal-title" className="text-lg font-bold text-slate-900 tracking-tight">
                            Terms & Conditions
                        </h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {readOnly
                                ? "LeapMentor Terms & Conditions"
                                : `Please read the full agreement before registering as a ${role}.`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Close modal"
                        className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-lg leading-none"
                    >
                        ✕
                    </button>
                </div>

                {/* ── Scrollable body ── */}
                <div className="overflow-y-auto px-6 py-5 flex-1 text-sm text-slate-600 leading-relaxed space-y-5">

                    <section>
                        <h3 className="font-semibold text-slate-800 mb-1">1. Acceptance of Terms</h3>
                        <p>
                            By registering on LeapMentor, you agree to be bound by these Terms and Conditions and all
                            applicable laws and regulations. If you do not agree with any of these terms, you are prohibited
                            from using or accessing this platform.
                        </p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-slate-800 mb-1">2. User Responsibilities</h3>
                        <p>
                            You are responsible for maintaining the confidentiality of your account and password and for
                            restricting access to your computer. You agree to accept responsibility for all activities that
                            occur under your account. You must not impersonate any person or entity or misrepresent your
                            affiliation with any person or entity.
                        </p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-slate-800 mb-1">3. {role === "mentor" ? "Mentor" : "Mentee"} Conduct</h3>
                        <p>
                            {role === "mentor"
                                ? "As a mentor, you agree to provide accurate information about your expertise and experience, maintain professional conduct in all sessions, and respect the privacy and confidentiality of your mentees. You must not charge mentees outside the platform or engage in any discriminatory behavior."
                                : "As a mentee, you agree to engage respectfully with mentors, attend scheduled sessions punctually, and use the guidance provided for lawful and constructive purposes only. You must not harass or pressure mentors in any way."}
                        </p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-slate-800 mb-1">4. Privacy Policy</h3>
                        <p>
                            We collect and process personal data in accordance with our Privacy Policy. By registering, you
                            consent to the collection, use, and sharing of your information as described therein. We do not
                            sell your personal data to third parties.
                        </p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-slate-800 mb-1">5. Intellectual Property</h3>
                        <p>
                            All content on this platform, including but not limited to text, graphics, logos, and software,
                            is the property of LeapMentor and is protected by applicable intellectual property laws. You may
                            not reproduce, distribute, or create derivative works without our prior written consent.
                        </p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-slate-800 mb-1">6. Limitation of Liability</h3>
                        <p>
                            LeapMentor shall not be liable for any indirect, incidental, special, consequential, or punitive
                            damages, including loss of profits, data, or goodwill, arising out of or in connection with your
                            use of the platform or services.
                        </p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-slate-800 mb-1">7. Termination</h3>
                        <p>
                            We reserve the right to terminate or suspend your account at our sole discretion, without notice,
                            for conduct that we believe violates these Terms or is harmful to other users, us, or third
                            parties, or for any other reason.
                        </p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-slate-800 mb-1">8. Changes to Terms</h3>
                        <p>
                            LeapMentor reserves the right to modify these Terms at any time. We will notify you of significant
                            changes via email or a prominent notice on the platform. Continued use of the service after such
                            modifications constitutes your acceptance of the updated Terms.
                        </p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-slate-800 mb-1">9. Governing Law</h3>
                        <p>
                            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in
                            which LeapMentor operates, without regard to its conflict of law provisions.
                        </p>
                    </section>

                    <section>
                        <h3 className="font-semibold text-slate-800 mb-1">10. Contact</h3>
                        <p>
                            If you have any questions about these Terms, please contact us at{" "}
                            <a
                                href="https://mail.google.com/mail/?view=cm&to=leapmentor2026@gmail.com"
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-900 underline"
                            >
                                leapmentor2026@gmail.com
                            </a>
                            .
                        </p>
                    </section>
                </div>

                {/* ── Footer: hidden in readOnly mode ── */}
                {!readOnly && (
                    <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 rounded-b-2xl shrink-0 space-y-4">
                        <label className="flex items-start gap-2.5 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="mt-0.5 w-4 h-4 accent-blue-900 shrink-0 cursor-pointer"
                            />
                            <span className="text-sm text-slate-600 leading-relaxed group-hover:text-slate-800 transition-colors">
                                I have read and agree to the <span className="font-medium text-slate-800">Terms & Conditions</span> and{" "}
                                <span className="font-medium text-slate-800">Privacy Policy</span>.
                            </span>
                        </label>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg py-2.5 hover:bg-slate-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAccept}
                                disabled={!agreed}
                                className="flex-1 bg-blue-900 hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg py-2.5 transition-colors"
                            >
                                Accept & Continue
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Keyframe animation */}
            <style>{`
        @keyframes modal-in {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        .animate-modal-in { animation: modal-in 0.22s ease both; }
      `}</style>
        </div>
    );
};

export default TermsAndConditionsModal;