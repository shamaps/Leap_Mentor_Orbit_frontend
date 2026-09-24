// src/components/mentee/dashboard/findMentors/FilterPanel.jsx
import { useState, useEffect, useRef } from "react";
import type { MentorSearchFilters } from "@/features/mentee/presenter/useMentorSearch";
const INDUSTRIES = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Marketing",
  "Design",
  "Engineering",
  "Sales",
  "Legal",
  "Consulting",
  "Other",
];

const RATINGS = [
  { label: "4.5+", value: "4.5" },
  { label: "4.0+", value: "4.0" },
  { label: "3.5+", value: "3.5" },
  { label: "Any", value: "" },
];

// Experience range options
const EXPERIENCE_RANGES = [
  { label: "Any", value: "" },
  { label: "0–2 yrs", value: "0-2" },
  { label: "3–5 yrs", value: "3-5" },
  { label: "6–10 yrs", value: "6-10" },
  { label: "10+ yrs", value: "10+" },
];

const PRICE_DEBOUNCE_MS = 600;

interface FilterPanelProps {
  filters: MentorSearchFilters;
  updateFilter: (key: keyof MentorSearchFilters, value: string) => void;
  resetFilters: () => void;
}

const FilterPanel = ({ filters, updateFilter, resetFilters }: FilterPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Local price state — so typing doesn't fire updateFilter on every keystroke
  const [localMin, setLocalMin] = useState(filters.minPrice);
  const [localMax, setLocalMax] = useState(filters.maxPrice);

  const minTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state if filters are reset externally (e.g. "Clear all filters")
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentionally syncing local state from an external source (prop/URL), not derivable from render inputs alone
    setLocalMin(filters.minPrice);
  }, [filters.minPrice]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentionally syncing local state from an external source (prop/URL), not derivable from render inputs alone
    setLocalMax(filters.maxPrice);
  }, [filters.maxPrice]);

  const handleMinPrice = (value: string) => {
    setLocalMin(value);
    if (minTimer.current) clearTimeout(minTimer.current);
    minTimer.current = setTimeout(() => {
      updateFilter("minPrice", value);
    }, PRICE_DEBOUNCE_MS);
  };

  const handleMaxPrice = (value: string) => {
    setLocalMax(value);
    if (maxTimer.current) clearTimeout(maxTimer.current);
    maxTimer.current = setTimeout(() => {
      updateFilter("maxPrice", value);
    }, PRICE_DEBOUNCE_MS);
  };

  const activeFilterCount = [
    filters.industry,
    filters.minPrice,
    filters.maxPrice,
    filters.minRating,
    filters.experience, // included in badge count
  ].filter(Boolean).length;

  return (
    <div>
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-xs font-semibold transition-all duration-150 ${activeFilterCount > 0
          ? "border-blue-400 bg-blue-50 text-blue-900"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
          } shadow-sm`}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="11" y1="18" x2="13" y2="18" />
        </svg>
        Filters
        {activeFilterCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-blue-900 text-white text-[10px] font-bold flex items-center justify-center">
            {activeFilterCount}
          </span>
        )}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Filter panel — collapsible */}
      {isOpen && (
        <div className="mt-3 bg-white border border-slate-100 rounded-2xl shadow-sm p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Industry */}
          <div>
            <label htmlFor="filter-industry" className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Industry
            </label>
            <select
              id="filter-industry"
              value={filters.industry}
              onChange={(e) => updateFilter("industry", e.target.value)}
              className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-150"
            >
              <option value="">All Industries</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          {/* Price range */}
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Price Range ($/hr)
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                placeholder="Min"
                aria-label="Minimum price per hour"
                value={localMin}
                onChange={(e) => handleMinPrice(e.target.value)}
                className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-150"
              />
              <span className="text-slate-300 font-bold shrink-0">—</span>
              <input
                type="number"
                min="0"
                placeholder="Max"
                aria-label="Maximum price per hour"
                value={localMax}
                onChange={(e) => handleMaxPrice(e.target.value)}
                className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-150"
              />
            </div>
          </div>

          {/* Rating */}
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Minimum Rating
            </span>
            <div className="flex gap-2 flex-wrap" role="group" aria-label="Minimum rating">
              {RATINGS.map((r) => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => updateFilter("minRating", r.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${filters.minRating === r.value
                    ? "bg-blue-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Experience — new filter, full width on its own row */}
          <fieldset className="md:col-span-3 border-0 p-0 m-0">
            <legend className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Experience
            </legend>
            <div className="flex gap-2 flex-wrap">
              {EXPERIENCE_RANGES.map((r) => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => updateFilter("experience", r.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${filters.experience === r.value
                    ? "bg-blue-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Reset */}
          {activeFilterCount > 0 && (
            <div className="md:col-span-3 flex justify-end">
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors duration-150"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterPanel;