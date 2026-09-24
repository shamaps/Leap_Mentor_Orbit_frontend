import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInjectStore = vi.fn();
vi.mock("../../shared/utils/axiosInstance", () => ({
    injectStore: mockInjectStore,
}));

describe("store/index.js", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
    });

    it("configures a store with all expected reducer keys", async () => {
        const { default: store } = await import("../../app/store/index");
        const state = store.getState();

        expect(state).toHaveProperty("auth");
        expect(state).toHaveProperty("menteeOnboarding");
        expect(state).toHaveProperty("mentorOnboarding");
        expect(state).toHaveProperty("mentorProfile");
        expect(state).toHaveProperty("menteeProfile");
        expect(state).toHaveProperty("sharedConnect");
        expect(state).toHaveProperty("connectRequests");
        expect(state).toHaveProperty("ui");
    });

    it("does NOT register a referenceData reducer, even though selectors.js reads state.referenceData", async () => {
        const { default: store } = await import("../../app/store/index");
        const state = store.getState();

        // Flags a real mismatch: selectors.js assumes state.referenceData exists,
        // but no referenceData slice is wired into this store.
        expect(state.referenceData).toBeUndefined();
    });

    it("calls injectStore with the created store instance so axiosInstance can use it", async () => {
        const { default: store } = await import("../../app/store/index");

        expect(mockInjectStore).toHaveBeenCalledTimes(1);
        expect(mockInjectStore).toHaveBeenCalledWith(store);
    });

    it("exposes dispatch and subscribe as a valid Redux store", async () => {
        const { default: store } = await import("../../app/store/index");

        expect(typeof store.dispatch).toBe("function");
        expect(typeof store.subscribe).toBe("function");
        expect(typeof store.getState).toBe("function");
    });
});