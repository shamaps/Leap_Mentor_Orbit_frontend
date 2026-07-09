// src/schemas/onboardingSchemas.js
//
// Replaces src/utils/onboardingValidation.js's hand-written validation
// functions with declarative Zod schemas. Used by:
//   useMenteeOnboarding, useMenteeEditProfile,
//   useMentorEditProfile, OnboardingFormShell (mentor),
//   MenteeOnboardingShell (mentee)
//
// NOTE: this schema is consumed via `.safeParse(form)` at submit/blur
// time inside the existing Context + controlled-form architecture —
// it does NOT replace that architecture with react-hook-form's
// register()/useForm(). The onboarding wizard's Context provider,
// tag-array fields (interestedFields/skills), and sessionStorage draft
// persistence are left exactly as they are; only the *validation
// logic* moves from onboardingValidation.js's if-chains into these
// schemas.

import { z } from "zod";

const isOnlyNumbers = (val) => Boolean(val && /^\d+$/.test(val.trim()));

// z's built-in .url() requires an absolute URL (protocol included),
// matching the original isValidUrl()'s `new URL(val)` check. Empty
// string is allowed since both fields are optional.
const optionalUrl = z
    .string()
    .trim()
    .refine((val) => val === "" || z.string().url().safeParse(val).success, {
        message: "Please enter a valid URL (e.g. https://example.com).",
    });

export const commonOnboardingSchema = z.object({
    currentRole: z
        .string()
        .trim()
        .min(1, "Current Role is required.")
        .refine((val) => !isOnlyNumbers(val), "Current Role cannot be a number."),
    bio: z
        .string()
        .trim()
        .refine((val) => val === "" || val.length >= 10, "Bio must be at least 10 characters."),
    yearsOfExperience: z
        .union([z.string(), z.number()])
        .refine((val) => val !== "" && val !== null && val !== undefined, "Years of Experience is required."),
    industry: z.string().trim().min(1, "Industry is required."),
    company: z
        .string()
        .optional()
        .refine((val) => !isOnlyNumbers(val || ""), "Company name cannot be a number."),
    linkedInUrl: optionalUrl.refine(
        (val) => val === "" || val.includes("linkedin.com"),
        "Please enter a valid LinkedIn URL (e.g. https://linkedin.com/in/username)."
    ).optional(),
    portfolioUrl: optionalUrl.optional(),
});

// Mentee-specific: also requires interestedFields + skills (tag-array
// fields), matching validateMenteeFields/getMenteeFieldErrors.
export const menteeOnboardingSchema = commonOnboardingSchema.extend({
    interestedFields: z.array(z.string()).min(1, "Please add at least one Field of Interest."),
    skills: z.array(z.string()).min(1, "Please add at least one Skill of Interest."),
});

// Mentor-specific: only requires skills (matches getMentorFieldErrors,
// which does NOT check interestedFields for mentors).
export const mentorOnboardingSchema = commonOnboardingSchema.extend({
    skills: z.array(z.string()).min(1, "Please add at least one Skill."),
});

// Helper: run a schema and return a { fieldName: true } map, matching
// onboardingValidation.js's getMenteeFieldErrors/getMentorFieldErrors
// shape exactly, so call sites that highlight individual fields don't
// need to change at all.
export function getFieldErrorMap(schema, form) {
    const result = schema.safeParse(form);
    if (result.success) return {};
    const fieldErrors = result.error.flatten().fieldErrors;
    return Object.fromEntries(Object.keys(fieldErrors).map((key) => [key, true]));
}

// Helper: run a schema and return the first error message, or null,
// matching validateCommonFields/validateMenteeFields's return shape
// exactly, so call sites that show one banner message don't need to
// change either.
export function getFirstErrorMessage(schema, form) {
    const result = schema.safeParse(form);
    if (result.success) return null;
    const flat = result.error.flatten();
    const firstFieldError = Object.values(flat.fieldErrors)[0]?.[0];
    return firstFieldError || flat.formErrors[0] || "Please check the highlighted fields.";
}