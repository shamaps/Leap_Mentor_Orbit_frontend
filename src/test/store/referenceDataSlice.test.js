import { describe, it, expect } from "vitest";
import reducer, {
    invalidateMentorList,
    invalidateIndustries,
    fetchMentorIndustries,
    fetchMentorList,
} from "../../store/slices/referenceDataSlice";

const initialState = {
    industries: [],
    mentorList: [],
    mentorListPagination: null,
    lastFetchedAt: null,
    mentorListFetchedAt: null,
    loading: false,
    error: null,
};

describe("referenceDataSlice", () => {
    it("returns the initial state", () => {
        expect(reducer(undefined, { type: "@@INIT" })).toEqual(initialState);
    });

    it("invalidateMentorList clears mentorList and mentorListFetchedAt", () => {
        const state = { ...initialState, mentorList: [{ id: "m1" }], mentorListFetchedAt: 12345 };
        const result = reducer(state, invalidateMentorList());
        expect(result.mentorList).toEqual([]);
        expect(result.mentorListFetchedAt).toBeNull();
    });

    it("invalidateIndustries clears industries and lastFetchedAt", () => {
        const state = { ...initialState, industries: ["Tech"], lastFetchedAt: 12345 };
        const result = reducer(state, invalidateIndustries());
        expect(result.industries).toEqual([]);
        expect(result.lastFetchedAt).toBeNull();
    });

    it("fetchMentorIndustries.fulfilled sets industries and lastFetchedAt when payload is not null", () => {
        const result = reducer(initialState, {
            type: fetchMentorIndustries.fulfilled.type,
            payload: ["Tech", "Finance"],
        });
        expect(result.industries).toEqual(["Tech", "Finance"]);
        expect(result.lastFetchedAt).toBeTruthy();
        expect(result.loading).toBe(false);
    });

    it("fetchMentorIndustries.fulfilled leaves industries untouched when payload is null (still-fresh cache)", () => {
        const state = { ...initialState, industries: ["Cached"], lastFetchedAt: 999 };
        const result = reducer(state, { type: fetchMentorIndustries.fulfilled.type, payload: null });
        expect(result.industries).toEqual(["Cached"]);
        expect(result.lastFetchedAt).toBe(999);
        expect(result.loading).toBe(false);
    });

    it("fetchMentorList.fulfilled sets mentorList/pagination/mentorListFetchedAt when payload is not null", () => {
        const result = reducer(initialState, {
            type: fetchMentorList.fulfilled.type,
            payload: { mentors: [{ id: "m1" }], pagination: { page: 1 } },
        });
        expect(result.mentorList).toEqual([{ id: "m1" }]);
        expect(result.mentorListPagination).toEqual({ page: 1 });
        expect(result.mentorListFetchedAt).toBeTruthy();
    });

    it("fetchMentorList.fulfilled leaves mentorList untouched when payload is null (still-fresh cache)", () => {
        const state = { ...initialState, mentorList: [{ id: "cached" }], mentorListFetchedAt: 999 };
        const result = reducer(state, { type: fetchMentorList.fulfilled.type, payload: null });
        expect(result.mentorList).toEqual([{ id: "cached" }]);
        expect(result.mentorListFetchedAt).toBe(999);
    });

    it("addMatcher sets loading:true for any referenceData/*/pending action", () => {
        const result = reducer(
            { ...initialState, error: "old" },
            { type: "referenceData/fetchMentorIndustries/pending" },
        );
        expect(result.loading).toBe(true);
        expect(result.error).toBeNull();
    });

    it("addMatcher sets error and clears loading for any referenceData/*/rejected action", () => {
        const result = reducer(
            { ...initialState, loading: true },
            { type: "referenceData/fetchMentorList/rejected", payload: "Failed to fetch mentors" },
        );
        expect(result.loading).toBe(false);
        expect(result.error).toBe("Failed to fetch mentors");
    });

    it("addMatcher does NOT match pending/rejected actions from unrelated slices", () => {
        const result = reducer(initialState, { type: "auth/loginUser/pending" });
        expect(result.loading).toBe(false); // untouched
    });
});