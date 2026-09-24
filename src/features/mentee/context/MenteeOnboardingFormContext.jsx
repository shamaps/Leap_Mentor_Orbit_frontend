// src/context/MenteeOnboardingFormContext.jsx
import { createContext, useContext } from "react";

export const MenteeOnboardingFormContext = createContext(null);

export const useMenteeOnboardingForm = () => {
  const ctx = useContext(MenteeOnboardingFormContext);
  if (!ctx) {
    throw new Error(
      "useMenteeOnboardingForm must be used inside MenteeOnboardingFormContext.Provider",
    );
  }
  return ctx;
};
