// components/mentee/onboarding/ProfessionalDetailsSection.jsx
import { useMenteeOnboardingForm } from "../../../context/MenteeOnboardingFormContext";

const EXPERIENCE_OPTIONS = [
  "Student / Aspiring",
  "0-1 Years",
  "1-3 Years",
  "3-5 Years",
  "5-10 Years",
  "10+ Years",
];

const INDUSTRY_OPTIONS = [
  "Technology", "Finance", "Healthcare", "Education", "Design",
  "Marketing", "Legal", "Consulting", "Media", "Engineering", "Other",
];

// Removed text-slate-800 from base class so selects can control their own text color
const inputClass = "w-full text-sm text-slate-800 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 hover:border-slate-400 transition-all duration-150";
const selectBaseClass = "w-full text-sm bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 hover:border-slate-400 transition-all duration-150 appearance-none pr-8";
const errorClass = "border-red-400 focus:border-red-400 focus:ring-red-100 hover:border-red-400";

const ChevronDown = () => (
  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  </span>
);

const ProfessionalDetailsSection = () => {
  const { form, handleChange, errors = {} } = useMenteeOnboardingForm();
  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-blue-50 bg-blue-50">
        <div className="w-7 h-7 rounded-lg bg-blue-900 flex items-center justify-center shrink-0">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          </svg>
        </div>
        <h2 className="text-sm font-bold text-slate-800">Professional Details</h2>
      </div>

      <div className="px-6 py-5">
        <div className="grid grid-cols-2 gap-4">
          {/* Current Role */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">
              Current Role <span className="text-blue-900">*</span>
            </label>
            <input
              name="currentRole"
              value={form.currentRole}
              onChange={handleChange}
              className={`${inputClass} ${errors.currentRole ? errorClass : ""}`}
              placeholder="e.g. Junior Product Designer"
            />
            {errors.currentRole && (
              <p className="text-[10px] text-red-500 mt-1">Current role is required.</p>
            )}
          </div>

          {/* Years of Experience */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">
              Years of Experience <span className="text-blue-900">*</span>
            </label>
            <div className="relative">
              <select
                name="yearsOfExperience"
                value={form.yearsOfExperience ?? ""}
                onChange={handleChange}
                className={`${selectBaseClass} ${form.yearsOfExperience ? "text-slate-800" : "text-slate-400"} ${errors.yearsOfExperience ? errorClass : ""}`}
              >
                <option value="" className="text-slate-400">Select Experience</option>
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="text-slate-800">{opt}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
            {errors.yearsOfExperience && (
              <p className="text-[10px] text-red-500 mt-1">Please select your experience.</p>
            )}
          </div>

          {/* Company */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">Company / Organization</label>
            <input
              name="company"
              value={form.company}
              onChange={handleChange}
              className={inputClass}
              placeholder="Company Name / Organization"
            />
          </div>

          {/* Industry */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2">
              Industry <span className="text-blue-900">*</span>
            </label>
            <div className="relative">
              <select
                name="industry"
                value={form.industry ?? ""}
                onChange={handleChange}
                className={`${selectBaseClass} ${form.industry ? "text-slate-800" : "text-slate-400"} ${errors.industry ? errorClass : ""}`}
              >
                <option value="" className="text-slate-400">e.g. Fintech, Healthcare</option>
                {INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt} className="text-slate-800">{opt}</option>
                ))}
              </select>
              <ChevronDown />
            </div>
            {errors.industry && (
              <p className="text-[10px] text-red-500 mt-1">Please select an industry.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalDetailsSection;