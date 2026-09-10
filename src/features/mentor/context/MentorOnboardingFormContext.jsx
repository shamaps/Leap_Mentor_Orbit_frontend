// src/context/MentorOnboardingFormContext.jsx

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
