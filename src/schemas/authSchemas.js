// src/schemas/authSchemas.js
//
// Centralized Zod schemas for auth forms. This replaces hand-rolled
// per-file validation functions (e.g. LoginForm's old
// `runFormVerificationPipeline`) with a single declarative source of
// truth per form, usable both for client-side validation (via
// react-hook-form's zodResolver) and for shaping/normalizing server
// error responses (see utils/mapServerErrorsToForm.js).

import { z } from "zod";

export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, "Email is required.")
        .email("Please enter a valid email address."),
    password: z.string().min(1, "Password is required."),
});

// Mirrors RegisterForm's original POLICY_CRITERIA_REGISTRY (length >= 8,
// 1 uppercase, 1 digit, 1 special char). Encoded as chained .regex()
// calls so each rule gets its own message, matching what the live
// strength-meter UI already checks per-rule.
export const registerSchema = z.object({
    name: z.string().trim().min(1, "Name is required."),
    email: z
        .string()
        .trim()
        .min(1, "Email is required.")
        .email("Please enter a valid email address."),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters.")
        .regex(/[A-Z]/, "Password must include at least 1 uppercase letter.")
        .regex(/\d/, "Password must include at least 1 number.")
        .regex(/[^A-Za-z0-9]/, "Password must include at least 1 special character."),
    termsAccepted: z.boolean().refine((val) => val === true, {
        message: "Please accept the terms to continue.",
    }),
});

export const forgotPasswordSchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, "Email is required.")
        .email("Please enter a valid email address."),
});

// ForgotPassword.jsx is a 3-step wizard (email -> OTP -> new password),
// each step submitted as its own <form>. Split into per-step schemas
// rather than one combined schema, since only one step's fields exist
// on screen (and in RHF state) at a time.
export const otpStepSchema = z.object({
    otp: z.string().trim().length(6, "Please enter the full 6-digit OTP."),
});

// Mirrors ForgotPassword's original ACCESS_SECURITY_POLICIES — same 4
// rules as registerSchema's password (length >= 8, uppercase, digit,
// special char), kept as a separate schema since this step no longer
// carries the otp/email fields (already verified in earlier steps).
export const newPasswordStepSchema = z
    .object({
        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters.")
            .regex(/[A-Z]/, "Password must include at least 1 uppercase letter.")
            .regex(/\d/, "Password must include at least 1 number.")
            .regex(/[^A-Za-z0-9]/, "Password must include at least 1 special character."),
        confirmPassword: z.string().min(1, "Please confirm your password."),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match.",
        path: ["confirmPassword"],
    });

// VerifyEmail.jsx: email is optional here (it's often pre-filled via
// location.state and not rendered as an input at all), otp is always
// required.
export const verifyEmailSchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, "Email is required.")
        .email("Please enter a valid email address."),
    otp: z.string().trim().length(6, "Please enter the full 6-digit OTP."),
});