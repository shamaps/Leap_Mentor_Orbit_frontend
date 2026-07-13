// src/store/slices/menteeProfileSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";
import getErrorMessage from "../../utils/getErrorMessage";
import { HTTP_STATUS } from "../../constants/httpStatus";

export const fetchMenteeDashboard = createAsyncThunk(
  "menteeProfile/fetchMenteeDashboard",
  async (_, { rejectWithValue }) => {
    try {
      const activeUserResponse = await axiosInstance.get("/users/me");
      const clientUserData = activeUserResponse.data;

      if (!clientUserData?.roles?.includes("mentee")) {
        return rejectWithValue({ reason: "wrong-role" });
      }

      try {
        const clientProfileResponse = await axiosInstance.get("/mentee-profile/me");
        return { user: clientUserData, profile: clientProfileResponse.data };
      } catch (nestedProfileException) {
        const nestedStatusCode = nestedProfileException?.response?.status;

        if (nestedStatusCode === HTTP_STATUS.NOT_FOUND) {
          return rejectWithValue({ reason: "no-profile", user: clientUserData });
        }
        if (nestedStatusCode === HTTP_STATUS.UNAUTHORIZED) {
          return rejectWithValue({ reason: "unauthorized" });
        }
        throw nestedProfileException;
      }
    } catch (globalRootException) {
      if (globalRootException?.response?.status === HTTP_STATUS.UNAUTHORIZED) {
        return rejectWithValue({ reason: "unauthorized" });
      }

      return rejectWithValue({
        reason: "error",
        message: getErrorMessage(globalRootException, "Something went wrong. Please try again."),
      });
    }
  }
);

const menteeProfileSlice = createSlice({
  name: "menteeProfile",
  initialState: {
    user: null,
    profile: null,
    loading: true,
    error: null,
  },
  reducers: {
    resetMenteeProfile(state) {
      state.user = null;
      state.profile = null;
      state.loading = true;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMenteeDashboard.pending, (state) => {
        state.error = null;
        state.loading = true;
      })
      .addCase(fetchMenteeDashboard.fulfilled, (state, { payload }) => {
        state.user = payload.user;
        state.profile = payload.profile;
        state.loading = false;
      })
      .addCase(fetchMenteeDashboard.rejected, (state, { payload }) => {
        const fallbackActionPayload = payload || {};

        if (fallbackActionPayload.reason === "no-profile") {
          state.user = fallbackActionPayload.user;
        } else if (fallbackActionPayload.reason === "error") {
          state.error = fallbackActionPayload.message;
        }
        state.loading = false;
      });
  },
});

export const { resetMenteeProfile } = menteeProfileSlice.actions;
export default menteeProfileSlice.reducer;