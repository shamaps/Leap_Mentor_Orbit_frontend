// components/mentor/profile/MentorEditProfileShell.jsx
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import useMentorEditProfile from "@/features/mentor/presenter/useMentorEditProfile";
import { MentorOnboardingFormContext } from "@/features/mentor/context/MentorOnboardingFormContext";
import PersonalInfoSection from "../onboarding/PersonalInfoSection";
import ProfessionalInfoSection from "../onboarding/ProfessionalInfoSection";
import SkillsSection from "../onboarding/SkillsSection";
import PreferencesSection from "../onboarding/PreferencesSection";
import SocialLinksSection from "../onboarding/SocialLinksSection";
import { IMAGES } from "@/shared/constants/images";
const MentorEditProfileShell = () => {
  const navigate = useNavigate();
  const { form, loading, fetchLoading, msg, handleChange, handleSubmit } =
    useMentorEditProfile();

  // alias handleChange → onChange to match what mentor sections expect
  // NOTE: must run before the fetchLoading early return below, so this hook
  // is called on every render regardless of loading state (Rules of Hooks).
  const ctxValue = useMemo(() => ({ form, errors: {} as Record<string, boolean | string>, onChange: handleChange }), [form, handleChange]);

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-[#f0f4ff] flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-[#2563eb]/30 border-t-[#2563eb] animate-spin" />
      </div>
    );
  }

  return (
    <MentorOnboardingFormContext.Provider value={ctxValue}>
      <div
        className="min-h-screen bg-[#f0f4ff]"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

        <div className="h-1 w-full bg-[#2563eb]" />

        <header className="sticky top-0 z-10 bg-white border-b border-[#e8edf5] shadow-sm">
          <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={IMAGES.logo}
                alt="LeapMentor logo"
                className="h-8 w-8"
                width={32}
                height={32}
              />
              <span className="text-sm font-bold text-[#0f172a]">
                Edit Profile
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate("/dashboard/mentor")}
              className="text-xs font-semibold text-slate-500 hover:text-[#475569] transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
        </header>

        <div className="max-w-2xl mx-auto px-6 pt-8 pb-2">
          <h1 className="text-2xl font-bold text-[#0f172a]">
            Update Your Profile
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Make changes to your profile and save when done.
          </p>
        </div>

        <main className="max-w-2xl mx-auto px-6 py-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <PersonalInfoSection />
            <ProfessionalInfoSection />
            <SkillsSection />
            <PreferencesSection />
            <SocialLinksSection />

            {msg.text && (
              <div
                className={`flex items-center gap-2.5 text-sm rounded-xl px-4 py-3 border ${msg.type === "success"
                  ? "bg-[#f0fdf4] border-[#bbf7d0] text-[#16a34a]"
                  : "bg-[#fff1f2] border-[#fecdd3] text-[#e11d48]"
                  }`}
              >
                <span>{msg.type === "success" ? "✓" : "⚠"}</span>
                {msg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 shadow-md shadow-[#2563eb30]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />{" "}
                  Saving changes…
                </span>
              ) : (
                "Save Changes →"
              )}
            </button>

            <p className="text-center text-xs text-slate-500 pb-8">
              You can always edit your profile from the dashboard.
            </p>
          </form>
        </main>
      </div>
    </MentorOnboardingFormContext.Provider>
  );
};

export default MentorEditProfileShell;