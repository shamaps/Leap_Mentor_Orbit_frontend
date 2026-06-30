import { useState } from "react";
import useReport from "../../../hooks/useReport";

const StarRatingInput = ({ value, onChange, disabled }) => (
  <div className="flex items-center gap-1.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => !disabled && onChange(star)}
        disabled={disabled}
        className={`transition-all ${disabled ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
      >
        <svg width="32" height="32" viewBox="0 0 24 24"
          fill={star <= value ? "#f59e0b" : "none"}
          stroke={star <= value ? "#f59e0b" : "#cbd5e1"}
          strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </button>
    ))}
    {value > 0 && (
      <span className="text-sm font-bold text-amber-500 ml-1">
        {["", "Poor", "Fair", "Good", "Great", "Excellent"][value]}
      </span>
    )}
  </div>
);

const FeedbackModal = ({ connect, onClose, slotIndex, onFeedbackSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [done, setDone] = useState(false);
  
  const { submitFeedback, submitting, error } = useReport(connect?._id);

  const otherName = connect?.viewerRole === "mentee"
    ? connect?.mentor?.name || "Mentor"
    : connect?.mentee?.name || "Mentee";

  const handleSubmit = async () => {
    
    if (rating === 0) return;
    const result = await submitFeedback(rating, comment, slotIndex);
    if (result?.success) {
      setDone(true);
      setTimeout(() => {
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted();
        } else {
          onClose();
        }
      }, 1500);
    } else if (result?.message?.includes("already submitted")) {
      onClose();
    }
  };

  const handleDone = () => {
    if (onFeedbackSubmitted) {
      onFeedbackSubmitted();
    } else {
      onClose();
    }
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-5">

        {!done ? (
          <>
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200
                    flex items-center justify-center">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                      stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">
                    {slotIndex !== undefined ? `Session ${slotIndex + 1} Complete!` : "Session Complete!"}
                  </p>
                </div>
                <h2 className="text-lg font-extrabold text-slate-800">
                  How was your session?
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Share your experience with {otherName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg border border-slate-200 bg-slate-50
                  text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Rating */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2.5 uppercase tracking-widest">
                Overall Rating <span className="text-red-400">*</span>
              </label>
              <StarRatingInput value={rating} onChange={setRating} disabled={submitting} />
            </div>

            {/* Comment */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-widest">
                Feedback{" "}
                <span className="text-slate-400 font-normal normal-case">(optional)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={`What did you think about your session with ${otherName}?`}
                rows={3}
                disabled={submitting}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5
                  outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50
                  transition-all resize-none text-slate-700 placeholder:text-slate-400
                  disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

            {/* Actions */}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white
                  text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Skip for now
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={rating === 0 || submitting}
                className="flex-1 py-2.5 rounded-xl bg-blue-900 text-white text-xs font-bold
                  hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                    Submit Feedback
                  </>
                )}
              </button>
            </div>
          </>
        ) : (
          /* Success Screen */
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200
              flex items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
                stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">
                Feedback Submitted!
              </p>
              <p className="text-base font-extrabold text-slate-800">
                Thanks for your feedback!
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Your review has been submitted successfully.
              </p>
            </div>
            <button
              onClick={handleDone}
              className="px-6 py-2.5 rounded-xl bg-blue-900 text-white text-xs font-bold
                hover:bg-blue-700 transition-all"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;