// src/components/mentee/dashboard/history/EscrowSuccessModal.jsx
import PropTypes from "prop-types";

const LockIcon = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
LockIcon.propTypes = {
  size: PropTypes.number,
};
const CheckIcon = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

// ── Props ─────────────────────────────────────────────────────
// totalAmount  — tokens locked
// mentorName   — mentor's name
// onDone       — called when user clicks Done or X (patches parent + closes)
const EscrowSuccessModal = ({ totalAmount, mentorName, onDone }) => {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-60 bg-black/40 backdrop-blur-sm"
        onClick={onDone}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-70 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2 text-slate-800">
              <LockIcon size={15} />
              <h2 className="text-sm font-bold">Payment Successful</h2>
            </div>
            <button
              type="button"
              onClick={onDone}
              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            >
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#64748B"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-8 flex flex-col items-center text-center space-y-4">
            {/* Check icon */}
            <div
              className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200
              flex items-center justify-center text-emerald-500"
            >
              <CheckIcon />
            </div>

            {/* Message */}
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800">
                {totalAmount} tokens locked in escrow
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your session with{" "}
                <span className="font-semibold text-slate-700">
                  {mentorName}
                </span>{" "}
                is now confirmed. Tokens will be released to them only after you
                mark the session as complete.
              </p>
            </div>

            {/* Badge */}
            <div
              className="flex items-center gap-1.5 bg-blue-50 border border-blue-100
              rounded-full px-3 py-1.5 text-xs font-semibold text-blue-900"
            >
              <LockIcon size={11} />
              Secured in Escrow
            </div>

            {/* Done button */}
            <button
              type="button"
              onClick={onDone}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold
                hover:bg-slate-700 transition-all mt-2"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
EscrowSuccessModal.propTypes = {
  totalAmount: PropTypes.number.isRequired,
  mentorName: PropTypes.string,
  onDone: PropTypes.func.isRequired,
};
export default EscrowSuccessModal;
