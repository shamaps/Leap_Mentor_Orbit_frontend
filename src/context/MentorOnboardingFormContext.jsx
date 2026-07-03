// src/context/MentorOnboardingFormContext.jsx
// Scoped to the mentor onboarding/edit-profile form
// Mentor sections use onChange (not handleChange) — the context
// matches that naming so sections don't need to be changed.
import { createContext, useContext } from "react";

export const MentorOnboardingFormContext = createContext(null);

export const useMentorOnboardingForm = () => {
  const ctx = useContext(MentorOnboardingFormContext);
  if (!ctx) {
    throw new Error(
      "useMentorOnboardingForm must be used inside MentorOnboardingFormContext.Provider",
    );
  }
  return ctx;
};
