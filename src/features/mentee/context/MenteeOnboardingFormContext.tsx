// src/context/MenteeOnboardingFormContext.jsx
import { createContext, useContext } from "react";
import type { MenteeOnboardingForm } from "@/features/mentee/presenter/useMenteeOnboarding";

export interface MenteeOnboardingFormContextValue {
  form: MenteeOnboardingForm;
  errors?: Record<string, unknown>;
   
  handleChange: (e: any) => void;
   
  onBlur?: (e: any) => void;
}

export const MenteeOnboardingFormContext = createContext<MenteeOnboardingFormContextValue | null>(null);

export const useMenteeOnboardingForm = (): MenteeOnboardingFormContextValue => {
  const ctx = useContext(MenteeOnboardingFormContext);
  if (!ctx) {
    throw new Error(
      "useMenteeOnboardingForm must be used inside MenteeOnboardingFormContext.Provider",
    );
  }
  return ctx;
};