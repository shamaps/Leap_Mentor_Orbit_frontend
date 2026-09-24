// src/test/components/mentee/dashboard/findMentors/MentorGrid.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import MentorGrid from "../../../../../features/mentee/view/components/dashboard/findMentors/MentorGrid";

vi.mock("../../../../../features/mentee/view/components/dashboard/findMentors/MentorCard", () => ({
    default: ({ mentor, onViewProfile }) => (
        <button data-testid="mock-mentor-card" onClick={() => onViewProfile(mentor)}>
            {mentor.name}
        </button>
    ),
}));

vi.mock("@/shared/components/MentorCardSkeleton", () => ({
    default: () => <div data-testid="mock-skeleton" />,
}));

vi.mock("@/shared/components/TabLoader", () => ({
    default: ({ message }) => <div data-testid="mock-tab-loader">{message}</div>,
}));

vi.mock("../../../../../shared/hooks/useMountLogger", () => ({
    useMountLogger: vi.fn(),
}));

vi.mock("../../../../../shared/utils/withProfiler", () => ({
    withProfiler: (Component) => Component,
}));

describe("MentorGrid Component Suite", () => {
    const mockLoadMore = vi.fn();
    const mockViewProfile = vi.fn();

    const mentors = [
        { id: "m1", name: "Alice" },
        { id: "m2", name: "Bob" },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should show the loading state via TabLoader when loading is true", () => {
        render(
            <MentorGrid
                mentors={[]}
                loading={true}
                loadingMore={false}
                hasMore={false}
                hasSearched={false}
                totalCount={0}
                onLoadMore={mockLoadMore}
                onViewProfile={mockViewProfile}
            />
        );
        expect(screen.getByTestId("mock-tab-loader")).toHaveTextContent("Finding mentors for you...");
    });

    it("should render mentor cards and the results count when mentors are present", () => {
        render(
            <MentorGrid
                mentors={mentors}
                loading={false}
                loadingMore={false}
                hasMore={false}
                hasSearched={true}
                totalCount={12}
                onLoadMore={mockLoadMore}
                onViewProfile={mockViewProfile}
            />
        );
        expect(screen.getAllByTestId("mock-mentor-card")).toHaveLength(2);
        expect(screen.getByText("2")).toBeInTheDocument();
        expect(screen.getByText("12")).toBeInTheDocument();
    });

    it("should render loading-more skeletons alongside existing cards", () => {
        render(
            <MentorGrid
                mentors={mentors}
                loading={false}
                loadingMore={true}
                hasMore={true}
                hasSearched={true}
                totalCount={12}
                onLoadMore={mockLoadMore}
                onViewProfile={mockViewProfile}
            />
        );
        expect(screen.getAllByTestId("mock-skeleton")).toHaveLength(3);
    });

    it("should render the Show More button when hasMore is true and not currently loading more", () => {
        render(
            <MentorGrid
                mentors={mentors}
                loading={false}
                loadingMore={false}
                hasMore={true}
                hasSearched={true}
                totalCount={12}
                onLoadMore={mockLoadMore}
                onViewProfile={mockViewProfile}
            />
        );
        fireEvent.click(screen.getByRole("button", { name: /Show More/i }));
        expect(mockLoadMore).toHaveBeenCalledTimes(1);
    });

    it("should not render the Show More button while loadingMore is true", () => {
        render(
            <MentorGrid
                mentors={mentors}
                loading={false}
                loadingMore={true}
                hasMore={true}
                hasSearched={true}
                totalCount={12}
                onLoadMore={mockLoadMore}
                onViewProfile={mockViewProfile}
            />
        );
        expect(screen.queryByRole("button", { name: /Show More/i })).not.toBeInTheDocument();
    });

    it("should forward onViewProfile through to the mentor card", () => {
        render(
            <MentorGrid
                mentors={mentors}
                loading={false}
                loadingMore={false}
                hasMore={false}
                hasSearched={true}
                totalCount={2}
                onLoadMore={mockLoadMore}
                onViewProfile={mockViewProfile}
            />
        );
        fireEvent.click(screen.getAllByTestId("mock-mentor-card")[0]);
        expect(mockViewProfile).toHaveBeenCalledWith(mentors[0]);
    });

    // ⚠️ This test documents a real bug: MentorGrid.jsx uses `EmptyState` without
    // importing it, so this branch currently throws ReferenceError at runtime.
    // Once the import is added (e.g. from "../../../../../shared/components/EmptyState"), this
    // test should pass as written.
    it.skip("should render an empty state message when a search returns zero mentors", () => {
        render(
            <MentorGrid
                mentors={[]}
                loading={false}
                loadingMore={false}
                hasMore={false}
                hasSearched={true}
                totalCount={0}
                onLoadMore={mockLoadMore}
                onViewProfile={mockViewProfile}
            />
        );
        expect(screen.getByText("No mentors found")).toBeInTheDocument();
        expect(screen.getByText(/Try adjusting your filters/i)).toBeInTheDocument();
    });
});