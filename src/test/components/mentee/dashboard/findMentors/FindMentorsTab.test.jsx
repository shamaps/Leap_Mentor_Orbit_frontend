// src/test/components/mentee/dashboard/findMentors/FindMentorsTab.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import React from "react";
import FindMentorsTab from "../../../../../components/mentee/dashboard/findMentors/FindMentorsTab";
import useMentorSearch from "../../../../../hooks/useMentorSearch";
import { getPlatformCommissionRate } from "../../../../../api/escrow.api";

vi.mock("../../../../../hooks/useMentorSearch", () => ({
    default: vi.fn(),
}));

vi.mock("../../../../../api/escrow.api", () => ({
    getPlatformCommissionRate: vi.fn(),
}));

vi.mock("../../../../../components/mentee/dashboard/findMentors/SearchBar", () => ({
    default: ({ skill, setSkill }) => (
        <input data-testid="mock-search-bar" value={skill} onChange={(e) => setSkill(e.target.value)} />
    ),
}));

vi.mock("../../../../../components/mentee/dashboard/findMentors/FilterPanel", () => ({
    default: ({ updateFilter }) => (
        <button data-testid="mock-filter-panel" onClick={() => updateFilter("industry", "Design")}>
            Filter
        </button>
    ),
}));

vi.mock("../../../../../components/mentee/dashboard/findMentors/MentorGrid", () => ({
    default: ({ mentors, onViewProfile }) => (
        <div data-testid="mock-mentor-grid">
            {mentors.map((m) => (
                <button key={m.id} onClick={() => onViewProfile(m)}>
                    {m.name}
                </button>
            ))}
        </div>
    ),
}));

vi.mock("../../../../../components/mentee/dashboard/findMentors/MentorProfileModal", () => ({
    default: ({ mentor, onClose }) => (
        <div data-testid="mock-mentor-profile-modal">
            <span>{mentor.name}</span>
            <button onClick={onClose}>Close</button>
        </div>
    ),
}));

vi.mock("../../../../../components/common/ErrorState", () => ({
    default: ({ message }) => <div data-testid="mock-error-state">{message}</div>,
}));

describe("FindMentorsTab Component Suite", () => {
    const baseSearchState = {
        skill: "",
        filters: {},
        mentors: [{ id: "m1", name: "Alice" }],
        loading: false,
        loadingMore: false,
        error: null,
        hasSearched: true,
        hasMore: false,
        totalCount: 1,
        setSkill: vi.fn(),
        updateFilter: vi.fn(),
        resetFilters: vi.fn(),
        loadMore: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        useMentorSearch.mockReturnValue(baseSearchState);
    });

    it("should show a skeleton placeholder for the commission rate while fee is loading", () => {
        getPlatformCommissionRate.mockReturnValue(new Promise(() => { })); // never resolves
        const { container } = render(<FindMentorsTab />);
        expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    });

    it("should display the fetched commission rate once loaded", async () => {
        getPlatformCommissionRate.mockResolvedValueOnce({ commissionRate: 15 });
        render(<FindMentorsTab />);

        await waitFor(() => {
            expect(screen.getByText("15")).toBeInTheDocument();
        });
        expect(screen.getByText("%")).toBeInTheDocument();
    });

    it("should render nothing for the fee value if the fetch fails", async () => {
        getPlatformCommissionRate.mockRejectedValueOnce(new Error("network error"));
        render(<FindMentorsTab />);

        await waitFor(() => {
            expect(screen.queryByText("%")).not.toBeInTheDocument();
        });
    });

    it("should render the mentor grid with mentors returned from the hook", async () => {
        getPlatformCommissionRate.mockResolvedValueOnce({ commissionRate: 10 });
        render(<FindMentorsTab />);
        expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    it("should show ErrorState when the search hook reports an error", async () => {
        getPlatformCommissionRate.mockResolvedValueOnce({ commissionRate: 10 });
        useMentorSearch.mockReturnValue({ ...baseSearchState, error: "Search failed" });
        render(<FindMentorsTab />);
        expect(screen.getByTestId("mock-error-state")).toHaveTextContent("Search failed");
    });

    it("should open the profile modal when a mentor card triggers onViewProfile", async () => {
        getPlatformCommissionRate.mockResolvedValueOnce({ commissionRate: 10 });
        render(<FindMentorsTab />);

        fireEvent.click(screen.getByText("Alice"));
        expect(screen.getByTestId("mock-mentor-profile-modal")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Close" }));
        expect(screen.queryByTestId("mock-mentor-profile-modal")).not.toBeInTheDocument();
    });

    it("should wire SearchBar's setSkill and FilterPanel's updateFilter through to the hook", async () => {
        getPlatformCommissionRate.mockResolvedValueOnce({ commissionRate: 10 });
        render(<FindMentorsTab />);

        fireEvent.change(screen.getByTestId("mock-search-bar"), { target: { value: "React" } });
        expect(baseSearchState.setSkill).toHaveBeenCalledWith("React");

        fireEvent.click(screen.getByTestId("mock-filter-panel"));
        expect(baseSearchState.updateFilter).toHaveBeenCalledWith("industry", "Design");
    });
});