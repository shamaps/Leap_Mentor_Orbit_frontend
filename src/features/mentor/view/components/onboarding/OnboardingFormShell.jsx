// components/mentor/onboarding/OnboardingFormShell.jsx
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  submitMentorOnboarding,
  clearMentorOnboardingMessages,
} from "@/app/store/slices/mentorOnboardingSlice";
import { IMAGES } from "@/shared/constants/images";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  mentorOnboardingSchema,
  commonOnboardingSchema,
  getFieldErrorMap,
  getFirstErrorMessage,
} from "@/features/mentee/schemas/onboardingSchemas";
import FullScreenLoader from "@/shared/components/FullScreenLoader";
import { MentorOnboardingFormContext } from "@/features/mentor/context/MentorOnboardingFormContext";
import {
  selectAuthToken,
  selectMentorOnboardingLoading,
  selectMentorOnboardingError,
  selectMentorOnboardingSuccessMsg,
} from "@/app/store/selectors";
import PersonalInfoSection from "./PersonalInfoSection";
import ProfessionalInfoSection from "./ProfessionalInfoSection";
import SkillsSection from "./SkillsSection";
import PreferencesSection from "./PreferencesSection";
import SocialLinksSection from "./SocialLinksSection";
import OnboardingProgressBar from "@/shared/marketing/OnboardingProgressBar";
import { MENTOR_ONBOARDING_FIELDS } from "@/features/mentee/config/onboardingFields";
import { sessionStore } from "@/shared/utils/storage";
const OnboardingFormShell = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  //  use granular selectors instead of inline (state) => state.mentorOnboarding
  // Avoids re-render when unrelated onboarding state fields change
  const loading = useSelector(selectMentorOnboardingLoading);
  const error = useSelector(selectMentorOnboardingError);
  const successMsg = useSelector(selectMentorOnboardingSuccessMsg);
  const token = useSelector(selectAuthToken);

  const EMPTY_MENTOR_FORM = {
    profilePicture: "",
    bio: "",
    currentRole: "",
    industry: "",
    company: "",
    yearsOfExperience: "",
    hourlyRate: "",
    skills: [],
    communicationPreferences: [],
    languages: "",
    linkedInUrl: "",
    portfolioUrl: "",
  };

  const [form, setForm] = useState(() => {
    const saved = sessionStore.getJSON("mentorOnboardingForm");
    return saved || EMPTY_MENTOR_FORM;
  });

  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [redirecting, setRedirecting] = useState(false);

  const sectionRefs = {
    skills: useRef(null),
  };

  useEffect(() => {
    if (error) setMsg({ type: "error", text: error });
    if (successMsg) {
      sessionStore.remove("mentorOnboardingForm");
      dispatch(clearMentorOnboardingMessages());
      setRedirecting(true);
      setTimeout(() => navigate("/onboarding/mentor/verify-documents"), 1500);
    }
  }, [error, successMsg]);

  useEffect(() => {
    return () => {
      dispatch(clearMentorOnboardingMessages());
    };
  }, []);

  useEffect(() => {
    sessionStore.setJSON("mentorOnboardingForm", form);
  }, [form]);

  // Zod schema replaces the old getMentorFieldErrors util
  const validate = () => getFieldErrorMap(mentorOnboardingSchema, form);

  const scrollToFirstError = (errorKeys) => {
    if (!errorKeys.length) return;
    const firstKey = errorKeys[0];
    const el =
      document.querySelector(`[name="${firstKey}"]`) ||
      document.querySelector(`[data-field="${firstKey}"]`) ||
      sectionRefs[firstKey]?.current;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "hourlyRate" && value !== "") {
      const num = Number(value);
      if (num > 100) return;
    }
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleBlur = (e) => {
    const { name } = e.target;
    const fieldErrors = getFieldErrorMap(mentorOnboardingSchema, form);
    if (fieldErrors[name]) {
      setErrors((prev) => ({ ...prev, [name]: true }));
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    dispatch(clearMentorOnboardingMessages());

    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      scrollToFirstError(Object.keys(newErrors));
      return;
    }
    setErrors({});

    if (
      form.hourlyRate &&
      (Number(form.hourlyRate) < 1 || Number(form.hourlyRate) > 100)
    )
      return setMsg({
        type: "error",
        text: "Session rate must be between ₹1 and ₹100.",
      });

    const commonError = getFirstErrorMessage(commonOnboardingSchema, form);
    if (commonError) return setMsg({ type: "error", text: commonError });

    if (!token) {
      navigate("/login/mentor");
      return;
    }

    const payload = {
      ...form,
      yearsOfExperience: Number(form.yearsOfExperience) || 0,
      hourlyRate: Number(form.hourlyRate) || 0,
      languages:
        typeof form.languages === "string"
          ? form.languages
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
          : form.languages,
    };

    dispatch(submitMentorOnboarding(payload));
  };

  // context value — onChange matches what mentor sections expect
  const ctxValue = useMemo(
    () => ({ form, errors, onChange: handleChange, onBlur: handleBlur }),
    [form, errors, handleChange, handleBlur],
  );
  return (
    <MentorOnboardingFormContext.Provider value={ctxValue}>
      <div
        className="min-h-screen bg-[#f0f4ff]"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {redirecting && (
          <FullScreenLoader message="Setting up your profile..." />
        )}

        <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');`}</style>

        <div className="h-1 w-full bg-blue-900" />

        <header className="sticky top-0 z-10 bg-white border-b border-[#e8edf5] shadow-sm">
          <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={IMAGES.logo}
                alt="Leapmentor logo"
                className="h-8 w-auto"
              />
              <span className="text-sm font-bold text-[#0f172a]">
                Mentor Onboarding
              </span>
            </div>
          </div>
        </header>

        <OnboardingProgressBar form={form} fields={MENTOR_ONBOARDING_FIELDS} />

        <div className="max-w-2xl mx-auto px-6 pt-8 pb-2">
          <h1 className="text-2xl font-bold text-[#0f172a]">
            Mentor Onboarding
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Complete your profile setup and help mentees find you.
          </p>
        </div>

        <main className="max-w-2xl mx-auto px-6 py-6">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <PersonalInfoSection />
            <ProfessionalInfoSection />

            <SkillsSection ref={sectionRefs.skills} />

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
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white bg-blue-900 hover:bg-[#1d4ed8] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 shadow-md shadow-[#2563eb30]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />{" "}
                  Saving profile…
                </span>
              ) : (
                "Submit Profile →"
              )}
            </button>

            <p className="text-center text-xs text-slate-600 pb-8">
              You can always edit your profile from the dashboard.
            </p>
          </form>
        </main>
      </div>
    </MentorOnboardingFormContext.Provider>
  );
};

export default OnboardingFormShell;