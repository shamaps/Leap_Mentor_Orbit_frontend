import { describe, it, expect } from "vitest";
import {
    loginSchema,
    registerSchema,
    forgotPasswordSchema,
    otpStepSchema,
    newPasswordStepSchema,
    verifyEmailSchema,
} from "../../shared/schemas/authSchemas";

describe("loginSchema", () => {
    it("passes with a valid email and password", () => {
        const result = loginSchema.safeParse({ email: "user@example.com", password: "pass123" });
        expect(result.success).toBe(true);
    });

    it("trims whitespace from email", () => {
        const result = loginSchema.safeParse({ email: "  user@example.com  ", password: "pass123" });
        expect(result.success).toBe(true);
        expect(result.data.email).toBe("user@example.com");
    });

    it("fails when email is empty", () => {
        const result = loginSchema.safeParse({ email: "", password: "pass123" });
        expect(result.success).toBe(false);
        expect(result.error.flatten().fieldErrors.email[0]).toBe("Email is required.");
    });

    it("fails when email is not a valid format", () => {
        const result = loginSchema.safeParse({ email: "not-an-email", password: "pass123" });
        expect(result.success).toBe(false);
        expect(result.error.flatten().fieldErrors.email[0]).toBe(
            "Please enter a valid email address.",
        );
    });

    it("fails when password is empty", () => {
        const result = loginSchema.safeParse({ email: "user@example.com", password: "" });
        expect(result.success).toBe(false);
        expect(result.error.flatten().fieldErrors.password[0]).toBe("Password is required.");
    });
});

describe("registerSchema", () => {
    const validPayload = {
        name: "Jane Doe",
        email: "jane@example.com",
        password: "Passw0rd!",
        termsAccepted: true,
    };

    it("passes with fully valid input", () => {
        expect(registerSchema.safeParse(validPayload).success).toBe(true);
    });

    it("fails when name is empty", () => {
        const result = registerSchema.safeParse({ ...validPayload, name: "" });
        expect(result.error.flatten().fieldErrors.name[0]).toBe("Name is required.");
    });

    it("fails when email is invalid", () => {
        const result = registerSchema.safeParse({ ...validPayload, email: "bad" });
        expect(result.error.flatten().fieldErrors.email[0]).toBe(
            "Please enter a valid email address.",
        );
    });

    it("fails when password is under 8 characters", () => {
        const result = registerSchema.safeParse({ ...validPayload, password: "Ab1!" });
        expect(result.error.flatten().fieldErrors.password).toContain(
            "Password must be at least 8 characters.",
        );
    });

    it("fails when password has no uppercase letter", () => {
        const result = registerSchema.safeParse({ ...validPayload, password: "password1!" });
        expect(result.error.flatten().fieldErrors.password).toContain(
            "Password must include at least 1 uppercase letter.",
        );
    });

    it("fails when password has no number", () => {
        const result = registerSchema.safeParse({ ...validPayload, password: "Password!" });
        expect(result.error.flatten().fieldErrors.password).toContain(
            "Password must include at least 1 number.",
        );
    });

    it("fails when password has no special character", () => {
        const result = registerSchema.safeParse({ ...validPayload, password: "Password1" });
        expect(result.error.flatten().fieldErrors.password).toContain(
            "Password must include at least 1 special character.",
        );
    });

    it("fails when termsAccepted is false", () => {
        const result = registerSchema.safeParse({ ...validPayload, termsAccepted: false });
        expect(result.error.flatten().fieldErrors.termsAccepted[0]).toBe(
            "Please accept the terms to continue.",
        );
    });
});

describe("forgotPasswordSchema", () => {
    it("passes with a valid email", () => {
        expect(forgotPasswordSchema.safeParse({ email: "user@example.com" }).success).toBe(true);
    });

    it("fails when email is empty", () => {
        const result = forgotPasswordSchema.safeParse({ email: "" });
        expect(result.error.flatten().fieldErrors.email[0]).toBe("Email is required.");
    });

    it("fails when email format is invalid", () => {
        const result = forgotPasswordSchema.safeParse({ email: "not-valid" });
        expect(result.error.flatten().fieldErrors.email[0]).toBe(
            "Please enter a valid email address.",
        );
    });
});

describe("otpStepSchema", () => {
    it("passes with a 6-digit otp", () => {
        expect(otpStepSchema.safeParse({ otp: "123456" }).success).toBe(true);
    });

    it("fails when otp is shorter than 6 digits", () => {
        const result = otpStepSchema.safeParse({ otp: "123" });
        expect(result.error.flatten().fieldErrors.otp[0]).toBe(
            "Please enter the full 6-digit OTP.",
        );
    });

    it("trims whitespace before checking length", () => {
        expect(otpStepSchema.safeParse({ otp: "  123456  " }).success).toBe(true);
    });
});

describe("newPasswordStepSchema", () => {
    const validPayload = { newPassword: "NewPass1!", confirmPassword: "NewPass1!" };

    it("passes when both passwords are valid and match", () => {
        expect(newPasswordStepSchema.safeParse(validPayload).success).toBe(true);
    });

    it("fails when newPassword doesn't meet complexity rules", () => {
        const result = newPasswordStepSchema.safeParse({
            newPassword: "weak",
            confirmPassword: "weak",
        });
        expect(result.success).toBe(false);
    });

    it("fails when confirmPassword is empty", () => {
        const result = newPasswordStepSchema.safeParse({
            newPassword: "NewPass1!",
            confirmPassword: "",
        });
        expect(result.error.flatten().fieldErrors.confirmPassword).toContain(
            "Please confirm your password.",
        );
    });

    it("fails with a path on confirmPassword when passwords don't match", () => {
        const result = newPasswordStepSchema.safeParse({
            newPassword: "NewPass1!",
            confirmPassword: "Different1!",
        });
        expect(result.success).toBe(false);
        const flat = result.error.flatten();
        expect(flat.fieldErrors.confirmPassword).toContain("Passwords do not match.");
    });
});

describe("verifyEmailSchema", () => {
    it("passes with valid email and otp", () => {
        expect(
            verifyEmailSchema.safeParse({ email: "user@example.com", otp: "654321" }).success,
        ).toBe(true);
    });

    it("fails when email is empty", () => {
        const result = verifyEmailSchema.safeParse({ email: "", otp: "654321" });
        expect(result.error.flatten().fieldErrors.email[0]).toBe("Email is required.");
    });

    it("fails when otp is not 6 digits", () => {
        const result = verifyEmailSchema.safeParse({ email: "user@example.com", otp: "12" });
        expect(result.error.flatten().fieldErrors.otp[0]).toBe(
            "Please enter the full 6-digit OTP.",
        );
    });
});