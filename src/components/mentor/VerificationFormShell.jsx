// components/mentor/verification/VerificationFormShell.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useVerificationSubmit } from "../../hooks/useVerificationSubmit";
import FullScreenLoader from "@/components/common/FullScreenLoader";
import PhoneNumberField from "./PhoneNumberField";
import ResumeUpload from "./ResumeUpload";
import WorkExperienceUpload from "./WorkExperienceUpload";
import VerificationInstructionsModal from "./VerificationInstructionsModal"; 
import { IMAGES } from "../../constants/images";
const VerificationFormShell = () => {
  const navigate = useNavigate();

  // ── Form state ──
  const [phoneNumber, setPhoneNumber] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [workExperienceFiles, setWorkExperienceFiles] = useState([]);
  const [redirecting, setRedirecting] = useState(false);
  const [showModal, setShowModal] = useState(true); 

  // ── Error state — per field ──
  const [errors, setErrors] = useState({
    phoneNumber: "",
    resumeFile: "",
    workExperienceFiles: "",
  });

  // ── Submission state ──
  const { loading, msg, submitVerification } = useVerificationSubmit();

  // ── Handlers ──
  const handlePhoneChange = (e) => {
    setPhoneNumber(e.target.value);
    if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: "" }));
  };

  const handleResumeChange = (file, error) => {
    setResumeFile(file);
    setErrors((prev) => ({ ...prev, resumeFile: error || "" }));
  };

  const handleWorkExpChange = (files, error) => {
    setWorkExperienceFiles(files);
    setErrors((prev) => ({ ...prev, workExperienceFiles: error || "" }));
  };

  // ── Validation ──
  const validate = () => {
    const newErrors = {};
    if (!phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required";
    if (!resumeFile) newErrors.resumeFile = "Resume is required";
    return newErrors;
  };

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...validationErrors }));
      return;
    }

    const result = await submitVerification({
      phoneNumber,
      resumeFile,
      workExperienceFiles,
    });

    if (result.success) {
      setRedirecting(true);
      setTimeout(() => navigate("/dashboard/mentor"), 1500);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#f0f4ff]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* 3. MODAL — right here, first thing inside the root div */}
      {showModal && (
        <VerificationInstructionsModal onClose={() => setShowModal(false)} />
      )}

      {redirecting && <FullScreenLoader message="Submitting documents..." />}

      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

      {/* Top accent bar */}
      <div className="h-1 w-full bg-blue-900" />

      {/* Sticky header */}
      <header className="sticky top-0 z-10 bg-white border-b border-[#e8edf5] shadow-sm">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src={IMAGES.logo} 
              alt="Leapmentor logo"
              className="h-8 w-auto"
            />
            <span className="text-sm font-bold text-[#0f172a]">
              Mentor Verification
            </span>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Step 2 of 2
          </span>
        </div>
      </header>

      {/* Page title */}
      <div className="max-w-2xl mx-auto px-6 pt-8 pb-2">
        <h1 className="text-2xl font-bold text-[#0f172a]">
          Verify Your Profile
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Submit your documents so our team can verify your credentials. This
          usually takes 1–2 business days.
        </p>
      </div>

      {/* Info banner */}
      <div className="max-w-2xl mx-auto px-6 pt-4">
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
          <svg
            className="shrink-0 mt-0.5"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-xs text-blue-700 leading-relaxed">
            Your documents are stored securely and only reviewed by the
            LeapMentor admin team. They will not be shared with mentees.
          </p>
        </div>
      </div>

      {/* Form */}
      <main className="max-w-2xl mx-auto px-6 py-6">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <PhoneNumberField
            value={phoneNumber}
            onChange={handlePhoneChange}
            error={errors.phoneNumber}
          />

          <ResumeUpload
            file={resumeFile}
            onChange={handleResumeChange}
            error={errors.resumeFile}
          />

          <WorkExperienceUpload
            files={workExperienceFiles}
            onChange={handleWorkExpChange}
            error={errors.workExperienceFiles}
          />

          {msg.type === "error" && msg.text && (
            <div className="flex items-center gap-2.5 text-sm rounded-xl px-4 py-3 border bg-[#fff1f2] border-[#fecdd3] text-[#e11d48]">
              <span>⚠</span>
              {msg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white bg-blue-900 hover:bg-[#1d4ed8] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 shadow-md shadow-[#2563eb30]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />{" "}
                Uploading documents…
              </span>
            ) : (
              "Submit for Verification →"
            )}
          </button>
        </form>
      </main>
    </div>
  );
};

export default VerificationFormShell;
