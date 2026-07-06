// src/hooks/useMentorSearch.js
import { useState, useEffect, useCallback, useRef } from "react";
import { searchMentors as searchMentorsApi } from "../api/mentorSearch.api";
const DEBOUNCE_MS = 300;
const LIMIT = 6;

const useMentorSearch = () => {
  const [skill, setSkill] = useState("");
  const [filters, setFilters] = useState({
    industry: "",
    minPrice: "",
    maxPrice: "",
    minRating: "",
    experience: "",
  });
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const debounceTimer = useRef(null);

  const fetchMentors = useCallback(
    async (currentSkill, currentFilters, currentPage, append = false) => {
      try {
        append ? setLoadingMore(true) : setLoading(true);
        setError("");

        const params = new URLSearchParams();

        if (currentSkill.trim()) {
          params.set("skill", currentSkill.trim());
          params.set("name", currentSkill.trim());
        }

        if (currentFilters.industry.trim())
          params.set("industry", currentFilters.industry.trim());
        if (currentFilters.minPrice !== "")
          params.set("minPrice", currentFilters.minPrice);
        if (currentFilters.maxPrice !== "")
          params.set("maxPrice", currentFilters.maxPrice);
        if (currentFilters.minRating !== "")
          params.set("minRating", currentFilters.minRating);

        // Parse experience range string → minExperience / maxExperience
        if (currentFilters.experience !== "") {
          const exp = currentFilters.experience;
          if (exp === "0-2") {
            params.set("minExperience", "0");
            params.set("maxExperience", "2");
          }
          if (exp === "3-5") {
            params.set("minExperience", "3");
            params.set("maxExperience", "5");
          }
          if (exp === "6-10") {
            params.set("minExperience", "6");
            params.set("maxExperience", "10");
          }
          if (exp === "10+") {
            params.set("minExperience", "10");
          }
        }

        params.set("page", currentPage);
        params.set("limit", LIMIT);

        const data = await searchMentorsApi(params);

        const newMentors = data.mentors;
        const pagination = data.pagination;

        setMentors(append ? (prev) => [...prev, ...newMentors] : newMentors);
        setHasMore(pagination.hasMore);
        setTotalCount(pagination.totalCount);
        setHasSearched(true);
      } catch (err) {
        setError(
          err?.response?.data?.message || err.message || "Search failed.",
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  ); // eslint-disable-line react-hooks/exhaustive-deps

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
    return () => clearTimeout(debounceTimer.current);
  }, [skill, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wrapped setSkill — clears stale error on new search input
  const handleSetSkill = (value) => {
    setError("");
    setSkill(value);
  };

  // updateFilter — clears stale error on any filter change
  const updateFilter = (key, value) => {
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
