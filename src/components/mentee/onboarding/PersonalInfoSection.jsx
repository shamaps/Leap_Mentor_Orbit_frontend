// components/mentee/onboarding/PersonalInfoSection.jsx
import { useRef, useState } from "react";
import axiosInstance from "../../../utils/axiosInstance";
import { useMenteeOnboardingForm } from "../../../context/MenteeOnboardingFormContext";

const PersonalInfoSection = () => {
  const { form, handleChange } = useMenteeOnboardingForm();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadErr("Only image files are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadErr("Image must be under 5MB.");
      return;
    }

    setUploadErr("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("profilePicture", file);

      const res = await axiosInstance.post(
        "/upload/profile-picture",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      handleChange({
        target: {
          name: "profilePicture",
          value: res.data.url,
        },
      });
    } catch (err) {
      setUploadErr(
        err?.response?.data?.message ||
          "Failed to upload image. Please try again.",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-[#e8edf5] shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#e8edf5] bg-[#f8faff]">
        <div className="w-7 h-7 rounded-lg bg-blue-900 flex items-center justify-center shrink-0">
          <svg
            width="13"
            height="13"
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
        <h2 className="text-sm font-bold text-slate-800">
          Profile Picture & Bio
        </h2>
      </div>

      <div className="px-6 py-5 flex items-start gap-6">
        {/* Photo upload */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => !uploading && fileInputRef.current?.click()}
            disabled={uploading}
            className="w-20 h-20 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50
              flex items-center justify-center hover:border-blue-400 hover:bg-blue-100
              transition-all duration-200 overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <div className="w-6 h-6 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
            ) : form.profilePicture ? (
              <img
                src={form.profilePicture}
                alt="Profile"
                className="w-full h-full object-cover"
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
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </button>

          <span
            className={`text-xs font-semibold text-blue-900
              ${uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:underline"}`}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            {uploading ? "Uploading..." : "Upload Photo"}
          </span>

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
          <label className="block text-xs font-semibold text-[#475569] mb-2">
            Bio
          </label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={4}
            placeholder="Tell us about your background, career aspirations, and what you're looking for in a mentor..."
            className="w-full text-sm text-[#0f172a] bg-[#f8faff] border border-[#e2e8f0]
              rounded-xl px-3.5 py-2.5 outline-none placeholder:text-[#94a3b8]
              focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb20]
              resize-none transition-all duration-150"
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoSection;
