import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import PrefsCardHeader from "../../../shared/components/PrefsCardHeader";

describe("PrefsCardHeader Component Suite", () => {
    it("should mount and resolve default textual entries within card variant style classes cleanly", () => {
        const { container } = render(<PrefsCardHeader />);

        // Assert standard initial parameters[cite: 14]
        expect(screen.getByRole("heading", { name: "Mentorship Preferences" })).toBeInTheDocument();

        const wrapperDiv = container.firstChild;
        expect(wrapperDiv).toHaveClass("flex", "items-center", "gap-2", "mb-4");
        expect(wrapperDiv).not.toHaveClass("bg-blue-50");
    });

    it("should apply distinctive section styling layout configurations when variant parameter changes", () => {
        const { container } = render(
            <PrefsCardHeader title="System Preferences" variant="section" />
        );

        expect(screen.getByRole("heading", { name: "System Preferences" })).toBeInTheDocument();

        // Verify conditional true branch tracking matrix[cite: 14]
        const wrapperDiv = container.firstChild;
        expect(wrapperDiv).toHaveClass("flex", "items-center", "gap-3", "px-6", "py-4", "border-b", "border-blue-50", "bg-blue-50");
        expect(wrapperDiv).not.toHaveClass("mb-4");
    });
});