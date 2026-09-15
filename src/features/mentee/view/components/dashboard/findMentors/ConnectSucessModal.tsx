// src/components/mentee/dashboard/findMentors/ConnectSuccessModal.jsx
interface ConnectSuccessModalProps {
  mentorName?: string;
  onBackToDashboard: () => void;
}

const ConnectSuccessModal = ({ mentorName, onBackToDashboard }: ConnectSuccessModalProps) => {
  return (
    // ── Overlay ──────────────────────────────────────────────
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 flex flex-col items-center text-center gap-5 animate-fade-in">
        {/* Success icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Text */}
        <div>
          <h2 className="text-lg font-bold text-slate-800">Request Sent!</h2>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
            Your connect request has been sent to{" "}
            <span className="font-semibold text-slate-700">
              {mentorName || "the mentor"}
            </span>
            {". You'll be notified once they respond."}
          </p>
        </div>

        {/* Back to dashboard button */}
        <button
          type="button"
          onClick={onBackToDashboard}
          className="w-full py-3 rounded-2xl bg-blue-900 text-white text-sm font-bold hover:bg-blue-900 active:scale-95 transition-all duration-150 shadow-sm shadow-blue-200"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default ConnectSuccessModal;