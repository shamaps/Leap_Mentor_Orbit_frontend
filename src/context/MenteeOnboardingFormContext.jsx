// src/context/MenteeOnboardingFormContext.jsx
// Scoped to the mentee onboarding/edit-profile form tree only.
// Exposes { form, errors, handleChange } — the only values the
// 5 section components actually need. loading/msg/handleSubmit
// stay local to the shell (only the submit button and banner use them).
import { createContext, useContext } from "react";

export const MenteeOnboardingFormContext = createContext(null);

export const useMenteeOnboardingForm = () => {
    const ctx = useContext(MenteeOnboardingFormContext);
    if (!ctx) {
        throw new Error(
            "useMenteeOnboardingForm must be used inside MenteeOnboardingFormContext.Provider"
        );
    }
    return ctx;
};