// components/mentor/verification/ResumeUpload.jsx
import type { ChangeEvent, DragEvent } from "react";

const ACCEPTED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
const ACCEPTED_LABEL = "PDF, JPG, PNG, WEBP";
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

interface ResumeUploadProps {
  file: File | null;
  onChange: (file: File | null, error: string | null) => void;
  error?: string | null;
}

const ResumeUpload = ({ file, onChange, error }: ResumeUploadProps) => {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!ACCEPTED_TYPES.has(selected.type)) {
      onChange(
        null,
        `File type not supported. Please upload: ${ACCEPTED_LABEL}`,
      );
      return;
    }
    if (selected.size > MAX_SIZE) {
      onChange(null, "File too large. Maximum size is 10MB.");
      return;
    }
    onChange(selected, null);
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (!dropped) return;
    if (!ACCEPTED_TYPES.has(dropped.type)) {
      onChange(
        null,
        `File type not supported. Please upload: ${ACCEPTED_LABEL}`,
      );
      return;
    }
    if (dropped.size > MAX_SIZE) {
      onChange(null, "File too large. Maximum size is 10MB.");
      return;
    }
    onChange(dropped, null);
  };

  const handleRemove = () => onChange(null, null);

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-blue-50 bg-blue-50">
        <div className="w-8 h-8 rounded-xl bg-blue-900 flex items-center justify-center shrink-0">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">
            Resume <span className="text-red-400">*</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload your latest resume or CV
          </p>
        </div>
      </div>

      <div className="px-6 py-5">
        {file ? (
          <div className="flex items-center justify-between gap-3 border border-green-200 bg-green-50 rounded-xl px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#16a34a"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-700 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-slate-400">
                  {(file.size / 1024).toFixed(0)} KB
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
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
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ) : (
          <label
            aria-label="Upload resume file"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl px-6 py-8 cursor-pointer transition-all duration-150
              ${error
                ? "border-red-300 bg-red-50 hover:bg-red-50"
                : "border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50"
              }`}
          >
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#64748b"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="16 16 12 12 8 16" />
                <line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">
                Drop your resume here or{" "}
                <span className="text-blue-600">browse</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {ACCEPTED_LABEL} · Max 10MB
              </p>
            </div>
          </label>
        )}

        {error && (
          <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default ResumeUpload;