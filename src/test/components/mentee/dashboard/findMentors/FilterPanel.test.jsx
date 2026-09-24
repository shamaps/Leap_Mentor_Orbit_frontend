// src/test/components/mentee/dashboard/findMentors/FilterPanel.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import FilterPanel from "../../../../../features/mentee/view/components/dashboard/findMentors/FilterPanel";

describe("FilterPanel Component Suite", () => {
    const mockUpdateFilter = vi.fn();
    const mockResetFilters = vi.fn();

    const emptyFilters = {
        industry: "",
        minPrice: "",
        maxPrice: "",
        minRating: "",
        experience: "",
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers({ shouldAdvanceTime: true });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const openPanel = () => {
        fireEvent.click(screen.getByRole("button", { name: /Filters/i }));
    };

    it("should stay collapsed by default with no active filter badge", () => {
        render(<FilterPanel filters={emptyFilters} updateFilter={mockUpdateFilter} resetFilters={mockResetFilters} />);
        expect(screen.queryByLabelText(/Minimum price per hour/i)).not.toBeInTheDocument();
    });

    it("should expand the panel and show all filter groups when toggled", () => {
        render(<FilterPanel filters={emptyFilters} updateFilter={mockUpdateFilter} resetFilters={mockResetFilters} />);
        openPanel();

        expect(screen.getByLabelText(/Minimum price per hour/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Maximum price per hour/i)).toBeInTheDocument();
        expect(screen.getByText("Industry")).toBeInTheDocument();
        expect(screen.getByText("Minimum Rating")).toBeInTheDocument();
        expect(screen.getByText("Experience")).toBeInTheDocument();
    });

    it("should call updateFilter immediately when industry select changes", () => {
        render(<FilterPanel filters={emptyFilters} updateFilter={mockUpdateFilter} resetFilters={mockResetFilters} />);
        openPanel();

        fireEvent.change(screen.getByLabelText(/Industry/i), { target: { value: "Design" } });
        expect(mockUpdateFilter).toHaveBeenCalledWith("industry", "Design");
    });

    it("should debounce minPrice/maxPrice updates rather than firing on every keystroke", () => {
        render(<FilterPanel filters={emptyFilters} updateFilter={mockUpdateFilter} resetFilters={mockResetFilters} />);
        openPanel();

        fireEvent.change(screen.getByLabelText(/Minimum price per hour/i), { target: { value: "10" } });
        expect(mockUpdateFilter).not.toHaveBeenCalledWith("minPrice", "10");

        vi.advanceTimersByTime(600);
        expect(mockUpdateFilter).toHaveBeenCalledWith("minPrice", "10");
    });

    it("should update minRating immediately on pill click", () => {
        render(<FilterPanel filters={emptyFilters} updateFilter={mockUpdateFilter} resetFilters={mockResetFilters} />);
        openPanel();

        fireEvent.click(screen.getByRole("button", { name: "4.5+" }));
        expect(mockUpdateFilter).toHaveBeenCalledWith("minRating", "4.5");
    });

    it("should update experience immediately on pill click", () => {
        render(<FilterPanel filters={emptyFilters} updateFilter={mockUpdateFilter} resetFilters={mockResetFilters} />);
        openPanel();

        fireEvent.click(screen.getByRole("button", { name: "3–5 yrs" }));
        expect(mockUpdateFilter).toHaveBeenCalledWith("experience", "3-5");
    });

    it("should show the active filter count badge and a reset link when filters are applied", () => {
        const activeFilters = { ...emptyFilters, industry: "Design", minRating: "4.0" };
        render(<FilterPanel filters={activeFilters} updateFilter={mockUpdateFilter} resetFilters={mockResetFilters} />);

        expect(screen.getByText("2")).toBeInTheDocument();

        openPanel();
        fireEvent.click(screen.getByRole("button", { name: /Clear all filters/i }));
        expect(mockResetFilters).toHaveBeenCalledTimes(1);
    });

    it("should sync local price inputs when filters are reset externally", async () => {
        const { rerender } = render(
            <FilterPanel filters={{ ...emptyFilters, minPrice: "50" }} updateFilter={mockUpdateFilter} resetFilters={mockResetFilters} />
        );
        openPanel();
        expect(screen.getByLabelText(/Minimum price per hour/i)).toHaveValue(50);

        rerender(<FilterPanel filters={emptyFilters} updateFilter={mockUpdateFilter} resetFilters={mockResetFilters} />);
        await waitFor(() => {
            expect(screen.getByLabelText(/Minimum price per hour/i)).toHaveValue(null);
        });
    });
});