// src/store/slices/mentorOnboardingSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/shared/utils/axiosInstance";
import getErrorMessage from "@/shared/utils/getErrorMessage";

export const submitMentorOnboarding = createAsyncThunk(
  "mentorOnboarding/submit",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/mentor-profile", payload, {});
      return res.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err, "Something went wrong."));
    }
  },
);

const mentorOnboardingSlice = createSlice({
  name: "mentorOnboarding",
  initialState: {
    loading: false,
    error: null,
    successMsg: null,
  },
  reducers: {
    clearMentorOnboardingMessages(state) {
      state.error = null;
      state.successMsg = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitMentorOnboarding.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMsg = null;
      })
      .addCase(submitMentorOnboarding.fulfilled, (state) => {
        state.loading = false;
        state.successMsg = "Profile saved! Redirecting to dashboard…";
      })
      .addCase(submitMentorOnboarding.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearMentorOnboardingMessages } = mentorOnboardingSlice.actions;
export default mentorOnboardingSlice.reducer;
