// src/store/selectors.js
import { createSelector } from "@reduxjs/toolkit";
// ── Auth ────────────────────────────────────────────────────
export const selectAuthToken = (state) => state.auth.token;
export const selectAuthUser = (state) => state.auth.user;
export const selectIsBootstrapping = (state) => state.auth.isBootstrapping;
export const selectAuth = (state) => state.auth;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthSending = (state) => state.auth.sending;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthSuccessMsg = (state) => state.auth.successMsg;
// ── Mentor Profile ──────────────────────────────────────────
export const selectMentorProfile = (state) => state.mentorProfile;
export const selectMentorUser = (state) => state.mentorProfile.user;
export const selectMentorProfileData = (state) => state.mentorProfile.profile;
export const selectMentorProfileLoading = (state) =>
  state.mentorProfile.loading;
export const selectMentorProfileError = (state) => state.mentorProfile.error;

// ── Mentee Profile ──────────────────────────────────────────
export const selectMenteeProfile = (state) => state.menteeProfile;
export const selectMenteeUser = (state) => state.menteeProfile.user;
export const selectMenteeProfileData = (state) => state.menteeProfile.profile;
export const selectMenteeProfileLoading = (state) =>
  state.menteeProfile.loading;
export const selectMenteeProfileError = (state) => state.menteeProfile.error;

// ── Shared Connect ──────────────────────────────────────────
export const selectSharedConnect = (state) => state.sharedConnect;
export const selectConnect = (state) => state.sharedConnect.connect;
export const selectConnectLoading = (state) => state.sharedConnect.loading;
export const selectConnectError = (state) => state.sharedConnect.error;

// ── Mentee Onboarding ───────────────────────────────────────
export const selectMenteeOnboarding = (state) => state.menteeOnboarding;
// Granular selectors — use these in components to avoid re-renders on unrelated state changes
export const selectMenteeOnboardingLoading = (state) =>
  state.menteeOnboarding.loading;
export const selectMenteeOnboardingError = (state) =>
  state.menteeOnboarding.error;
export const selectMenteeOnboardingSuccessMsg = (state) =>
  state.menteeOnboarding.successMsg;

// ── Mentor Onboarding ───────────────────────────────────────
export const selectMentorOnboarding = (state) => state.mentorOnboarding;
export const selectMentorOnboardingLoading = (state) =>
  state.mentorOnboarding.loading;
export const selectMentorOnboardingError = (state) =>
  state.mentorOnboarding.error;
export const selectMentorOnboardingSuccessMsg = (state) =>
  state.mentorOnboarding.successMsg;
export const selectMentorIndustries = (state) => state.referenceData.industries;
export const selectMentorList = (state) => state.referenceData.mentorList;
export const selectMentorListPagination = (state) =>
  state.referenceData.mentorListPagination;
export const selectReferenceDataLoading = (state) =>
  state.referenceData.loading;
export const selectReferenceDataError = (state) => state.referenceData.error;

// ── Connect Requests ────────────────────────────────────────
import { selectIncomingRequests } from "./slices/connectRequestsSlice";

export const selectConnectRequestsLoading = (state) =>
  state.connectRequests.loading;
export const selectConnectRequestsInitialLoad = (state) =>
  state.connectRequests.initialLoad;
export const selectConnectRequestsError = (state) =>
  state.connectRequests.error;
export { selectIncomingRequests };

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
