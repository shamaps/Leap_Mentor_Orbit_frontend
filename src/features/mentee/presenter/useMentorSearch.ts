// src/hooks/useMentorSearch.js
import { useState, useEffect, useCallback, useRef } from "react";
import { searchMentors as searchMentorsApi } from "@/features/mentee/model/mentorSearch.api";

const DEBOUNCE_MS = 300;
const LIMIT = 6;
const EXPERIENCE_RANGES = {
  "0-2": { min: "0", max: "2" },
  "3-5": { min: "3", max: "5" },
  "6-10": { min: "6", max: "10" },
  "10+": { min: "10", max: null },
};

export interface MentorSearchFilters {
  industry: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  experience: string;
}

// Response shape from the search API (the mapper types the raw payload
// loosely — mentors can be null entries — so we derive from it rather
// than re-declaring the shape here).
type MentorSearchResult = Awaited<ReturnType<typeof searchMentorsApi>>;
export type MentorSummary = MentorSearchResult["mentors"][number];

const applyExperienceRange = (params: URLSearchParams, experience: string) => {
  const range = EXPERIENCE_RANGES[experience as keyof typeof EXPERIENCE_RANGES];
  if (!range) return;
  params.set("minExperience", range.min);
  if (range.max !== null) params.set("maxExperience", range.max);
};

const buildSearchParams = (currentSkill: string, currentFilters: MentorSearchFilters, currentPage: number) => {
  const params = new URLSearchParams();

  if (currentSkill.trim()) {
    params.set("skill", currentSkill.trim());
    params.set("name", currentSkill.trim());
  }
  if (currentFilters.industry.trim()) params.set("industry", currentFilters.industry.trim());
  if (currentFilters.minPrice !== "") params.set("minPrice", currentFilters.minPrice);
  if (currentFilters.maxPrice !== "") params.set("maxPrice", currentFilters.maxPrice);
  if (currentFilters.minRating !== "") params.set("minRating", currentFilters.minRating);
  if (currentFilters.experience !== "") applyExperienceRange(params, currentFilters.experience);

  params.set("page", String(currentPage));
  params.set("limit", String(LIMIT));
  return params;
};
const useMentorSearch = () => {
  const [skill, setSkill] = useState("");
  const [filters, setFilters] = useState({
    industry: "",
    minPrice: "",
    maxPrice: "",
    minRating: "",
    experience: "",
  });
  const [mentors, setMentors] = useState<MentorSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchMentors = useCallback(
    async (currentSkill: string, currentFilters: MentorSearchFilters, currentPage: number, append = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }
        setError("");

        const params = buildSearchParams(currentSkill, currentFilters, currentPage);
        const data = await searchMentorsApi(params);

        const { mentors: newMentors, pagination } = data;
        setMentors(append ? (prev) => [...prev, ...newMentors] : newMentors);
        setHasMore(pagination.hasMore);
        setTotalCount(pagination.totalCount);
        setHasSearched(true);
      } catch (err) {
        setError(err?.response?.data?.message || err.message || "Search failed.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  // ── Single unified effect for both skill typing + filter changes ──
  // Fixes: experience/industry/etc filters not working because the old
  // separate filter effect didn't include `skill` in its deps, causing
  // fetchMentors to receive a stale empty skill value.
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setPage(1);
      fetchMentors(skill, filters, 1, false);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [skill, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wrapped setSkill — clears stale error on new search input
  const handleSetSkill = (value: string) => {
    setError("");
    setSkill(value);
  };

  // updateFilter — clears stale error on any filter change
  const updateFilter = (key: keyof MentorSearchFilters, value: string) => {
    setError("");
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setError("");
    setFilters({
      industry: "",
      minPrice: "",
      maxPrice: "",
      minRating: "",
      experience: "",
    });
    setSkill("");
    setMentors([]);
    setHasSearched(false);
    setPage(1);
    setHasMore(false);
    setTotalCount(0);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMentors(skill, filters, nextPage, true);
  };

  const searchMentors = () => {
    setPage(1);
    fetchMentors(skill, filters, 1, false);
  };

  return {
    skill,
    filters,
    mentors,
    loading,
    loadingMore,
    error,
    hasSearched,
    hasMore,
    totalCount,
    setSkill: handleSetSkill,
    updateFilter,
    resetFilters,
    loadMore,
    searchMentors,
  };
};

export default useMentorSearch;