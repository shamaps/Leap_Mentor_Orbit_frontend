import { describe, it, expect } from "vitest";
import reducer, {
    clearMentorOnboardingMessages,
    submitMentorOnboarding,
} from "../../app/store/slices/mentorOnboardingSlice";

const initialState = { loading: false, error: null, successMsg: null };

describe("mentorOnboardingSlice", () => {
    it("returns the initial state", () => {
        expect(reducer(undefined, { type: "@@INIT" })).toEqual(initialState);
    });

    it("clearMentorOnboardingMessages clears error and successMsg", () => {
        const state = { loading: false, error: "err", successMsg: "msg" };
        expect(reducer(state, clearMentorOnboardingMessages())).toEqual(initialState);
    });

    it("submitMentorOnboarding.pending sets loading and clears messages", () => {
        const result = reducer(
            { ...initialState, error: "old", successMsg: "old" },
            { type: submitMentorOnboarding.pending.type },
        );
        expect(result.loading).toBe(true);
        expect(result.error).toBeNull();
        expect(result.successMsg).toBeNull();
    });

    it("submitMentorOnboarding.fulfilled sets the success message", () => {
        const result = reducer(initialState, { type: submitMentorOnboarding.fulfilled.type });
        expect(result.loading).toBe(false);
        expect(result.successMsg).toBe("Profile saved! Redirecting to dashboard…");
    });

    it("submitMentorOnboarding.rejected sets error from payload", () => {
        const result = reducer(initialState, {
            type: submitMentorOnboarding.rejected.type,
            payload: "Failed to save",
        });
        expect(result.loading).toBe(false);
        expect(result.error).toBe("Failed to save");
    });
});