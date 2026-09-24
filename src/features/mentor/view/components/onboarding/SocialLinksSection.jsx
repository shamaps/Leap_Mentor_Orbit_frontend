// components/mentor/onboarding/SocialLinksSection.jsx
import { useMentorOnboardingForm } from "@/features/mentor/context/MentorOnboardingFormContext";
import FormField from "@/shared/components/FormField";

const GlobeIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#94a3b8"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const LinkedInIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#94a3b8"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const SocialLinksSection = () => {
  const { form, onChange,onBlur } = useMentorOnboardingForm();
  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
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
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </div>
        <h2 className="text-sm font-bold text-slate-800">Social Links</h2>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Portfolio URL */}
        <FormField
          label="Portfolio or Personal Website URL"
          name="portfolioUrl"
          value={form.portfolioUrl}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="https://yourportfolio.com"
          icon={<GlobeIcon />}
        />

        {/* LinkedIn URL */}
        <FormField
          label="LinkedIn Profile URL"
          name="linkedInUrl"
          value={form.linkedInUrl}
          onChange={onChange}
          onBlur={onBlur}
          placeholder="https://linkedin.com/in/yourname"
          icon={<LinkedInIcon />}
        />
      </div>
    </div>
  );
};

export default SocialLinksSection;


