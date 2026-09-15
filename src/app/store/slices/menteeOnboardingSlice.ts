// src/store/slices/menteeOnboardingSlice.js
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import axiosInstance from "@/shared/utils/axiosInstance";
import getErrorMessage from "@/shared/utils/getErrorMessage";

interface OnboardingResponse {
  message?: string;
}

// STEP 1 — thunk first
export const submitMenteeOnboarding = createAsyncThunk<
  OnboardingResponse,
  Record<string, unknown>,
  { rejectValue: string }
>(
  "menteeOnboarding/submit",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/mentee-profile", payload, {});
      return res.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  },
);

interface MenteeOnboardingState {
  loading: boolean;
  error: string | null;
  successMsg: string | null;
}

// STEP 2 — slice second (can now safely reference the thunk above)
const menteeOnboardingSlice = createSlice({
  name: "menteeOnboarding",
  initialState: { loading: false, error: null, successMsg: null } as MenteeOnboardingState,
  reducers: {
    clearOnboardingMessages(state) {
      state.error = null;
      state.successMsg = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitMenteeOnboarding.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(submitMenteeOnboarding.fulfilled, (state, action: PayloadAction<OnboardingResponse>) => {
        state.loading = false;
        state.successMsg = action.payload?.message || "Onboarding complete!";
      })
      .addCase(submitMenteeOnboarding.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Something went wrong.";
      });
  },
});

export const { clearOnboardingMessages } = menteeOnboardingSlice.actions;
export default menteeOnboardingSlice.reducer;