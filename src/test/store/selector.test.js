import { describe, it, expect, vi } from "vitest";

vi.mock("../../store/slices/connectRequestsSlice", () => ({
    selectIncomingRequests: (state) => state.connectRequests.incomingRequests,
}));

import {
    selectAuthToken,
    selectAuthUser,
    selectIsBootstrapping,
    selectAuth,
    selectAuthLoading,
    selectAuthSending,
    selectAuthError,
    selectAuthSuccessMsg,
    selectMentorProfile,
    selectMentorUser,
    selectMentorProfileData,
    selectMentorProfileLoading,
    selectMentorProfileError,
    selectMenteeProfile,
    selectMenteeUser,
    selectMenteeProfileData,
    selectMenteeProfileLoading,
    selectMenteeProfileError,
    selectSharedConnect,
    selectConnect,
    selectConnectLoading,
    selectConnectError,
    selectMenteeOnboarding,
    selectMenteeOnboardingLoading,
    selectMenteeOnboardingError,
    selectMenteeOnboardingSuccessMsg,
    selectMentorOnboarding,
    selectMentorOnboardingLoading,
    selectMentorOnboardingError,
    selectMentorOnboardingSuccessMsg,
    selectMentorIndustries,
    selectMentorList,
    selectMentorListPagination,
    selectReferenceDataLoading,
    selectReferenceDataError,
    selectGlobalError,
    selectConnectRequestsLoading,
    selectConnectRequestsInitialLoad,
    selectConnectRequestsError,
    selectIncomingRequests,
    selectActiveSessions,
    selectPendingCount,
    selectCompletedCount,
} from "../../store/selectors";

const buildState = (overrides = {}) => ({
    auth: {
        token: "abc123",
        user: { _id: "u1", name: "Alex" },
        isBootstrapping: true,
        loading: false,
        sending: false,
        error: null,
        successMsg: null,
    },
    mentorProfile: {
        user: { name: "Mentor Alex" },
        profile: { currentRole: "Engineer" },
        loading: false,
        error: null,
    },
    menteeProfile: {
        user: { name: "Mentee Sam" },
        profile: { goal: "Learn React" },
        loading: false,
        error: null,
    },
    sharedConnect: {
        connect: { _id: "c1" },
        loading: false,
        error: null,
    },
    menteeOnboarding: {
        loading: false,
        error: null,
        successMsg: null,
    },
    mentorOnboarding: {
        loading: false,
        error: null,
        successMsg: null,
    },
    referenceData: {
        industries: ["Tech", "Finance"],
        mentorList: [{ _id: "m1" }],
        mentorListPagination: { page: 1, total: 10 },
        loading: false,
        error: null,
    },
    ui: {
        globalError: null,
    },
    connectRequests: {
        incomingRequests: [],
        loading: false,
        initialLoad: true,
        error: null,
    },
    ...overrides,
});

describe("store selectors", () => {
    describe("auth selectors", () => {
        it("selects the auth token", () => {
            expect(selectAuthToken(buildState())).toBe("abc123");
        });

        it("selects the auth user", () => {
            expect(selectAuthUser(buildState())).toEqual({ _id: "u1", name: "Alex" });
        });

        it("selects isBootstrapping", () => {
            expect(selectIsBootstrapping(buildState())).toBe(true);
        });

        it("selects the full auth slice", () => {
            const state = buildState();
            expect(selectAuth(state)).toBe(state.auth);
        });

        it("selects auth loading, sending, error and successMsg", () => {
            const state = buildState({
                auth: {
                    token: null,
                    user: null,
                    isBootstrapping: false,
                    loading: true,
                    sending: true,
                    error: "Invalid credentials",
                    successMsg: "Logged in",
                },
            });

            expect(selectAuthLoading(state)).toBe(true);
            expect(selectAuthSending(state)).toBe(true);
            expect(selectAuthError(state)).toBe("Invalid credentials");
            expect(selectAuthSuccessMsg(state)).toBe("Logged in");
        });
    });

    describe("mentor profile selectors", () => {
        it("selects the full mentor profile slice", () => {
            const state = buildState();
            expect(selectMentorProfile(state)).toBe(state.mentorProfile);
        });

        it("selects mentor user and profile data", () => {
            const state = buildState();
            expect(selectMentorUser(state)).toEqual({ name: "Mentor Alex" });
            expect(selectMentorProfileData(state)).toEqual({ currentRole: "Engineer" });
        });

        it("selects mentor profile loading and error", () => {
            const state = buildState({
                mentorProfile: { user: {}, profile: {}, loading: true, error: "fail" },
            });
            expect(selectMentorProfileLoading(state)).toBe(true);
            expect(selectMentorProfileError(state)).toBe("fail");
        });
    });

    describe("mentee profile selectors", () => {
        it("selects the full mentee profile slice", () => {
            const state = buildState();
            expect(selectMenteeProfile(state)).toBe(state.menteeProfile);
        });

        it("selects mentee user and profile data", () => {
            const state = buildState();
            expect(selectMenteeUser(state)).toEqual({ name: "Mentee Sam" });
            expect(selectMenteeProfileData(state)).toEqual({ goal: "Learn React" });
        });

        it("selects mentee profile loading and error", () => {
            const state = buildState({
                menteeProfile: { user: {}, profile: {}, loading: true, error: "fail" },
            });
            expect(selectMenteeProfileLoading(state)).toBe(true);
            expect(selectMenteeProfileError(state)).toBe("fail");
        });
    });

    describe("shared connect selectors", () => {
        it("selects the full sharedConnect slice, connect, loading and error", () => {
            const state = buildState();
            expect(selectSharedConnect(state)).toBe(state.sharedConnect);
            expect(selectConnect(state)).toEqual({ _id: "c1" });
            expect(selectConnectLoading(state)).toBe(false);
            expect(selectConnectError(state)).toBe(null);
        });
    });

    describe("mentee onboarding selectors", () => {
        it("selects the full slice, loading, error and successMsg", () => {
            const state = buildState({
                menteeOnboarding: { loading: true, error: "e", successMsg: "s" },
            });
            expect(selectMenteeOnboarding(state)).toBe(state.menteeOnboarding);
            expect(selectMenteeOnboardingLoading(state)).toBe(true);
            expect(selectMenteeOnboardingError(state)).toBe("e");
            expect(selectMenteeOnboardingSuccessMsg(state)).toBe("s");
        });
    });

    describe("mentor onboarding selectors", () => {
        it("selects the full slice, loading, error and successMsg", () => {
            const state = buildState({
                mentorOnboarding: { loading: true, error: "e", successMsg: "s" },
            });
            expect(selectMentorOnboarding(state)).toBe(state.mentorOnboarding);
            expect(selectMentorOnboardingLoading(state)).toBe(true);
            expect(selectMentorOnboardingError(state)).toBe("e");
            expect(selectMentorOnboardingSuccessMsg(state)).toBe("s");
        });
    });

    describe("reference data selectors", () => {
        it("selects industries, mentor list, pagination, loading and error", () => {
            const state = buildState();
            expect(selectMentorIndustries(state)).toEqual(["Tech", "Finance"]);
            expect(selectMentorList(state)).toEqual([{ _id: "m1" }]);
            expect(selectMentorListPagination(state)).toEqual({ page: 1, total: 10 });
            expect(selectReferenceDataLoading(state)).toBe(false);
            expect(selectReferenceDataError(state)).toBe(null);
        });
    });

    describe("ui selectors", () => {
        it("selects the global error", () => {
            const state = buildState({ ui: { globalError: "Something broke" } });
            expect(selectGlobalError(state)).toBe("Something broke");
        });
    });

    describe("connect requests selectors", () => {
        it("selects loading, initialLoad and error", () => {
            const state = buildState({
                connectRequests: {
                    incomingRequests: [],
                    loading: true,
                    initialLoad: false,
                    error: "err",
                },
            });
            expect(selectConnectRequestsLoading(state)).toBe(true);
            expect(selectConnectRequestsInitialLoad(state)).toBe(false);
            expect(selectConnectRequestsError(state)).toBe("err");
        });

        it("re-exports selectIncomingRequests from the slice", () => {
            const state = buildState({
                connectRequests: {
                    incomingRequests: [{ _id: "r1" }],
                    loading: false,
                    initialLoad: true,
                    error: null,
                },
            });
            expect(selectIncomingRequests(state)).toEqual([{ _id: "r1" }]);
        });
    });

    describe("derived session selectors", () => {
        const requests = [
            { _id: "1", status: "ongoing" },
            { _id: "2", status: "accepted" },
            { _id: "3", status: "pending" },
            { _id: "4", status: "pending" },
            { _id: "5", status: "completed" },
            { _id: "6", status: "completed" },
            { _id: "7", status: "completed" },
            { _id: "8", status: "rejected" },
        ];

        const stateWithRequests = buildState({
            connectRequests: {
                incomingRequests: requests,
                loading: false,
                initialLoad: false,
                error: null,
            },
        });

        it("selectActiveSessions returns only ongoing and accepted requests", () => {
            const result = selectActiveSessions(stateWithRequests);
            expect(result).toHaveLength(2);
            expect(result.map((r) => r.status)).toEqual(
                expect.arrayContaining(["ongoing", "accepted"])
            );
        });

        it("selectPendingCount counts only pending requests", () => {
            expect(selectPendingCount(stateWithRequests)).toBe(2);
        });

        it("selectCompletedCount counts only completed requests", () => {
            expect(selectCompletedCount(stateWithRequests)).toBe(3);
        });

        it("returns empty/zero results when there are no incoming requests", () => {
            const emptyState = buildState({
                connectRequests: {
                    incomingRequests: [],
                    loading: false,
                    initialLoad: true,
                    error: null,
                },
            });

            expect(selectActiveSessions(emptyState)).toEqual([]);
            expect(selectPendingCount(emptyState)).toBe(0);
            expect(selectCompletedCount(emptyState)).toBe(0);
        });

        it("memoizes selectActiveSessions output for the same input reference", () => {
            const firstCall = selectActiveSessions(stateWithRequests);
            const secondCall = selectActiveSessions(stateWithRequests);
            expect(firstCall).toBe(secondCall);
        });
    });
});