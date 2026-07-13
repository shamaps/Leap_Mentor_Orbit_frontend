import { describe, it, expect } from "vitest";
import reducer, {
    resetMenteeProfile,
    fetchMenteeDashboard,
} from "../../store/slices/menteeProfileSlice";

const initialState = { user: null, profile: null, loading: true, error: null };

describe("menteeProfileSlice", () => {
    it("returns the initial state", () => {
        expect(reducer(undefined, { type: "@@INIT" })).toEqual(initialState);
    });

    it("resetMenteeProfile resets all fields", () => {
        const state = { user: { id: "u1" }, profile: { bio: "x" }, loading: false, error: "err" };
        expect(reducer(state, resetMenteeProfile())).toEqual(initialState);
    });

    it("fetchMenteeDashboard.pending clears error and sets loading", () => {
        const result = reducer(
            { ...initialState, error: "old", loading: false },
            { type: fetchMenteeDashboard.pending.type },
        );
        expect(result.error).toBeNull();
        expect(result.loading).toBe(true);
    });

    it("fetchMenteeDashboard.fulfilled sets user and profile, clears loading", () => {
        const payload = { user: { id: "u1" }, profile: { bio: "x" } };
        const result = reducer(initialState, { type: fetchMenteeDashboard.fulfilled.type, payload });
        expect(result.user).toEqual(payload.user);
        expect(result.profile).toEqual(payload.profile);
        expect(result.loading).toBe(false);
    });

    it("fetchMenteeDashboard.rejected with reason 'no-profile' sets user but not error", () => {
        const result = reducer(initialState, {
            type: fetchMenteeDashboard.rejected.type,
            payload: { reason: "no-profile", user: { id: "u1" } },
        });
        expect(result.user).toEqual({ id: "u1" });
        expect(result.error).toBeNull();
        expect(result.loading).toBe(false);
    });

    it("fetchMenteeDashboard.rejected with reason 'error' sets error message", () => {
        const result = reducer(initialState, {
            type: fetchMenteeDashboard.rejected.type,
            payload: { reason: "error", message: "Something went wrong" },
        });
        expect(result.error).toBe("Something went wrong");
    });

    it("fetchMenteeDashboard.rejected with reason 'wrong-role' or 'unauthorized' just clears loading", () => {
        const result = reducer(initialState, {
            type: fetchMenteeDashboard.rejected.type,
            payload: { reason: "wrong-role" },
        });
        expect(result.loading).toBe(false);
        expect(result.user).toBeNull();
        expect(result.error).toBeNull();
    });

    it("fetchMenteeDashboard.rejected defaults to {} when payload is entirely absent", () => {
        const result = reducer(initialState, { type: fetchMenteeDashboard.rejected.type });
        expect(result.loading).toBe(false);
        expect(result.user).toBeNull();
        expect(result.error).toBeNull();
    });
});