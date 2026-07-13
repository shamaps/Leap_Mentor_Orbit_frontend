import { describe, it, expect } from "vitest";
import reducer, {
    clearOnboardingMessages,
    submitMenteeOnboarding,
} from "../../store/slices/menteeOnboardingSlice";

const initialState = { loading: false, error: null, successMsg: null };

describe("menteeOnboardingSlice", () => {
    it("returns the initial state", () => {
        expect(reducer(undefined, { type: "@@INIT" })).toEqual(initialState);
    });

    it("clearOnboardingMessages clears error and successMsg", () => {
        const state = { loading: false, error: "err", successMsg: "msg" };
        expect(reducer(state, clearOnboardingMessages())).toEqual(initialState);
    });

    it("submitMenteeOnboarding.pending sets loading and clears error", () => {
        const result = reducer(
            { ...initialState, error: "old" },
            { type: submitMenteeOnboarding.pending.type },
        );
        expect(result.loading).toBe(true);
        expect(result.error).toBeNull();
    });

    it("submitMenteeOnboarding.fulfilled uses payload.message when present", () => {
        const result = reducer(initialState, {
            type: submitMenteeOnboarding.fulfilled.type,
            payload: { message: "Custom success" },
        });
        expect(result.loading).toBe(false);
        expect(result.successMsg).toBe("Custom success");
    });

    it("submitMenteeOnboarding.fulfilled defaults to 'Onboarding complete!' when payload has no message", () => {
        const result = reducer(initialState, {
            type: submitMenteeOnboarding.fulfilled.type,
            payload: {},
        });
        expect(result.successMsg).toBe("Onboarding complete!");
    });

    it("submitMenteeOnboarding.fulfilled defaults message when payload itself is absent", () => {
        const result = reducer(initialState, { type: submitMenteeOnboarding.fulfilled.type });
        expect(result.successMsg).toBe("Onboarding complete!");
    });

    it("submitMenteeOnboarding.rejected sets error from payload", () => {
        const result = reducer(initialState, {
            type: submitMenteeOnboarding.rejected.type,
            payload: "Something failed",
        });
        expect(result.loading).toBe(false);
        expect(result.error).toBe("Something failed");
    });
});