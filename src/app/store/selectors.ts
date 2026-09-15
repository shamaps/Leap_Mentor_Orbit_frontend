// src/store/selectors.ts
import { createSelector } from "@reduxjs/toolkit";
import type { RootState } from "./index";
import { selectIncomingRequests } from "./slices/connectRequestsSlice";

// ── Auth ────────────────────────────────────────────────────
export const selectAuthToken = (state: RootState) => state.auth.token;
export const selectAuthUser = (state: RootState) => state.auth.user;
export const selectIsBootstrapping = (state: RootState) => state.auth.isBootstrapping;
export const selectAuth = (state: RootState) => state.auth;
export const selectAuthLoading = (state: RootState) => state.auth.loading;
export const selectAuthSending = (state: RootState) => state.auth.sending;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectAuthSuccessMsg = (state: RootState) => state.auth.successMsg;

// ── Mentor Profile ──────────────────────────────────────────
export const selectMentorProfile = (state: RootState) => state.mentorProfile;
export const selectMentorUser = (state: RootState) => state.mentorProfile.user;
export const selectMentorProfileData = (state: RootState) => state.mentorProfile.profile;
export const selectMentorProfileLoading = (state: RootState) =>
  state.mentorProfile.loading;
export const selectMentorProfileError = (state: RootState) => state.mentorProfile.error;

// ── Mentee Profile ──────────────────────────────────────────
export const selectMenteeProfile = (state: RootState) => state.menteeProfile;
export const selectMenteeUser = (state: RootState) => state.menteeProfile.user;
export const selectMenteeProfileData = (state: RootState) => state.menteeProfile.profile;
export const selectMenteeProfileLoading = (state: RootState) =>
  state.menteeProfile.loading;
export const selectMenteeProfileError = (state: RootState) => state.menteeProfile.error;

// ── Shared Connect ──────────────────────────────────────────
export const selectSharedConnect = (state: RootState) => state.sharedConnect;
export const selectConnect = (state: RootState) => state.sharedConnect.connect;
export const selectConnectLoading = (state: RootState) => state.sharedConnect.loading;
export const selectConnectError = (state: RootState) => state.sharedConnect.error;

// ── Mentee Onboarding ───────────────────────────────────────
export const selectMenteeOnboarding = (state: RootState) => state.menteeOnboarding;
// Granular selectors — use these in components to avoid re-renders on unrelated state changes
export const selectMenteeOnboardingLoading = (state: RootState) =>
  state.menteeOnboarding.loading;
export const selectMenteeOnboardingError = (state: RootState) =>
  state.menteeOnboarding.error;
export const selectMenteeOnboardingSuccessMsg = (state: RootState) =>
  state.menteeOnboarding.successMsg;

// ── Mentor Onboarding ───────────────────────────────────────
export const selectMentorOnboarding = (state: RootState) => state.mentorOnboarding;
export const selectMentorOnboardingLoading = (state: RootState) =>
  state.mentorOnboarding.loading;
export const selectMentorOnboardingError = (state: RootState) =>
  state.mentorOnboarding.error;
export const selectMentorOnboardingSuccessMsg = (state: RootState) =>
  state.mentorOnboarding.successMsg;

// ── Reference Data ────────────────────────────────────────────
type StateWithReferenceData = RootState & {
  referenceData: {
    industries: string[];
    mentorList: unknown[];
    mentorListPagination: Record<string, unknown> | null;
    loading: boolean;
    error: string | null;
  };
};

export const selectMentorIndustries = (state: RootState) =>
  (state as StateWithReferenceData).referenceData.industries;
export const selectMentorList = (state: RootState) =>
  (state as StateWithReferenceData).referenceData.mentorList;
export const selectMentorListPagination = (state: RootState) =>
  (state as StateWithReferenceData).referenceData.mentorListPagination;
export const selectReferenceDataLoading = (state: RootState) =>
  (state as StateWithReferenceData).referenceData.loading;
export const selectReferenceDataError = (state: RootState) =>
  (state as StateWithReferenceData).referenceData.error;

export const selectGlobalError = (state: RootState) => state.ui.globalError;

// ── Connect Requests ────────────────────────────────────────
export const selectConnectRequestsLoading = (state: RootState) =>
  state.connectRequests.loading;
export const selectConnectRequestsInitialLoad = (state: RootState) =>
  state.connectRequests.initialLoad;
export const selectConnectRequestsError = (state: RootState) =>
  state.connectRequests.error;
export { selectIncomingRequests } from "./slices/connectRequestsSlice";

export const selectActiveSessions = createSelector(
  [selectIncomingRequests],
  (requests) =>
    requests.filter((r) => r.status === "ongoing" || r.status === "accepted"),
);

export const selectPendingCount = createSelector(
  [selectIncomingRequests],
  (requests) => requests.filter((r) => r.status === "pending").length,
);

export const selectCompletedCount = createSelector(
  [selectIncomingRequests],
  (requests) => requests.filter((r) => r.status === "completed").length,
);