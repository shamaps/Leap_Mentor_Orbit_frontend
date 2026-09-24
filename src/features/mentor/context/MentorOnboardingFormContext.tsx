// src/context/MentorOnboardingFormContext.tsx

import { createContext, useContext } from "react";

// Mirrors OnboardingFormShell's EMPTY_MENTOR_FORM shape. Kept here (rather
// than importing it) so this context has no dependency on the shell —
// MentorEditProfileShell also provides this context with its own form state.
export interface MentorOnboardingFormFields {
  profilePicture: string;
  bio: string;
  currentRole: string;
  industry: string;
  company: string;
  education: string;
  yearsOfExperience: string | number;
  hourlyRate: string | number;
  skills: string[];
  communicationPreferences: string[];
  languages: string | string[];
  linkedInUrl: string;
  portfolioUrl: string;
}


export interface MentorOnboardingChangeEvent {
  target: {
    name: string;
    value: string | string[];
  };
}

export interface MentorOnboardingFormContextValue {
  form: MentorOnboardingFormFields;
  errors: Partial<Record<keyof MentorOnboardingFormFields, boolean | string>>;
  onChange: (e: MentorOnboardingChangeEvent) => void;
  onBlur?: (e: MentorOnboardingChangeEvent) => void;
}

export const MentorOnboardingFormContext = createContext<MentorOnboardingFormContextValue | null>(null);

export const useMentorOnboardingForm = (): MentorOnboardingFormContextValue => {
  const ctx = useContext(MentorOnboardingFormContext);
  if (!ctx) {
    throw new Error(
      "useMentorOnboardingForm must be used inside MentorOnboardingFormContext.Provider",
    );
  }
  return ctx;
};