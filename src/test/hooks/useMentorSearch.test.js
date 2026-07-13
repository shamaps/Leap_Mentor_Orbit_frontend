// src/test/hooks/useMentorSearch.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useMentorSearch from "../../hooks/useMentorSearch";
import { searchMentors as searchMentorsApi } from "../../api/mentorSearch.api";

vi.mock("../../api/mentorSearch.api", () => ({
    searchMentors: vi.fn(),
}));

const DEBOUNCE_MS = 300;

const makePage = (overrides = {}) => ({
    mentors: [{ id: "m1", name: "Ravi" }],
    pagination: { hasMore: false, totalCount: 1 },
    ...overrides,
});

describe("useMentorSearch", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        searchMentorsApi.mockReset();
        searchMentorsApi.mockResolvedValue(makePage());
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it("returns the expected initial state", () => {
        const { result } = renderHook(() => useMentorSearch());

        expect(result.current.skill).toBe("");
        expect(result.current.filters).toEqual({
            industry: "",
            minPrice: "",
            maxPrice: "",
            minRating: "",
            experience: "",
        });
        expect(result.current.mentors).toEqual([]);
        expect(result.current.loading).toBe(false);
        expect(result.current.loadingMore).toBe(false);
        expect(result.current.error).toBe("");
        expect(result.current.hasSearched).toBe(false);
        expect(result.current.hasMore).toBe(false);
        expect(result.current.totalCount).toBe(0);
    });

    it("debounces skill changes into a single fetch after DEBOUNCE_MS", async () => {
        const { result } = renderHook(() => useMentorSearch());

        act(() => {
            result.current.setSkill("Re");
        });
        act(() => {
            result.current.setSkill("Rea");
        });
        act(() => {
            result.current.setSkill("React");
        });

        expect(searchMentorsApi).not.toHaveBeenCalled();

        await act(async () => {
            vi.advanceTimersByTime(DEBOUNCE_MS);
        });

        expect(searchMentorsApi).toHaveBeenCalledTimes(1);
        const params = searchMentorsApi.mock.calls[0][0];
        expect(params.get("skill")).toBe("React");
        expect(params.get("name")).toBe("React");
        expect(params.get("page")).toBe("1");
        expect(params.get("limit")).toBe("6");
    });

    it("trims the skill before sending it and does not set skill/name params when blank", async () => {
        const { result } = renderHook(() => useMentorSearch());

        act(() => {
            result.current.setSkill("   ");
        });
        await act(async () => {
            vi.advanceTimersByTime(DEBOUNCE_MS);
        });

        const params = searchMentorsApi.mock.calls[0][0];
        expect(params.has("skill")).toBe(false);
        expect(params.has("name")).toBe(false);
    });

    it("clears a prior error as soon as setSkill is called", async () => {
        const { result } = renderHook(() => useMentorSearch());

        act(() => result.current.setSkill("x"));
        await act(async () => vi.advanceTimersByTime(DEBOUNCE_MS));
        // default mock resolves successfully — no error yet
        expect(result.current.error).toBe("");

        searchMentorsApi.mockRejectedValueOnce(new Error("network down"));
        act(() => result.current.setSkill("y"));
        await act(async () => {
            vi.advanceTimersByTime(DEBOUNCE_MS);
            await Promise.resolve();
        });
        expect(result.current.error).toBe("network down");

        act(() => result.current.setSkill("z"));
        expect(result.current.error).toBe("");
    });

    it("updateFilter sets the given key, clears error, and triggers a debounced fetch", async () => {
        const { result } = renderHook(() => useMentorSearch());

        act(() => {
            result.current.updateFilter("industry", "Tech");
        });
        expect(result.current.filters.industry).toBe("Tech");

        await act(async () => {
            vi.advanceTimersByTime(DEBOUNCE_MS);
        });

        const params = searchMentorsApi.mock.calls[0][0];
        expect(params.get("industry")).toBe("Tech");
    });

    it.each([
        ["0-2", { minExperience: "0", maxExperience: "2" }],
        ["3-5", { minExperience: "3", maxExperience: "5" }],
        ["6-10", { minExperience: "6", maxExperience: "10" }],
    ])("maps experience range %s to min/max params", async (experience, expected) => {
        const { result } = renderHook(() => useMentorSearch());

        act(() => result.current.updateFilter("experience", experience));
        await act(async () => vi.advanceTimersByTime(DEBOUNCE_MS));

        const params = searchMentorsApi.mock.calls[0][0];
        expect(params.get("minExperience")).toBe(expected.minExperience);
        expect(params.get("maxExperience")).toBe(expected.maxExperience);
    });

    it("maps the open-ended '10+' experience range to minExperience only (no maxExperience param)", async () => {
        const { result } = renderHook(() => useMentorSearch());

        act(() => result.current.updateFilter("experience", "10+"));
        await act(async () => vi.advanceTimersByTime(DEBOUNCE_MS));

        const params = searchMentorsApi.mock.calls[0][0];
        expect(params.get("minExperience")).toBe("10");
        expect(params.has("maxExperience")).toBe(false);
    });

    it("ignores an unrecognized experience value (no min/max params set)", async () => {
        const { result } = renderHook(() => useMentorSearch());

        act(() => result.current.updateFilter("experience", "not-a-real-range"));
        await act(async () => vi.advanceTimersByTime(DEBOUNCE_MS));

        const params = searchMentorsApi.mock.calls[0][0];
        expect(params.has("minExperience")).toBe(false);
        expect(params.has("maxExperience")).toBe(false);
    });

    it("sends minPrice/maxPrice/minRating/industry only when non-empty", async () => {
        const { result } = renderHook(() => useMentorSearch());

        act(() => {
            result.current.updateFilter("minPrice", "100");
        });
        act(() => {
            result.current.updateFilter("maxPrice", "500");
        });
        act(() => {
            result.current.updateFilter("minRating", "4");
        });
        await act(async () => vi.advanceTimersByTime(DEBOUNCE_MS));

        const params = searchMentorsApi.mock.calls[0][0];
        expect(params.get("minPrice")).toBe("100");
        expect(params.get("maxPrice")).toBe("500");
        expect(params.get("minRating")).toBe("4");
        expect(params.has("industry")).toBe(false);
    });

    it("populates mentors/hasMore/totalCount/hasSearched on a successful fetch", async () => {
        searchMentorsApi.mockResolvedValueOnce(
            makePage({
                mentors: [{ id: "m1" }, { id: "m2" }],
                pagination: { hasMore: true, totalCount: 42 },
            }),
        );
        const { result } = renderHook(() => useMentorSearch());

        act(() => result.current.setSkill("React"));
        await act(async () => vi.advanceTimersByTime(DEBOUNCE_MS));

        expect(result.current.mentors).toEqual([{ id: "m1" }, { id: "m2" }]);
        expect(result.current.hasMore).toBe(true);
        expect(result.current.totalCount).toBe(42);
        expect(result.current.hasSearched).toBe(true);
        expect(result.current.loading).toBe(false);
    });

    it("surfaces err.response.data.message when present", async () => {
        searchMentorsApi.mockRejectedValueOnce({
            response: { data: { message: "Validation failed" } },
        });
        const { result } = renderHook(() => useMentorSearch());

        act(() => result.current.setSkill("x"));
        await act(async () => vi.advanceTimersByTime(DEBOUNCE_MS));

        expect(result.current.error).toBe("Validation failed");
    });

    it("falls back to err.message when there's no response body", async () => {
        searchMentorsApi.mockRejectedValueOnce(new Error("Network Error"));
        const { result } = renderHook(() => useMentorSearch());

        act(() => result.current.setSkill("x"));
        await act(async () => vi.advanceTimersByTime(DEBOUNCE_MS));

        expect(result.current.error).toBe("Network Error");
    });

    it("falls back to the generic 'Search failed.' message when the error has neither", async () => {
        searchMentorsApi.mockRejectedValueOnce({});
        const { result } = renderHook(() => useMentorSearch());

        act(() => result.current.setSkill("x"));
        await act(async () => vi.advanceTimersByTime(DEBOUNCE_MS));

        expect(result.current.error).toBe("Search failed.");
    });

    it("searchMentors() resets to page 1 and fetches immediately (no append)", async () => {
        const { result } = renderHook(() => useMentorSearch());

        act(() => result.current.setSkill("React"));
        await act(async () => vi.advanceTimersByTime(DEBOUNCE_MS));
        searchMentorsApi.mockClear();

        await act(async () => {
            result.current.searchMentors();
        });

        expect(searchMentorsApi).toHaveBeenCalledTimes(1);
        const params = searchMentorsApi.mock.calls[0][0];
        expect(params.get("page")).toBe("1");
    });

    it("loadMore() fetches the next page and appends to the existing mentor list", async () => {
        searchMentorsApi.mockResolvedValueOnce(
            makePage({ mentors: [{ id: "m1" }], pagination: { hasMore: true, totalCount: 2 } }),
        );
        const { result } = renderHook(() => useMentorSearch());

        act(() => result.current.setSkill("React"));
        await act(async () => vi.advanceTimersByTime(DEBOUNCE_MS));
        expect(result.current.mentors).toEqual([{ id: "m1" }]);

        searchMentorsApi.mockResolvedValueOnce(
            makePage({ mentors: [{ id: "m2" }], pagination: { hasMore: false, totalCount: 2 } }),
        );
        await act(async () => {
            result.current.loadMore();
        });

        expect(result.current.mentors).toEqual([{ id: "m1" }, { id: "m2" }]);
        expect(result.current.loadingMore).toBe(false);
        expect(result.current.hasMore).toBe(false);

        const secondCallParams = searchMentorsApi.mock.calls[1][0];
        expect(secondCallParams.get("page")).toBe("2");
    });

    it("resetFilters clears skill, filters, results, and pagination state", async () => {
        searchMentorsApi.mockResolvedValueOnce(
            makePage({ mentors: [{ id: "m1" }], pagination: { hasMore: true, totalCount: 10 } }),
        );
        const { result } = renderHook(() => useMentorSearch());

        act(() => result.current.setSkill("React"));
        act(() => result.current.updateFilter("industry", "Tech"));
        await act(async () => vi.advanceTimersByTime(DEBOUNCE_MS));

        expect(result.current.mentors).toHaveLength(1);

        act(() => {
            result.current.resetFilters();
        });

        expect(result.current.skill).toBe("");
        expect(result.current.filters).toEqual({
            industry: "",
            minPrice: "",
            maxPrice: "",
            minRating: "",
            experience: "",
        });
        expect(result.current.mentors).toEqual([]);
        expect(result.current.hasSearched).toBe(false);
        expect(result.current.hasMore).toBe(false);
        expect(result.current.totalCount).toBe(0);
    });

    it("cancels a pending debounced fetch on unmount", async () => {
        const { result, unmount } = renderHook(() => useMentorSearch());

        act(() => result.current.setSkill("React"));
        unmount();

        await act(async () => {
            vi.advanceTimersByTime(DEBOUNCE_MS);
        });

        expect(searchMentorsApi).not.toHaveBeenCalled();
    });

    it("re-fetches from page 1 when skill/filters change again after a prior search", async () => {
        const { result } = renderHook(() => useMentorSearch());

        act(() => result.current.setSkill("React"));
        await act(async () => vi.advanceTimersByTime(DEBOUNCE_MS));

        await act(async () => {
            result.current.loadMore();
        });

        searchMentorsApi.mockClear();
        act(() => result.current.setSkill("Node"));
        await act(async () => vi.advanceTimersByTime(DEBOUNCE_MS));

        const params = searchMentorsApi.mock.calls[0][0];
        expect(params.get("page")).toBe("1");
    });
});