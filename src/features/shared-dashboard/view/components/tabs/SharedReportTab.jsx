// src/components/shared-dashboard/tabs/SharedReportTab.jsx
import { useState } from "react";
import useReport from "@/features/shared-dashboard/presenter/useReport";
import ReportModal from "./ReportModal";
import ReportSuccessModal from "./ReportSuccessModal";
import PropTypes from "prop-types";
// ── Star Rating Input ─────────────────────────────────────────
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
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill={star <= value ? "#f59e0b" : "none"}
          stroke={star <= value ? "#f59e0b" : "#cbd5e1"}
          strokeWidth="1.5"
        >
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
StarRatingInput.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
// ── Star Rating Display (read-only) ──────────────────────────
const StarRatingDisplay = ({ value }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <svg
        key={star}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill={star <= value ? "#f59e0b" : "none"}
        stroke={star <= value ? "#f59e0b" : "#cbd5e1"}
        strokeWidth="1.5"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ))}
    <span className="text-xs font-bold text-slate-600 ml-1">{value}/5</span>
  </div>
);
StarRatingDisplay.propTypes = {
  value: PropTypes.number.isRequired,
};
// ── Feedback Card ─────────────────────────────────────────────
const FeedbackCard = ({ feedback, label, isOwn }) => (
  <div
    className={`rounded-2xl p-5 border space-y-3
    ${isOwn ? "bg-blue-50 border-blue-100" : "bg-white border-slate-200"}`}
  >
    <div className="flex items-center justify-between">
      <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">
        {label}
      </p>
      <StarRatingDisplay value={feedback.rating} />
    </div>
    {feedback.comment && (
      <p className="text-sm text-slate-600 leading-relaxed italic">
        "{feedback.comment}"
      </p>
    )}
    <p className="text-[10px] text-blue-900">
      {new Date(feedback.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}
    </p>
  </div>
);
FeedbackCard.propTypes = {
  feedback: PropTypes.shape({
    rating: PropTypes.number,
    comment: PropTypes.string,
    createdAt: PropTypes.string,
  }),
  label: PropTypes.string.isRequired,
  isOwn: PropTypes.bool,
};
// ── Not Completed State ───────────────────────────────────────
const NotCompletedState = () => (
  <EmptyState
    icon={
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
        stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    }
    message="Session not completed yet"
    subMessage="Feedback can only be submitted after both parties mark all sessions as complete."
    compact
  />
);
// ── Main ──────────────────────────────────────────────────────
const SharedReportTab = ({ connect, reportRefreshKey }) => {
  // 👈 ADDED: reportRefreshKey
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [success, setSuccess] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportDone, setReportDone] = useState(false);

  const {
    myFeedback,
    theirFeedback,
    sessionStatus,
    loading,
    submitting,
    error,
    submitFeedback,
  } = useReport(connect?._id, reportRefreshKey); // 👈 ADDED: pass reportRefreshKey

  const isCompleted = sessionStatus === "completed";
  const otherName =
    connect?.viewerRole === "mentee"
      ? connect?.mentor?.name || "Mentor"
      : connect?.mentee?.name || "Mentee";

  const handleSubmit = async () => {
    if (rating === 0) return;
    const result = await submitFeedback(rating, comment);
    if (result?.success) {
      setSuccess(true);
      setRating(0);
      setComment("");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
          <p className="text-xs text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* ── Header with Report button ───────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Session Review
            </h1>
            <p className="text-sm text-blue-900 mt-0.5">
              Share your feedback about this mentorship session.
            </p>
          </div>

          {/* Report button — always visible */}
          <button
            type="button"
            onClick={() => setShowReport(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl
              bg-red-50 border border-red-200 text-red-600 text-xs font-bold
              hover:bg-red-100 hover:border-red-300 transition-all shrink"
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
              <path
                d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0
                1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
              />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Report
          </button>
        </div>

        {/* Not completed yet */}
        {!isCompleted && <NotCompletedState />}

        {/* Session completed — show feedback UI */}
        {isCompleted && (
          <div className="flex flex-col gap-5">
            {/* Submit feedback form */}
            {!myFeedback && !success && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <p className="text-sm font-bold text-slate-800">
                  Rate your session with {otherName}
                </p>

                <div>
                  <span id="overall-rating-label" className="text-xs font-semibold text-slate-700 block mb-2">
                    Overall Rating <span className="text-red-400">*</span>
                  </span>
                  <StarRatingInput
                    value={rating}
                    onChange={setRating}
                    disabled={submitting}
                    labelledBy="overall-rating-label"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                    Your Feedback{" "}
                    <span className="text-slate-400 font-normal normal-case">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={`Share what you thought about your session with ${otherName}...`}
                    rows={4}
                    disabled={submitting}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5
                      outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50
                      transition-all resize-none text-slate-700 placeholder:text-slate-400
                      disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {error && (
                  <p className="text-xs text-red-500 font-medium">{error}</p>
                )}

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={rating === 0 || submitting}
                  className="w-50 py-2.5 rounded-xl bg-blue-900 text-white text-xs font-bold
                    hover:bg-blue-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />{" "}
                      Submitting...
                    </>
                  ) : (
                    <>
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
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                      Submit Feedback
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Success banner */}
            {success && (
              <div
                className="flex items-center gap-3 px-4 py-3 bg-emerald-50
                border border-emerald-200 rounded-2xl text-sm font-semibold text-emerald-700"
              >
                <svg
                  width="16"
                  height="16"
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
                Feedback submitted successfully!
              </div>
            )}

            {/* My submitted feedback */}
            {myFeedback && (
              <FeedbackCard
                feedback={myFeedback}
                label="Your Feedback"
                isOwn={true}
              />
            )}

            {/* Their feedback */}
            {theirFeedback ? (
              <FeedbackCard
                feedback={theirFeedback}
                label={`Feedback from ${otherName}`}
                isOwn={false}
              />
            ) : (
              <div
                className="bg-slate-50 border border-dashed border-slate-200
                rounded-2xl p-5 text-center"
              >
                <p className="text-xs font-semibold text-slate-700">
                  Waiting for {otherName} to submit their feedback
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Report Modal ──────────────────────────────────── */}
      {showReport && !reportDone && (
        <ReportModal
          connect={connect}
          onClose={() => setShowReport(false)}
          onSuccess={() => {
            setShowReport(false);
            setReportDone(true);
          }}
        />
      )}

      {/* ── Success Modal ─────────────────────────────────── */}
      {reportDone && <ReportSuccessModal onBack={() => setReportDone(false)} />}
    </>
  );
};
SharedReportTab.propTypes = {
  connect: PropTypes.shape({
    _id: PropTypes.string,
    viewerRole: PropTypes.string,
    mentor: PropTypes.shape({ name: PropTypes.string }),
    mentee: PropTypes.shape({ name: PropTypes.string }),
  }),
  reportRefreshKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default SharedReportTab;
