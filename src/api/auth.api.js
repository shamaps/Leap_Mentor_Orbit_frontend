// src/api/auth.api.js
import axiosInstance from "../utils/axiosInstance";
import { mapAuthResponse } from "../mappers/authMapper";
export const registerUser = async ({ name, email, password, roles, termsAccepted }) => {
    const res = await axiosInstance.post("/auth/register", {
        name,
        email,
        password,
        roles,
        termsAccepted,
    });
    return mapAuthResponse(res.data);
};

export const loginUser = async ({ email, password }) => {
    const res = await axiosInstance.post("/auth/login", { email, password });
    return mapAuthResponse(res.data);
};

export const sendOtp = async (email) => {
    const res = await axiosInstance.post("/verification/send", { email: email.trim() });
    return res.data;
};

export const verifyEmailOtp = async (email, otp) => {
    const res = await axiosInstance.post("/verification/verify-otp", {
        email: email.trim(),
        otp,
    });
    return res.data;
};

export const verifyMagicLink = async (token, email) => {
    const res = await axiosInstance.get(
        `/verification/verify/${token}?email=${encodeURIComponent(email)}`,
    );
    return res.data;
};

export const forgotPassword = async (email) => {
    const res = await axiosInstance.post("/auth/password-reset", { email: email.trim() });
    return res.data;
};

export const verifyResetOtp = async (email, otp) => {
    const res = await axiosInstance.post("/auth/password-reset/verification", {
        email: email.trim(),
        otp,
    });
    return res.data;
};

export const resetPassword = async (email, otp, newPassword) => {
    const res = await axiosInstance.post("/auth/password-reset/confirmation", {
        email: email.trim(),
        otp,
        newPassword,
    });
    return res.data;
};

export const logoutRequest = async () => {
    await axiosInstance.post("/auth/logout");
};
export const getCurrentUser = async () => {
    const res = await axiosInstance.get("/users/me");
    return mapUser(res.data);
};

export const changePassword = async (currentPassword, newPassword) => {
    const res = await axiosInstance.patch("/auth/password", {
        currentPassword,
        newPassword,
    });
    return res.data;
};