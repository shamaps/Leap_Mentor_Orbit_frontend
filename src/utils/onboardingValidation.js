// src/utils/onboardingValidation.js
// Shared validation helpers used by:
//   useMenteeOnboarding, useMenteeEditProfile,
//   useMentorEditProfile, OnboardingFormShell (mentor)
// Previously copy-pasted across all four files.

export const isOnlyNumbers = (val) =>
    Boolean(val && /^\d+$/.test(val.trim()));

export const isValidUrl = (val) => {
    if (!val) return true;
    try {
        new URL(val);
        return true;
    } catch {
        return false;
    }
};

// Returns an error message string or null.
export const validateCommonFields = (form) => {
    if (!form.currentRole?.trim())
        return "Current Role is required.";
    if (!form.yearsOfExperience)
        return "Years of Experience is required.";
    if (!form.industry)
        return "Industry is required.";
    if (isOnlyNumbers(form.currentRole))
        return "Current Role cannot be a number.";
    if (isOnlyNumbers(form.company))
        return "Company name cannot be a number.";
    if (!isValidUrl(form.linkedInUrl))
        return "Please enter a valid LinkedIn URL (e.g. https://linkedin.com/in/username).";
    if (!isValidUrl(form.portfolioUrl))
        return "Please enter a valid Portfolio URL (e.g. https://yoursite.com).";
    return null;
};

// Mentee-specific: also checks interestedFields + skills
export const validateMenteeFields = (form) => {
    const common = validateCommonFields(form);
    if (common) return common;
    if (!form.interestedFields?.length)
        return "Please add at least one Field of Interest.";
    if (!form.skills?.length)
        return "Please add at least one Skill of Interest.";
    return null;
};

// Returns an object of field keys with errors (for inline highlighting)
export const getMenteeFieldErrors = (form) => {
    const errs = {};
    if (!form.currentRole?.trim()) errs.currentRole = true;
    if (!form.yearsOfExperience) errs.yearsOfExperience = true;
    if (!form.industry) errs.industry = true;
    if (!form.interestedFields?.length) errs.interestedFields = true;
    if (!form.skills?.length) errs.skills = true;
    return errs;
};

export const getMentorFieldErrors = (form) => {
    const errs = {};
    if (!form.currentRole?.trim()) errs.currentRole = true;
    if (!form.yearsOfExperience) errs.yearsOfExperience = true;
    if (!form.industry?.trim()) errs.industry = true;
    if (!form.skills?.length) errs.skills = true;
    return errs;
};