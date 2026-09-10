// components/mentor/onboarding/ProfessionalInfoSection.jsx
import { forwardRef } from "react";
import { useMentorOnboardingForm } from "@/features/mentor/context/MentorOnboardingFormContext";

const INDUSTRY_OPTIONS = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Design",
  "Marketing",
  "Legal",
  "Consulting",
  "Media",
  "Engineering",
  "Other",
];

const inputClass = (hasError) =>
  `w-full text-sm text-slate-800 bg-white border rounded-xl px-3.5 py-2.5 outline-none placeholder:text-slate-400 focus:ring-2 transition-all duration-150 hover:border-slate-400 ${
    hasError
      ? "border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-100"
      : "border-slate-300 focus:border-blue-400 focus:ring-blue-100"
  }`;

const selectClass = (hasError, hasValue) => {
  if (hasError) {
    return "w-full text-sm bg-white border rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 transition-all duration-150 hover:border-slate-400 appearance-none cursor-pointer pr-8 border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-100 text-slate-800";
  }
  const textColor = hasValue ? "text-slate-800" : "text-slate-400";
  return `w-full text-sm bg-white border rounded-xl px-3.5 py-2.5 outline-none focus:ring-2 transition-all duration-150 hover:border-slate-400 appearance-none cursor-pointer pr-8 border-slate-300 focus:border-blue-400 focus:ring-blue-100 ${textColor}`;
};

const ProfessionalInfoSection = forwardRef((_, ref) => {
  const { form, onChange, errors = {} } = useMentorOnboardingForm();
  return (
    <div
      ref={ref}
      className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden"
    >
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
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          </svg>
        </div>
        <h2 className="text-sm font-bold text-slate-800">Professional Info</h2>
      </div>

      <div className="px-6 py-5">
        <div className="grid grid-cols-2 gap-4">
          {/* Current Role */}
          <div>
            <label htmlFor="currentRole" className="block text-xs font-semibold text-slate-500 mb-2">
              Current Role <span className="text-blue-900">*</span>
            </label>
            <input
              id="currentRole"
              name="currentRole"
              value={form.currentRole}
              onChange={onChange}
              className={inputClass(errors.currentRole)}
              placeholder="e.g. Senior Product Designer"
            />
            {errors.currentRole && (
              <p className="text-xs text-red-400 mt-1">
                Current role is required.
              </p>
            )}
          </div>

          {/* Industry */}
          <div>
            <label
              htmlFor="industry"
              className="block text-xs font-semibold text-slate-500 mb-2"
            >
              Industry <span className="text-blue-900">*</span>
            </label>
            <div className="relative">
              <select
                id="industry"
                name="industry"
                value={form.industry}
                onChange={onChange}
                className={selectClass(errors.industry, !!form.industry)}
              >
                <option value="" disabled className="text-slate-400">
                  Select industry
                </option>
                {INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="text-slate-800">
                    {opt}
                  </option>
                ))}
              </select>
              {/* Custom arrow */}
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </div>
            {errors.industry && (
              <p className="text-xs text-red-400 mt-1">
                Please select an industry.
              </p>
            )}
          </div>

          {/* Company */}
          <div>
            <label htmlFor="company" className="block text-xs font-semibold text-slate-500 mb-2">
              Company
            </label>
            <input
              id="company"
              name="company"
              value={form.company}
              onChange={onChange}
              className={inputClass(false)}
              placeholder="e.g. Google, Startup Inc."
            />
          </div>

          {/* Educational Qualifications */}
          <div className="col-span-2">
            <label htmlFor="education" className="block text-xs font-semibold text-slate-500 mb-2">
              Educational Qualifications
            </label>
            <input
              id="education"
              name="education"
              value={form.education || ""}
              onChange={onChange}
              className={inputClass(false)}
              placeholder="e.g. B.Tech in Computer Science, MBA"
            />
          </div>

          {/* Years of Experience */}
          <div>
            <label htmlFor="yearsOfExperience" className="block text-xs font-semibold text-slate-500 mb-2">
              Years of Experience <span className="text-blue-900">*</span>
            </label>
            <input
              id="yearsOfExperience"
              name="yearsOfExperience"
              type="number"
              value={form.yearsOfExperience}
              onChange={onChange}
              className={inputClass(errors.yearsOfExperience)}
              placeholder="e.g. 8"
            />
            {errors.yearsOfExperience && (
              <p className="text-xs text-red-400 mt-1">
                Years of experience is required.
              </p>
            )}
          </div>

          {/* Session Rate */}
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-2">
              Session Rate (Leap Points){" "}
              <span className="text-slate-400 font-normal">
                (1 LP – 100 LP)
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-semibold"></span>
              <input
                name="hourlyRate"
                type="number"
                max="100"
                value={form.hourlyRate}
                onChange={onChange}
                className={inputClass(false) + " pl-7"}
                placeholder="e.g. 50"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ProfessionalInfoSection.displayName = "ProfessionalInfoSection";
export default ProfessionalInfoSection;
