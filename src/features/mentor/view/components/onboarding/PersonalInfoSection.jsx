// components/mentor/onboarding/PersonalInfoSection.jsx
import { useProfilePhotoUpload } from "@/features/uploads/model/useProfilePhotoUpload";
import { useMentorOnboardingForm } from "@/features/mentor/context/MentorOnboardingFormContext";
import FormField from "@/shared/components/FormField";
import PersonIcon from "@/shared/components/PersonIcon";
const PersonalInfoSection = () => {
  const { form, errors = {}, onChange, onBlur } = useMentorOnboardingForm();

  const { fileInputRef, uploading, uploadErr, handlePhotoClick, handleFileChange } =
    useProfilePhotoUpload((url) =>
      onChange({ target: { name: "profilePicture", value: url } }),
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
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#e8edf5] bg-[#f8faff]">
        <div className="w-8 h-8 rounded-xl bg-blue-900 flex items-center justify-center shrink-0">
          <PersonIcon size={14} />
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

            {/*  Upload error */}
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
              error={errors.bio ? "Bio must be at least 10 characters." : undefined}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoSection;
