// src/store/slices/mentorProfileSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";
import getErrorMessage from "../../utils/getErrorMessage";
import { logoutUser } from "./authSlice";
import logger from "../../utils/logger";
import { HTTP_STATUS } from "../../constants/httpStatus";
// ── Thunks
// Fetches /users/me + /mentor-profile/me together, mirrors the exact
// sequence previously inside useMentorDashboard.js's fetchData().
// Navigation side-effects (role guard, onboarding redirect, 401 logout)
// stay in the hook — this thunk only fetches and reports outcome via payload.
export const fetchMentorDashboard = createAsyncThunk(
  "mentorProfile/fetchMentorDashboard",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const userRes = await axiosInstance.get("/users/me");
      const userData = userRes.data;

      if (!userData.roles?.includes("mentor")) {
        return rejectWithValue({ reason: "wrong-role" });
      }

      try {
        const profileRes = await axiosInstance.get("/mentor-profile/me");
        return { user: userData, profile: profileRes.data };
      } catch (profileErr) {
        if (profileErr?.response?.status === HTTP_STATUS.NOT_FOUND) {
          return rejectWithValue({ reason: "no-profile", user: userData });
        }
        if (profileErr?.response?.status === HTTP_STATUS.UNAUTHORIZED) {
          dispatch(logoutUser());
          return rejectWithValue({ reason: "unauthorized" });
        }
        throw profileErr;
      }
    } catch (err) {
      if (err?.response?.status === HTTP_STATUS.UNAUTHORIZED) {
        dispatch(logoutUser());
        return rejectWithValue({ reason: "unauthorized" });
      }
      return rejectWithValue({
        reason: "error",
        message: getErrorMessage(
          err,
          "Something went wrong. Please try again.",
        ),
      });
    }
  },
);

export const refetchMentorProfile = createAsyncThunk(
  "mentorProfile/refetchMentorProfile",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get("/mentor-profile/me");
      return res.data;
    } catch (err) {
      logger.error("Profile refetch failed", { message: err.message });
      return rejectWithValue(getErrorMessage(err, "Profile refetch failed."));
    }
  },
);

// ── Slice
const mentorProfileSlice = createSlice({
  name: "mentorProfile",
  initialState: {
    user: null,
    profile: null,
    loading: true,
    error: null,
  },
  reducers: {
    resetMentorProfile(state) {
      state.user = null;
      state.profile = null;
      state.loading = true;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMentorDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMentorDashboard.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.profile = action.payload.profile;
        state.loading = false;
      })
      .addCase(fetchMentorDashboard.rejected, (state, action) => {
        const payload = action.payload || {};
        if (payload.reason === "no-profile") {
          state.user = payload.user;
        }
        if (payload.reason === "error") {
          state.error = payload.message;
        }
        state.loading = false;
      });

    builder.addCase(refetchMentorProfile.fulfilled, (state, action) => {
      state.profile = action.payload;
    });
  },
});

export const { resetMentorProfile } = mentorProfileSlice.actions;
export default mentorProfileSlice.reducer;
