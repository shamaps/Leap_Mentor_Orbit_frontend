// src/store/index.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import menteeOnboardingReducer from "./slices/menteeOnboardingSlice";
import mentorOnboardingReducer from "./slices/mentorOnboardingSlice";
import mentorProfileReducer from "./slices/mentorProfileSlice";
import menteeProfileReducer from "./slices/menteeProfileSlice";
import sharedConnectReducer from "./slices/sharedConnectSlice";
import connectRequestsReducer from "./slices/connectRequestsSlice";
import { injectStore } from "@/shared/utils/axiosInstance";
import uiReducer from "./slices/uiSlice";
export const store = configureStore({
  reducer: {
    auth: authReducer,
    menteeOnboarding: menteeOnboardingReducer,
    mentorOnboarding: mentorOnboardingReducer,
    mentorProfile: mentorProfileReducer,
    menteeProfile: menteeProfileReducer,
    sharedConnect: sharedConnectReducer,
    connectRequests: connectRequestsReducer,
    ui: uiReducer,
  }, devTools: true,
});
injectStore(store);
export default store;
