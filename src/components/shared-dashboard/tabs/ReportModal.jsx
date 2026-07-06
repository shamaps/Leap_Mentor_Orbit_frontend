// src/components/shared-dashboard/tabs/ReportModal.jsx
import { useState, useRef, useEffect } from "react";
import useReportComplaint from "../../../hooks/useReportComplaint";
import PropTypes from "prop-types";
const COMPLAINT_ICONS = {
  inappropriate_behavior: "🚫",
  session_misconduct: "📅",
  fake_credentials: "🎭",
  refund: "💳",
  spam_scam: "🛡️",
  other: "💬",
};

const BASE_COMPLAINT_TYPES = [
  {
    value: "inappropriate_behavior",
    label: "Inappropriate Behavior",
    sub: "Rude, unprofessional, or offensive conduct",
  },
  {
    value: "session_misconduct",
    label: "Session Misconduct",
    sub: "No-show, late cancellation, or misuse of time",
  },
  {
    value: "fake_credentials",
    label: "Fake or Misleading Profile",
    sub: "False credentials, experience, or identity",
  },
  {
    value: "spam_scam",
    label: "Spam, Scam or Solicitation",
    sub: "Unsolicited promotions or fraudulent activity",
  },
  { value: "other", label: "Other", sub: "Something not listed above" },
];

const ReportModal = ({ connect, onClose, onSuccess }) => {
  const [complaintType, setComplaintType] = useState("");
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const COMPLAINT_TYPES = [
    ...BASE_COMPLAINT_TYPES.filter((ct) => ct.value !== "refund"),
    ...(connect?.viewerRole === "mentee"
      ? [
          {
            value: "refund",
            label: " Refund Issue",
            sub: "Request a refund for a session or payment",
          },
        ]
      : []),
  ]
    .reduce((acc, ct) => {
      if (ct.value === "other") return acc; // drop dupes first
      acc.push(ct);
      return acc;
    }, [])
    .concat(BASE_COMPLAINT_TYPES.find((ct) => ct.value === "other"));

  const { submitReport, submitting, error, setError } = useReportComplaint(
    connect?._id,
  );

  const otherName =
    connect?.viewerRole === "mentee"
      ? connect?.mentor?.name || "Mentor"
      : connect?.mentee?.name || "Mentee";

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshot(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    setError(null);
    if (!complaintType) {
      setError("Please select a complaint type.");
      return;
    }
    if (description.trim().length < 10) {
      setError("Description must be at least 10 characters.");
      return;
    }
    const result = await submitReport({
      complaintType,
      description,
      screenshot,
    });
    if (result?.success) onSuccess();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(15,23,42,0.45)",
        backdropFilter: "blur(2px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
        style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}
      >
        {/* ── Header ────────────────────────────────────────── */}
        <div
          style={{ flexShrink: 0 }}
          className="flex items-center justify-between px-6 py-4 border-b border-slate-100"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                Report an Issue
              </p>
              <p className="text-xs text-blue-900">Reporting {otherName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg
              text-slate-600 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Scrollable body ────────────────────────────────── */}
        <div
          style={{ overflowY: "auto", flexGrow: 1 }}
          className="px-6 py-5 space-y-5"
        >
          {/* Confidentiality notice */}
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span className="text-xs text-blue-700 leading-relaxed">
              Your report is confidential and will be reviewed by our team
              within 24 hours.
            </span>
          </div>

          {/* Complaint type — list style */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">
              Complaint Type <span className="text-red-400">*</span>
            </label>
            <div className="flex flex-col rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
              {COMPLAINT_TYPES.map((ct) => {
                const selected = complaintType === ct.value;
                return (
                  <button
                    key={ct.value}
                    type="button"
                    onClick={() => setComplaintType(ct.value)}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors
                      ${selected ? "bg-red-50" : "bg-white hover:bg-slate-50"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0
                        ${selected ? "bg-red-100" : "bg-slate-100"}`}
                      >
                        {COMPLAINT_ICONS[ct.value]}
                      </span>
                      <div>
                        <p
                          className={`text-m font-medium ${selected ? "text-red-700" : "text-slate-700"}`}
                        >
                          {ct.label}
                        </p>
                        <p className="text-[14px] text-blue-900 mt-0.5">
                          {ct.sub}
                        </p>
                      </div>
                    </div>
                    {selected ? (
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        style={{ flexShrink: 0 }}
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#cbd5e1"
                        strokeWidth="2"
                        strokeLinecap="round"
                        style={{ flexShrink: 0 }}
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Describe the issue <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe what happened in detail..."
              rows={4}
              maxLength={1000}
              disabled={submitting}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5
                outline-none focus:border-red-300 focus:ring-2 focus:ring-red-50
                transition-all resize-none text-slate-700 placeholder:text-slate-600
                disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <p className="text-[10px] text-slate-600 text-right mt-1">
              {description.length}/1000
            </p>
          </div>

          {/* Screenshot */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Screenshot{" "}
              <span className="text-slate-600 font-normal">(optional)</span>
            </label>
            {preview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200">
                <img
                  src={preview}
                  alt="preview"
                  className="w-full max-h-40 object-cover"
                />
                <button
                  type="button"
                  onClick={removeScreenshot}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-slate-800/70
                    text-white flex items-center justify-center hover:bg-slate-800 transition-all"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-200 rounded-xl
                  py-5 flex flex-col items-center gap-2 text-slate-600
                  hover:border-slate-300 hover:text-slate-700 transition-all"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span className="text-xs font-medium">
                  Click to upload screenshot
                </span>
                <span className="text-[10px]">JPG, PNG, WEBP · Max 10MB</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-100 rounded-xl">
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-1 pb-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs
                font-bold text-slate-600 hover:bg-slate-50 transition-all
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs
                font-bold hover:bg-red-600 transition-all
                disabled:opacity-40 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
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
                  >
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  Submit Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
ReportModal.propTypes = {
  connect: PropTypes.shape({
    _id: PropTypes.string,
    viewerRole: PropTypes.oneOf(["mentor", "mentee"]),
    mentor: PropTypes.shape({ name: PropTypes.string }),
    mentee: PropTypes.shape({ name: PropTypes.string }),
  }),
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};
export default ReportModal;
