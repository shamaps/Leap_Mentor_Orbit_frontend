// components/mentee/onboarding/ProfessionalDetailsSection.jsx
import { useMenteeOnboardingForm } from "../../../context/MenteeOnboardingFormContext";
import FormField from "@/components/common/FormField";
const EXPERIENCE_OPTIONS = [
  "Student / Aspiring",
  "0-1 Years",
  "1-3 Years",
  "3-5 Years",
  "5-10 Years",
  "10+ Years",
];

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

const ProfessionalDetailsSection = () => {
  const { form, handleChange, onBlur, errors = {} } = useMenteeOnboardingForm();
  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-blue-50 bg-blue-50">
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
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          </svg>
        </div>
        <h2 className="text-sm font-bold text-slate-800">
          Professional Details
        </h2>
      </div>

      <div className="px-6 py-5">
        <div className="grid grid-cols-2 gap-4">
          {/* Current Role */}
          <FormField
            label="Current Role"
            required
            name="currentRole"
            value={form.currentRole}
            onChange={handleChange}
            onBlur={onBlur}
            placeholder="e.g. Junior Product Designer"
            error={errors.currentRole && "Current role is required."}
          />

          {/* Years of Experience */}
          <FormField
            as="select"
            label="Years of Experience"
            required
            name="yearsOfExperience"
            value={form.yearsOfExperience ?? ""}
            onChange={handleChange}
            onBlur={onBlur}
            error={errors.yearsOfExperience && "Please select your experience."}
          >
            <option value="">Select Experience</option>
            {EXPERIENCE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </FormField>

          {/* Company */}
          <FormField
            label="Company / Organization"
            name="company"
            value={form.company}
            onChange={handleChange}
            onBlur={onBlur}
            placeholder="Company Name / Organization"
          />

          {/* Industry */}
          <FormField
            as="select"
            label="Industry"
            required
            name="industry"
            value={form.industry ?? ""}
            onChange={handleChange}
            onBlur={onBlur}
            error={errors.industry && "Please select an industry."}
          >
            <option value="">Select Industry</option>
            {INDUSTRY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </FormField>
      </div>
    </div>
  </div>
  );
};

export default ProfessionalDetailsSection;
