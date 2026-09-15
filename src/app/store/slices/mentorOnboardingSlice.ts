// src/store/slices/mentorOnboardingSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "@/shared/utils/axiosInstance";
import getErrorMessage from "@/shared/utils/getErrorMessage";

export const submitMentorOnboarding = createAsyncThunk <
  unknown,
  Record<string, unknown>,
    { rejectValue: string }
    > (
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

interface MentorOnboardingState {
  loading: boolean;
  error: string | null;
  successMsg: string | null;
}

const mentorOnboardingSlice = createSlice({
  name: "mentorOnboarding",
  initialState: {
    loading: false,
    error: null,
    successMsg: null,
  } as MentorOnboardingState,
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
        state.error = action.payload ?? "Something went wrong.";
      });
  },
});

export const { clearMentorOnboardingMessages } = mentorOnboardingSlice.actions;
export default mentorOnboardingSlice.reducer;
