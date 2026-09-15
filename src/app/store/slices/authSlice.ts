// src/store/slices/authSlice.js
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { NavigateFunction } from "react-router-dom";
import * as authApi from "@/features/auth/model/auth.api";
import getErrorMessage from "@/shared/utils/getErrorMessage";
import * as Sentry from "@sentry/react";
import logger from "@/shared/utils/logger";
import axiosInstance from "@/shared/utils/axiosInstance";
import { localStore, sessionStore } from "@/shared/utils/storage";

export interface AuthUser {
  id?: string;
  _id?: string;
  name?: string;
  email?: string;
  roles?: string[];
  [key: string]: unknown;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isBootstrapping: boolean;
  loading: boolean;
  sending: boolean;
  error: string | null;
  successMsg: string | null;
  verifiedRole: string | null;
}

export const redirectByRole = (targetRole: string, navigate: NavigateFunction, roles: string[] = []) => {
  if (targetRole === "mentor" && roles.includes("mentor"))
    return navigate("/dashboard/mentor");
  if (targetRole === "mentee" && roles.includes("mentee"))
    return navigate("/dashboard/mentee");
  if (roles.includes("mentor")) return navigate("/dashboard/mentor");
  if (roles.includes("mentee")) return navigate("/dashboard/mentee");
  navigate("/");
};

// ── Thunks ──────────────────────────────────────────────────

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  roles: string[];
  termsAccepted: boolean;
}

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (
    { name, email, password, roles, termsAccepted }: RegisterPayload,
    { rejectWithValue },
  ) => {
    try {
      const data = await authApi.registerUser({ name, email, password, roles, termsAccepted });
      // Cookie is set automatically by the backend. accessToken goes to Redux memory.
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err as never, "Registration failed."));
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const data = await authApi.loginUser({ email, password });
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err as never, "Login failed."));
    }
  },
);

export const sendOtp = createAsyncThunk(
  "auth/sendOtp",
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      const data = await authApi.sendOtp(email);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err as never, "Failed to send OTP."));
    }
  },
);

export const verifyEmail = createAsyncThunk(
  "auth/verifyEmail",
  async ({ email, otp }: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      const data = await authApi.verifyEmailOtp(email, otp);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err as never, "OTP verification failed."));
    }
  },
);

export const verifyMagicLink = createAsyncThunk(
  "auth/verifyMagicLink",
  async ({ token, email }: { token: string; email: string }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/verification/verify/${token}?email=${encodeURIComponent(email)}`,
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(
        getErrorMessage(err as never, "Magic link verification failed."),
      );
    }
  },
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      const data = await authApi.forgotPassword(email);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err as never, "Failed to send OTP."));
    }
  },
);

export const verifyResetOtp = createAsyncThunk(
  "auth/verifyResetOtp",
  async ({ email, otp }: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      const data = await authApi.verifyResetOtp(email, otp);
      return data;
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(
        e?.response?.data?.message || e?.message || "Invalid OTP.",
      );
    }
  },
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (
    { email, otp, newPassword }: { email: string; otp: string; newPassword: string },
    { rejectWithValue },
  ) => {
    try {
      const data = await authApi.resetPassword(email, otp, newPassword);
      return data;
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      return rejectWithValue(
        e?.response?.data?.message ||
        e?.message ||
        "Failed to reset password.",
      );
    }
  },
);

// ── ADD: Logout thunk — must hit backend to clear the HttpOnly cookie ──
// You cannot clear an HttpOnly cookie from JS. Only the server can do it.
// Replace all dispatch(logout()) calls in components with dispatch(logoutUser())
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_: void, { dispatch }) => {
    try {
      await authApi.logoutRequest(); // tells backend to clear the cookie too
    } catch (err) {
      const e = err as { response?: { status?: number }; message?: string };
      // Cookie clearing failed — proceed anyway, local state will still be cleared
      logger.error("[authSlice] Logout request failed", {
        status: e?.response?.status,
        message: e.message,
      });
    }

    const remainingKeys = localStore.keys();
    localStore.clear();
    sessionStore.clear();
    Sentry.setUser(null);
    if (remainingKeys.length > 0) {
      Sentry.addBreadcrumb({
        category: "auth",
        message: `Logout cleared ${remainingKeys.length} localStorage key(s)`,
        level: "info",
        data: { keys: remainingKeys },
      });
    }

    dispatch(logout());
  },
);

// ── Slice ────────────────────────────────────────────────────
const initialState: AuthState = {
  user: null,
  token: null,
  // accessToken now lives in memory only
  isBootstrapping: true, // true until /auth/refresh attempt completes on page load
  loading: false,
  sending: false,
  error: null,
  successMsg: null,
  verifiedRole: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null; // matters for redirect
      state.error = null;
      state.successMsg = null;
    },
    setUser(state, action: PayloadAction<{ user: AuthUser; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    // used by axiosInstance interceptor to save refreshed accessToken
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
    },
    setBootstrapped(state) {
      state.isBootstrapping = false;
    },
    clearMessages(state) {
      state.error = null;
      state.successMsg = null;
    },
  },
  extraReducers: (builder) => {
    // ── Register ──
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMsg = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.accessToken || null;
        state.user = action.payload.user || null;
        state.successMsg = "Account created! Please verify your email.";
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ── Login ──
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMsg = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.accessToken || null;
        state.user = action.payload.user || null;
        state.successMsg = "Login successful!";
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ── Send OTP ──
    builder
      .addCase(sendOtp.pending, (state) => {
        state.sending = true;
        state.error = null;
        state.successMsg = null;
      })
      .addCase(sendOtp.fulfilled, (state) => {
        state.sending = false;
        state.successMsg = "OTP sent to your email.";
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.sending = false;
        state.error = action.payload as string;
      });

    // ── Verify Email ──
    builder
      .addCase(verifyEmail.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMsg = null;
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.loading = false;
        state.successMsg = "Email verified! Redirecting to login...";
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ── Verify Magic Link ──
    builder
      .addCase(verifyMagicLink.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMsg = null;
      })
      .addCase(verifyMagicLink.fulfilled, (state, action) => {
        state.loading = false;
        state.successMsg = "Email verified! Redirecting to login...";
        state.verifiedRole = (action.payload as { role?: string })?.role || null;
      })
      .addCase(verifyMagicLink.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ── Forgot Password ──
    builder
      .addCase(forgotPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMsg = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.loading = false;
        state.successMsg = "OTP sent! Check your email.";
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ── Verify Reset OTP ──
    builder
      .addCase(verifyResetOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMsg = null;
      })
      .addCase(verifyResetOtp.fulfilled, (state) => {
        state.loading = false;
        state.successMsg = "OTP verified!";
      })
      .addCase(verifyResetOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ── Reset Password ──
    builder
      .addCase(resetPassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMsg = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.loading = false;
        state.successMsg = "Password reset! Redirecting to login...";
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // ── Logout ── (ADD)
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      state.successMsg = null;
    });
  },
});

export const { logout, setUser, setToken, setBootstrapped, clearMessages } =
  authSlice.actions;
export default authSlice.reducer;