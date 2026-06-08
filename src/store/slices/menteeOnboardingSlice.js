// src/store/slices/menteeOnboardingSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";
import getErrorMessage from "../../utils/getErrorMessage";

// mentorOnboardingSlice.js
// ✅ STEP 1 — thunk first
export const submitMenteeOnboarding = createAsyncThunk(
  "menteeOnboarding/submit",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post("/mentee-profile", payload, {
      });
      return res.data;
    } catch (err) {
      return rejectWithValue(getErrorMessage(err));
    }
  }
);

// ✅ STEP 2 — slice second (can now safely reference the thunk above)
const menteeOnboardingSlice = createSlice({
  name: "menteeOnboarding",
  initialState: { loading: false, error: null, successMsg: null },
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
      .addCase(submitMenteeOnboarding.fulfilled, (state, action) => {
        state.loading = false;
        state.successMsg = action.payload?.message || "Onboarding complete!";
      })
      .addCase(submitMenteeOnboarding.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearOnboardingMessages } = menteeOnboardingSlice.actions;
export default menteeOnboardingSlice.reducer;