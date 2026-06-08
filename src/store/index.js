// src/store/index.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer             from "./slices/authSlice";
import menteeOnboardingReducer from "./slices/menteeOnboardingSlice";
import mentorOnboardingReducer from "./slices/mentorOnboardingSlice";

export const store = configureStore({
  reducer: {
    auth:             authReducer,
    menteeOnboarding: menteeOnboardingReducer,
    mentorOnboarding: mentorOnboardingReducer,
  },
});

export default store;