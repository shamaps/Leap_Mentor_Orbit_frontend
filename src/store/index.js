// src/store/index.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import menteeOnboardingReducer from "./slices/menteeOnboardingSlice";
import mentorOnboardingReducer from "./slices/mentorOnboardingSlice";
import mentorProfileReducer from "./slices/mentorProfileSlice";
import menteeProfileReducer from "./slices/menteeProfileSlice";
import sharedConnectReducer from "./slices/sharedConnectSlice";
import connectRequestsReducer from "./slices/connectRequestsSlice";
import { injectStore } from "../utils/axiosInstance";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    menteeOnboarding: menteeOnboardingReducer,
    mentorOnboarding: mentorOnboardingReducer,
    mentorProfile: mentorProfileReducer,
    menteeProfile: menteeProfileReducer,
    sharedConnect: sharedConnectReducer,
    connectRequests: connectRequestsReducer,
  },
});
// Give axiosInstance a live reference now that the store exists,
// instead of axiosInstance importing "../store" directly (circular).
injectStore(store);
export default store;