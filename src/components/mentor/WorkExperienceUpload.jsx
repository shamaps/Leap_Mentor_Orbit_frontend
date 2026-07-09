// components/mentor/verification/WorkExperienceUpload.jsx
import PropTypes from "prop-types";
const ACCEPTED_TYPES = new Set(["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"]);
const MAX_FILES = 3;
const MAX_SIZE = 10 * 1024 * 1024; // 10MB per file

const WorkExperienceUpload = ({ files, onChange, error }) => {

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    const combined = [...files, ...selected];

    if (combined.length > MAX_FILES) {
      onChange(files, `Maximum ${MAX_FILES} files allowed`);
      return;
    }

    const invalid = selected.find((f) => !ACCEPTED_TYPES.has(f.type));
    if (invalid) {
      onChange(files, "Only PDF, JPG, PNG, WEBP files are allowed");
      return;
    }

    const tooLarge = selected.find((f) => f.size > MAX_SIZE);
    if (tooLarge) {
      onChange(files, "Each file must be under 10MB");
      return;
    }

    onChange(combined, null);
    // reset input so same file can be re-added after remove
    e.target.value = "";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    const combined = [...files, ...dropped];

    if (combined.length > MAX_FILES) {
      onChange(files, `Maximum ${MAX_FILES} files allowed`);
      return;
    }
    const invalid = dropped.find((f) => !ACCEPTED_TYPES.has(f.type));
    if (invalid) {
      onChange(files, "Only PDF, JPG, PNG, WEBP files are allowed");
      return;
    }
    const tooLarge = dropped.find((f) => f.size > MAX_SIZE);
    if (tooLarge) {
      onChange(files, "Each file must be under 10MB");
      return;
    }
    onChange(combined, null);
  };

  const handleRemove = (index) => {
    onChange(files.filter((_, i) => i !== index), null);
  };

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-blue-50 bg-blue-50">
        <div className="w-8 h-8 rounded-xl bg-blue-900 flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">Work Experience Proof</h2>
          <p className="text-xs text-slate-500 mt-0.5">Offer letter, payslip, or experience letter · Up to {MAX_FILES} files</p>
        </div>
      </div>

      <div className="px-6 py-5 space-y-3">

        {/* Uploaded files list */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, index) => (
              <div
                key={`${file.name}-${file.size}-${index}`}
                className="flex items-center justify-between gap-3 border border-green-200 bg-green-50 rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Drop zone — hide when max reached */}
        {files.length < MAX_FILES && (
          <label
            aria-label="Upload work experience files"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl px-6 py-6 cursor-pointer transition-all duration-150
              ${error
                ? "border-red-300 bg-red-50"
                : "border-slate-200 bg-slate-50 hover:border-blue-400 hover:bg-blue-50"
              }`}
          >
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 16 12 12 8 16" />
                <line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
              </svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">
                Drop files here or <span className="text-blue-600">browse</span>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                PDF, JPG, PNG, WEBP · Max 10MB each · {files.length}/{MAX_FILES} uploaded
              </p>
            </div>
          </label>
        )}

        {error && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <span>⚠</span> {error}
          </p>
        )}
      </div>
    </div>
  );
};
WorkExperienceUpload.propTypes = {
  files: PropTypes.arrayOf(PropTypes.instanceOf(File)).isRequired,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
};

export default WorkExperienceUpload;