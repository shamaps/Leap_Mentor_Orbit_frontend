// src/components/shared-dashboard/tabs/ReportSuccessModal.jsx
const ReportSuccessModal = ({ onBack }: { onBack: () => void }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{
      backgroundColor: "rgba(15,23,42,0.45)",
      backdropFilter: "blur(2px)",
    }}
  >
    <div
      className="bg-white rounded-2xl shadow-2xl w-full max-w-sm
      flex flex-col items-center text-center px-8 py-10 gap-5"
    >
      {/* Icon */}
      <div
        className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100
        flex items-center justify-center"
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>

      {/* Text */}
      <div className="space-y-2">
        <p className="text-base font-bold text-slate-800">Report Submitted</p>
        <p className="text-xs text-slate-500 leading-relaxed">
          Thank you for letting us know. Our team will review your report and
          take appropriate action within 2–3 business days.
        </p>
      </div>

      {/* Divider */}
      <div className="w-full border-t border-slate-100" />

      {/* Notice */}
      <div className="flex items-start gap-2.5 text-left">
        <div
          className="w-5 h-5 rounded-full bg-blue-50 border border-blue-100
          flex items-center justify-center flex-shrink-0 mt-0.5"
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          All reports are confidential. You will not be notified of the outcome
          to protect the privacy of all parties.
        </p>
      </div>

      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="w-full py-2.5 rounded-xl bg-slate-800 text-white text-xs
          font-bold hover:bg-slate-700 transition-all flex items-center
          justify-center gap-2"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to Session
      </button>
    </div>
  </div>
);

export default ReportSuccessModal;