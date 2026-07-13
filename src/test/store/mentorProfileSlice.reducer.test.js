import { describe, it, expect } from "vitest";
import reducer, {
    resetMentorProfile,
    fetchMentorDashboard,
    refetchMentorProfile,
} from "../../store/slices/mentorProfileSlice";

const initialState = {
    user: null,
    profile: null,
    loading: true,
    error: null,
};

describe("mentorProfileSlice reducer", () => {
    it("returns the initial state", () => {
        expect(reducer(undefined, { type: "@@INIT" })).toEqual(initialState);
    });

    it("resetMentorProfile resets state back to initial values", () => {
        const dirtyState = {
            user: { name: "x" },
            profile: { bio: "y" },
            loading: false,
            error: "boom",
        };
        expect(reducer(dirtyState, resetMentorProfile())).toEqual(initialState);
    });

    it("fetchMentorDashboard.pending clears error and sets loading true", () => {
        const startState = { ...initialState, loading: false, error: "old error" };
        const state = reducer(startState, { type: fetchMentorDashboard.pending.type });
        expect(state.error).toBeNull();
        expect(state.loading).toBe(true);
    });

    it("fetchMentorDashboard.fulfilled sets user, profile, and loading false", () => {
        const payload = { user: { name: "mentor" }, profile: { bio: "hi" } };
        const state = reducer(initialState, {
            type: fetchMentorDashboard.fulfilled.type,
            payload,
        });
        expect(state.user).toEqual(payload.user);
        expect(state.profile).toEqual(payload.profile);
        expect(state.loading).toBe(false);
    });

    it("fetchMentorDashboard.rejected with reason 'no-profile' sets user only", () => {
        const payload = { reason: "no-profile", user: { name: "mentor" } };
        const state = reducer(initialState, {
            type: fetchMentorDashboard.rejected.type,
            payload,
        });
        expect(state.user).toEqual(payload.user);
        expect(state.error).toBeNull();
        expect(state.loading).toBe(false);
    });

    it("fetchMentorDashboard.rejected with reason 'error' sets error message", () => {
        const payload = { reason: "error", message: "Something went wrong" };
        const state = reducer(initialState, {
            type: fetchMentorDashboard.rejected.type,
            payload,
        });
        expect(state.error).toBe("Something went wrong");
        expect(state.loading).toBe(false);
    });

    it("fetchMentorDashboard.rejected with an unhandled reason (e.g. 'wrong-role') leaves user/error untouched", () => {
        const payload = { reason: "wrong-role" };
        const state = reducer(initialState, {
            type: fetchMentorDashboard.rejected.type,
            payload,
        });
        expect(state.user).toBeNull();
        expect(state.error).toBeNull();
        expect(state.loading).toBe(false);
    });

    it("fetchMentorDashboard.rejected with no payload (falsy) falls back to empty object", () => {
        const state = reducer(initialState, {
            type: fetchMentorDashboard.rejected.type,
            payload: undefined,
        });
        expect(state.user).toBeNull();
        expect(state.error).toBeNull();
        expect(state.loading).toBe(false);
    });

    it("refetchMentorProfile.fulfilled updates profile", () => {
        const payload = { bio: "updated bio" };
        const state = reducer(initialState, {
            type: refetchMentorProfile.fulfilled.type,
            payload,
        });
        expect(state.profile).toEqual(payload);
    });
});