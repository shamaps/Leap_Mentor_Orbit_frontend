import { describe, it, expect } from "vitest";
import reducer, {
    resetSharedConnect,
    fetchSharedConnect,
} from "../../app/store/slices/sharedConnectSlice";

const initialState = { connect: null, loading: true, error: null };

describe("sharedConnectSlice", () => {
    it("returns the initial state", () => {
        expect(reducer(undefined, { type: "@@INIT" })).toEqual(initialState);
    });

    it("resetSharedConnect resets all fields", () => {
        const state = { connect: { id: "c1" }, loading: false, error: "err" };
        expect(reducer(state, resetSharedConnect())).toEqual(initialState);
    });

    it("fetchSharedConnect.pending sets loading and clears error", () => {
        const result = reducer(
            { ...initialState, error: "old", loading: false },
            { type: fetchSharedConnect.pending.type },
        );
        expect(result.loading).toBe(true);
        expect(result.error).toBeNull();
    });

    it("fetchSharedConnect.fulfilled sets connect and clears loading", () => {
        const result = reducer(initialState, {
            type: fetchSharedConnect.fulfilled.type,
            payload: { id: "c1", status: "confirmed" },
        });
        expect(result.connect).toEqual({ id: "c1", status: "confirmed" });
        expect(result.loading).toBe(false);
    });

    it("fetchSharedConnect.rejected with reason 'error' sets error message", () => {
        const result = reducer(initialState, {
            type: fetchSharedConnect.rejected.type,
            payload: { reason: "error", message: "Failed to load session." },
        });
        expect(result.error).toBe("Failed to load session.");
        expect(result.loading).toBe(false);
    });

    it("fetchSharedConnect.rejected with reason 'unauthorized' or 'forbidden' just clears loading", () => {
        const result = reducer(initialState, {
            type: fetchSharedConnect.rejected.type,
            payload: { reason: "forbidden" },
        });
        expect(result.error).toBeNull();
        expect(result.loading).toBe(false);
    });

    it("fetchSharedConnect.rejected defaults to {} when payload is absent", () => {
        const result = reducer(initialState, { type: fetchSharedConnect.rejected.type });
        expect(result.error).toBeNull();
        expect(result.loading).toBe(false);
    });
});