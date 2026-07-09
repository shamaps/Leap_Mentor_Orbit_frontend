// components/mentee/onboarding/PersonalInfoSection.jsx
import { useProfilePhotoUpload } from "../../../hooks/useProfilePhotoUpload";
import { useMenteeOnboardingForm } from "../../../context/MenteeOnboardingFormContext";
import PersonIcon from "../../common/PersonIcon";
const PersonalInfoSection = () => {
  const { form, errors = {},onBlur, handleChange } = useMenteeOnboardingForm();

  const { fileInputRef, uploading, uploadErr, handlePhotoClick, handleFileChange } =
    useProfilePhotoUpload((url) =>
      handleChange({ target: { name: "profilePicture", value: url } }),
    );
  let avatarButtonContent;
  if (uploading) {
    avatarButtonContent = (
      <div className="w-6 h-6 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
    );
  } else if (form.profilePicture) {
    avatarButtonContent = (
      <img
        src={form.profilePicture}
        alt="Profile"
        className="w-full h-full object-cover"
      />
    );
  } else {
    avatarButtonContent = (
      <PersonIcon size={22} stroke="#93c5fd" strokeWidth="2" />
    );
  }
  return (
    <div className="bg-white rounded-2xl border border-[#e8edf5] shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#e8edf5] bg-[#f8faff]">
        <div className="w-7 h-7 rounded-lg bg-blue-900 flex items-center justify-center shrink-0">
          <PersonIcon />
        </div>
        <h2 className="text-sm font-bold text-slate-800">
          Profile Picture & Bio
        </h2>
      </div>

      <div className="px-6 py-5 flex items-start gap-6">
        {/* Photo upload */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePhotoClick}
            disabled={uploading}
            className="w-20 h-20 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50
              flex items-center justify-center hover:border-blue-400 hover:bg-blue-100
              transition-all duration-200 overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {avatarButtonContent}
          </button>

          <button
            type="button"
            onClick={handlePhotoClick}
            disabled={uploading}
            className={`bg-transparent border-none p-0 text-xs font-semibold text-blue-900
              ${uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:underline"}`}
          >
            {uploading ? "Uploading..." : "Upload Photo"}
          </button>

          <p className="text-[10px] text-slate-400">PNG, JPG · Max 5MB</p>

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
          <label htmlFor="bio" className="block text-xs font-semibold text-[#475569] mb-2">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={4}
            onBlur={onBlur}
            placeholder="Tell us about your background, career aspirations, and what you're looking for in a mentor..."
            className="w-full text-sm text-[#0f172a] bg-[#f8faff] border border-[#e2e8f0]
              rounded-xl px-3.5 py-2.5 outline-none placeholder:text-[#94a3b8]
              focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb20]
              resize-none transition-all duration-150"
          />
          {errors.bio && (
            <p className="text-xs text-red-400 mt-1">
              Bio must be at least 10 characters.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoSection;
