import { describe, it, expect } from "vitest";
import reducer, { setGlobalError, clearGlobalError } from "../../app/store/slices/uiSlice";

describe("uiSlice", () => {
    it("returns the initial state", () => {
        expect(reducer(undefined, { type: "@@INIT" })).toEqual({ globalError: null });
    });

    it("setGlobalError sets globalError to the payload", () => {
        const payload = { message: "Something broke", code: 500 };
        expect(reducer(undefined, setGlobalError(payload)).globalError).toEqual(payload);
    });

    it("clearGlobalError resets globalError to null", () => {
        const state = { globalError: { message: "err", code: 500 } };
        expect(reducer(state, clearGlobalError())).toEqual({ globalError: null });
    });
});