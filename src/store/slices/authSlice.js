// src/store/slices/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as authApi from "../../api/auth.api";
import getErrorMessage from "../../utils/getErrorMessage";
import * as Sentry from "@sentry/react";
import logger from "../../utils/logger";
import axiosInstance from "../../utils/axiosInstance";
import { localStore, sessionStore } from "../../utils/storage"; 
export const redirectByRole = (targetRole, navigate, roles = []) => {
  if (targetRole === "mentor" && roles.includes("mentor"))
    return navigate("/dashboard/mentor");
  if (targetRole === "mentee" && roles.includes("mentee"))
    return navigate("/dashboard/mentee");
  if (roles.includes("mentor")) return navigate("/dashboard/mentor");
  if (roles.includes("mentee")) return navigate("/dashboard/mentee");
  navigate("/");
};

// ── Thunks ──────────────────────────────────────────────────

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (
    { name, email, password, roles, termsAccepted },
    { rejectWithValue },
  ) => {
    try {
      const data = await authApi.registerUser({ name, email, password, roles, termsAccepted });
      // Cookie is set automatically by the backend. accessToken goes to Redux memory.
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Registration failed."));
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const data = await authApi.loginUser({ email, password });
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Login failed."));
    }
  },
);

export const sendOtp = createAsyncThunk(
  "auth/sendOtp",
  async ({ email }, { rejectWithValue }) => {
    try {
      const data = await authApi.sendOtp(email);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to send OTP."));
    }
  },
);

export const verifyEmail = createAsyncThunk(
  "auth/verifyEmail",
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const data = await authApi.verifyEmailOtp(email, otp);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "OTP verification failed."));
    }
  },
);

export const verifyMagicLink = createAsyncThunk(
  "auth/verifyMagicLink",
  async ({ token, email }, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get(
        `/verification/verify/${token}?email=${encodeURIComponent(email)}`,
      );
      return res.data;
    } catch (err) {
      return rejectWithValue(
        getErrorMessage(err, "Magic link verification failed."),
      );
    }
  },
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async ({ email }, { rejectWithValue }) => {
    try {
      const data = await authApi.forgotPassword(email);
      return data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Failed to send OTP."));
    }
  },
);

export const verifyResetOtp = createAsyncThunk(
  "auth/verifyResetOtp",
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const data = await authApi.verifyResetOtp(email, otp);
      return data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || err?.message || "Invalid OTP.",
      );
    }
  },
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ email, otp, newPassword }, { rejectWithValue }) => {
    try {
      const data = await authApi.resetPassword(email, otp, newPassword);
      return data;
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message ||
          err?.message ||
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
  async (_, { dispatch }) => {
    try {
      await authApi.logoutRequest(); // tells backend to clear the cookie too
    } catch (err) {
      // Cookie clearing failed — proceed anyway, local state will still be cleared
      logger.error("[authSlice] Logout request failed", {
        status: err?.response?.status,
        message: err.message,
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
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    token: null,
    // accessToken now lives in memory only — never persisted
    isBootstrapping: true, // true until /auth/refresh attempt completes on page load
    loading: false,
    sending: false,
    error: null,
    successMsg: null,
    verifiedRole: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;//matters for redirect 
      state.error = null;
      state.successMsg = null;
    },
    setUser(state, action) {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    // ← ADD: used by axiosInstance interceptor to save refreshed accessToken
    setToken(state, action) {
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
        state.token = action.payload.accessToken || null; // ← CHANGED: was .token
        state.user = action.payload.user || null;
        state.successMsg = "Account created! Please verify your email.";
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
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
        state.token = action.payload.accessToken || null; // ← CHANGED: was .token
        state.user = action.payload.user || null;
        state.successMsg = "Login successful!";
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── Send OTP ── (unchanged)
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
        state.error = action.payload;
      });

    // ── Verify Email ── (unchanged)
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
        state.error = action.payload;
      });

    // ── Verify Magic Link ── (unchanged)
    builder
      .addCase(verifyMagicLink.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMsg = null;
      })
      .addCase(verifyMagicLink.fulfilled, (state, action) => {
        state.loading = false;
        state.successMsg = "Email verified! Redirecting to login...";
        state.verifiedRole = action.payload?.role || null;
      })
      .addCase(verifyMagicLink.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── Forgot Password ── (unchanged)
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
        state.error = action.payload;
      });

    // ── Verify Reset OTP ── (unchanged)
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
        state.error = action.payload;
      });

    // ── Reset Password ── (unchanged)
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
        state.error = action.payload;
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
