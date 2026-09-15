// src/utils/onboardingValidation.ts
// Shared validation helpers used by:
//   useMenteeOnboarding, useMenteeEditProfile,
//   useMentorEditProfile, OnboardingFormShell (mentor)
// Previously copy-pasted across all four files.

// Shared shape covering the fields referenced across mentee/mentor
// onboarding and edit-profile forms. Individual forms may carry
// additional fields not listed here.
export interface OnboardingForm {
  currentRole?: string;
  yearsOfExperience?: string | number;
  industry?: string;
  company?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  interestedFields?: unknown[];
  skills?: unknown[];
}

export const isOnlyNumbers = (val?: string): boolean => Boolean(val && /^\d+$/.test(val.trim()));

export const isValidUrl = (val?: string): boolean => {
  if (!val) return true;
  try {
    new URL(val);
    return true;
  } catch {
    return false;
  }
};

// Returns an error message string or null.
export const validateCommonFields = (form: OnboardingForm): string | null => {
  if (!form.currentRole?.trim()) return "Current Role is required.";
  if (!form.yearsOfExperience) return "Years of Experience is required.";
  if (!form.industry) return "Industry is required.";
  if (isOnlyNumbers(form.currentRole))
    return "Current Role cannot be a number.";
  if (isOnlyNumbers(form.company)) return "Company name cannot be a number.";
  if (!isValidUrl(form.linkedInUrl))
    return "Please enter a valid LinkedIn URL (e.g. https://linkedin.com/in/username).";
  if (!isValidUrl(form.portfolioUrl))
    return "Please enter a valid Portfolio URL (e.g. https://yoursite.com).";
  return null;
};

// Mentee-specific: also checks interestedFields + skills
export const validateMenteeFields = (form: OnboardingForm): string | null => {
  const common = validateCommonFields(form);
  if (common) return common;
  if (!form.interestedFields?.length)
    return "Please add at least one Field of Interest.";
  if (!form.skills?.length) return "Please add at least one Skill of Interest.";
  return null;
};

export type FieldErrorMap = Record<string, boolean>;

// Returns an object of field keys with errors (for inline highlighting)
export const getMenteeFieldErrors = (form: OnboardingForm): FieldErrorMap => {
  const errs: FieldErrorMap = {};
  if (!form.currentRole?.trim()) errs.currentRole = true;
  if (!form.yearsOfExperience) errs.yearsOfExperience = true;
  if (!form.industry) errs.industry = true;
  if (!form.interestedFields?.length) errs.interestedFields = true;
  if (!form.skills?.length) errs.skills = true;
  return errs;
};

export const getMentorFieldErrors = (form: OnboardingForm): FieldErrorMap => {
  const errs: FieldErrorMap = {};
  if (!form.currentRole?.trim()) errs.currentRole = true;
  if (!form.yearsOfExperience) errs.yearsOfExperience = true;
  if (!form.industry?.trim()) errs.industry = true;
  if (!form.skills?.length) errs.skills = true;
  return errs;
};