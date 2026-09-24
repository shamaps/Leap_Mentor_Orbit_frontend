import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import MentorCardSkeleton from "../../../shared/components/MentorCardSkeleton";

describe("MentorCardSkeleton Component", () => {
    it("should render the detailed variant layout by default", () => {
        const { container } = render(<MentorCardSkeleton />);

        // Target the outermost layout wrapper element to verify the animations are applied[cite: 9]
        const cardWrapper = container.firstChild;
        expect(cardWrapper).toHaveClass("animate-pulse", "p-5", "gap-4");

        // Verify the presence of specific sub-elements defined in the detailed skeleton layout tree[cite: 9]
        const largeAvatarSlot = container.querySelector(".w-14.h-14");
        expect(largeAvatarSlot).toBeInTheDocument();

        const titleSlot = container.querySelector(".h-4.w-32");
        expect(titleSlot).toBeInTheDocument();

        // Verify the layout parameters match five block structural rows[cite: 9]
        const fullWidthFooterButton = container.querySelector(".h-9.w-full");
        expect(fullWidthFooterButton).toBeInTheDocument();
    });

    it("should render the compact variant layout explicitly when declared", () => {
        const { container } = render(<MentorCardSkeleton variant="compact" />);

        // Target the outermost wrapper element for compact styling configurations[cite: 9]
        const cardWrapper = container.firstChild;
        expect(cardWrapper).toHaveClass("animate-pulse", "p-4", "gap-3");

        // Verify the presence of specific sub-elements defined in the compact layout configuration[cite: 9]
        const smallAvatarSlot = container.querySelector(".w-10.h-10");
        expect(smallAvatarSlot).toBeInTheDocument();

        // Securely query class attributes using clean substring selection loops rather than raw slashed chains
        const headerTextSlot = container.querySelector('[class*="w-3/4"]');
        expect(headerTextSlot).toBeInTheDocument();

        // Verify the shorter compact action button skeleton is present[cite: 9]
        const compactFooterButton = container.querySelector(".h-8.bg-slate-200");
        expect(compactFooterButton).toBeInTheDocument();
    });
});