// src/api/auth.api.ts
import axiosInstance from "@/shared/utils/axiosInstance";
import { mapAuthResponse, mapUser } from "./authMapper";

interface RegisterPayload {
    name: string;
    email: string;
    password: string;
    roles: string[];
    termsAccepted: boolean;
}

export const registerUser = async ({ name, email, password, roles, termsAccepted }: RegisterPayload) => {
    const res = await axiosInstance.post("/auth/register", {
        name,
        email,
        password,
        roles,
        termsAccepted,
    });
    return mapAuthResponse(res.data);
};

export const loginUser = async ({ email, password }: { email: string; password: string }) => {
    const res = await axiosInstance.post("/auth/login", { email, password });
    return mapAuthResponse(res.data);
};

export const sendOtp = async (email: string) => {
    const res = await axiosInstance.post("/verification/send", { email: email.trim() });
    return res.data;
};

export const verifyEmailOtp = async (email: string, otp: string) => {
    const res = await axiosInstance.post("/verification/verify-otp", {
        email: email.trim(),
        otp,
    });
    return res.data;
};

export const verifyMagicLink = async (token: string, email: string) => {
    const res = await axiosInstance.get(
        `/verification/verify/${token}?email=${encodeURIComponent(email)}`,
    );
    return res.data;
};

export const forgotPassword = async (email: string) => {
    const res = await axiosInstance.post("/auth/password-reset", { email: email.trim() });
    return res.data;
};

export const verifyResetOtp = async (email: string, otp: string) => {
    const res = await axiosInstance.post("/auth/password-reset/verification", {
        email: email.trim(),
        otp,
    });
    return res.data;
};

export const resetPassword = async (email: string, otp: string, newPassword: string) => {
    const res = await axiosInstance.post("/auth/password-reset/confirmation", {
        email: email.trim(),
        otp,
        newPassword,
    });
    return res.data;
};

export const logoutRequest = async (): Promise<void> => {
    await axiosInstance.post("/auth/logout");
};

export const getCurrentUser = async () => {
    const res = await axiosInstance.get("/users/me");
    return mapUser(res.data);
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
    const res = await axiosInstance.patch("/auth/password", {
        currentPassword,
        newPassword,
    });
    return res.data;
};

// Raw login call preserving the full axios response — used by the Login
// view which reads res.data.accessToken / res.data.user directly.
export const loginRequestRaw = async (email: string, password: string) => {
    return axiosInstance.post("/auth/login", { email, password });
};

// Clerk SSO sync — returns the full axios response since callers read
// res.data.accessToken, res.data.token, res.data.user, res.data.isNewUser.
export const clerkSsoSync = async (clerkToken: string, roles: string[], termsAccepted: boolean) => {
    return axiosInstance.post("/auth/clerk-sso", {
        clerkToken,
        roles,
        termsAccepted,
    });
};

// Google Sign-In sync — returns the raw axios response since the caller
// reads res.data.accessToken / res.data.token / res.data.user directly.
export const googleAuthSync = async (credential: string, roles: string[], termsAccepted: boolean) => {
    return axiosInstance.post("/auth/google", { credential, roles, termsAccepted });
};