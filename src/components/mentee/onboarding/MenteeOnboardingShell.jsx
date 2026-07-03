// components/mentee/onboarding/MenteeOnboardingShell.jsx
import { useState, useRef } from "react";
import useMenteeOnboarding from "../../../hooks/useMenteeOnboarding";
import { MenteeOnboardingFormContext } from "../../../context/MenteeOnboardingFormContext";
import { getMenteeFieldErrors } from "../../../utils/onboardingValidation";
import PersonalInfoSection from "./PersonalInfoSection";
import ProfessionalDetailsSection from "./ProfessionalDetailsSection";
import InterestedFieldsSection from "./InterestedFieldsSection";
import MentorshipPrefsSection from "./MentorshipPrefsSection";
import SocialLinksSection from "./SocialLinksSection";
import OnboardingProgressBar from "../../../ui/OnboardingProgressBar";
import FullScreenLoader from "@/components/common/FullScreenLoader";

import { MENTEE_ONBOARDING_FIELDS } from "../../../config/onboardingFields";

const MenteeOnboardingShell = () => {
  const { form, loading, msg, redirecting, handleChange, handleSubmit } =
    useMenteeOnboarding();
  const [errors, setErrors] = useState({});

  // ── Refs for custom tag-input sections that have no real name= in the DOM ──
  const sectionRefs = {
    interestedFields: useRef(null),
    skills: useRef(null),
  };

  // shared util replaces the duplicate validate() block
  const validate = () => getMenteeFieldErrors(form);

  const scrollToFirstError = (errorKeys) => {
    if (!errorKeys.length) return;
    const firstKey = errorKeys[0];
    const el =
      document.querySelector(`[name="${firstKey}"]`) ||
      document.querySelector(`[data-field="${firstKey}"]`) ||
      sectionRefs[firstKey]?.current;
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Clears the error for a field as soon as the user starts filling it
  const onChange = (e) => {
    const { name } = e.target;
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    handleChange(e);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      scrollToFirstError(Object.keys(newErrors));
      return;
    }
    setErrors({});
    handleSubmit(e);
  };

  //  context value — only form/errors/onChange; loading/msg/submit stay local
  const ctxValue = { form, errors, handleChange: onChange };

  return (
    <MenteeOnboardingFormContext.Provider value={ctxValue}>
      <div className="min-h-screen bg-[#f0f4ff]">
        {redirecting && (
          <FullScreenLoader message="Setting up your profile..." />
        )}

        {/* Top accent */}
        <div className="h-1 w-full bg-blue-900" />

        {/* Sticky header */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-100 shadow-sm">
          <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src="/images/logo.png"
                alt="Leapmentor logo"
                className="h-8 w-auto"
              />
              <span className="text-sm font-bold text-slate-800">
                Leapmentor
              </span>
            </div>
          </div>
        </header>

        {/* Progress bar */}
        <OnboardingProgressBar form={form} fields={MENTEE_ONBOARDING_FIELDS} />

        {/* Page title */}
        <div className="max-w-2xl mx-auto px-6 pt-8 pb-2">
          <h1 className="text-2xl font-bold text-slate-900">
            Mentee Onboarding
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Complete your profile and find the perfect mentor to accelerate your
            career.
          </p>
        </div>

        {/* Form */}
        <main className="max-w-2xl mx-auto px-6 py-6">
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <PersonalInfoSection />
            <ProfessionalDetailsSection />

            <InterestedFieldsSection ref={sectionRefs.interestedFields} />

            <MentorshipPrefsSection />
            <SocialLinksSection />

            {/* Status message */}
            {msg.text && (
              <div
                className={`flex items-center gap-2 text-sm rounded-xl px-4 py-3 border ${
                  msg.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-red-50 border-red-200 text-red-600"
                }`}
              >
                <span>{msg.type === "success" ? "✓" : "⚠️"}</span>
                {msg.text}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white bg-blue-900 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 shadow-md shadow-blue-200"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  Saving profile...
                </span>
              ) : (
                "Complete Profile →"
              )}
            </button>

            <p className="text-center text-xs text-slate-400 pb-8">
              You can always edit your profile from the dashboard.
            </p>
          </form>
        </main>
      </div>
    </MenteeOnboardingFormContext.Provider>
  );
};

export default MenteeOnboardingShell;
