import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import TabLoader from "../../../shared/components/TabLoader";

describe("TabLoader Component", () => {
    it("should render the component layout with the default loading message", () => {
        const { container } = render(<TabLoader />);

        // Verify fallback placeholder string text renders inside the DOM tree[cite: 10]
        expect(screen.getByText("Loading...")).toBeInTheDocument();

        // Target the spinning circle by its specific animation class[cite: 10]
        const spinnerCircle = container.querySelector(".animate-spin");
        expect(spinnerCircle).toBeInTheDocument();
        expect(spinnerCircle).toHaveClass("w-8", "h-8", "rounded-full", "border-4");
    });

    it("should render custom message overrides explicitly when provided as a prop", () => {
        render(<TabLoader message="Fetching dashboard insights..." />);

        // Verify the custom text message renders properly instead of the fallback[cite: 10]
        expect(screen.getByText("Fetching dashboard insights...")).toBeInTheDocument();
        expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
});