// components/mentee/onboarding/SocialLinksSection.jsx
import { useMenteeOnboardingForm } from "../../../context/MenteeOnboardingFormContext";

const inputClass = "w-full text-sm text-slate-800 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 pl-10 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 hover:border-slate-400 transition-all duration-150";

const SocialLinksSection = () => {
  const { form, handleChange } = useMenteeOnboardingForm();
  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-blue-50 bg-blue-50">
        <div className="w-7 h-7 rounded-lg bg-blue-900 flex items-center justify-center shrink-0">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </div>
        <h2 className="text-sm font-bold text-slate-800">Social Links</h2>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* LinkedIn */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">LinkedIn URL</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" />
              </svg>
            </span>
            <input
              name="linkedInUrl"
              value={form.linkedInUrl}
              onChange={handleChange}
              className={inputClass}
              placeholder="LinkedIn URL"
            />
          </div>
        </div>

        {/* Portfolio */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Portfolio URL</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </span>
            <input
              name="portfolioUrl"
              value={form.portfolioUrl}
              onChange={handleChange}
              className={inputClass}
              placeholder="Portfolio URL"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialLinksSection;