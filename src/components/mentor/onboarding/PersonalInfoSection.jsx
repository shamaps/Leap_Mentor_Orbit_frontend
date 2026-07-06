// components/mentor/onboarding/PersonalInfoSection.jsx
import { useProfilePhotoUpload } from "../../../hooks/useProfilePhotoUpload";
import { useMentorOnboardingForm } from "../../../context/MentorOnboardingFormContext";
import Spinner from "../../common/Spinner";
import FormField from "../../common/FormField";
const PersonalInfoSection = () => {
  const { form, onChange, onBlur } = useMentorOnboardingForm();

  const { fileInputRef, uploading, uploadErr, handlePhotoClick, handleFileChange } =
    useProfilePhotoUpload((url) =>
      onChange({ target: { name: "profilePicture", value: url } }),
    );

  return (
    <div className="bg-white rounded-2xl border border-[#e8edf5] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#e8edf5] bg-[#f8faff]">
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
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h2 className="text-sm font-bold text-[#0f172a]">
          Profile Picture & Bio
        </h2>
      </div>

      <div className="px-6 py-5">
        <div className="flex items-start gap-6">
          {/* Photo upload */}
          <div className="flex flex-col items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handlePhotoClick}
              disabled={uploading}
              className="w-20 h-20 rounded-2xl border-2 border-dashed border-[#bfdbfe] bg-[#eff6ff]
                flex items-center justify-center hover:border-[#2563eb] hover:bg-[#dbeafe]
                transition-all duration-200 overflow-hidden
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {uploading ? (
                /* Spinner while uploading to Cloudinary */
                <Spinner size="md" />
              ) : form.profilePicture ? (
                /* ✅ Shows Cloudinary URL — fast CDN delivery */
                <img
                  src={form.profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#93c5fd"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              )}
            </button>

            <span
              onClick={handlePhotoClick}
              className={`text-xs font-semibold text-blue-900
                ${uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:underline"}`}
            >
              {uploading ? "Uploading..." : "Upload Photo"}
            </span>

            <p className="text-[10px] text-slate-400">PNG, JPG · Max 5MB</p>

            {/* ✅ Upload error */}
            {uploadErr && (
              <p className="text-[10px] text-red-500 text-center max-w-[90px] leading-tight">
                {uploadErr}
              </p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Bio */}
          <div className="flex-1">
            <FormField
              as="textarea"
              label="Professional Bio"
              name="bio"
              value={form.bio}
              onChange={onChange}
              onBlur={onBlur}
              rows={4}
              placeholder="Share your journey, achievements, and what drives you to mentor others..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoSection;
