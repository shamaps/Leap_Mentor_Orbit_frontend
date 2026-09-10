import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import Spinner from "../../../shared/components/Spinner";

describe("Spinner Component Suite", () => {
    it("should render with default props (sm size, dark border, no label)", () => {
        const { container } = render(<Spinner />);
        const spinEl = container.querySelector(".animate-spin");
        expect(spinEl.className).toMatch(/w-4 h-4 border-2/);
        expect(spinEl.className).toMatch(/border-blue-600/);
        expect(spinEl.className).not.toMatch(/border-white/);
    });

    it("should render each size variant correctly", () => {
        const sizes = {
            xs: "w-3 h-3 border-2",
            sm: "w-4 h-4 border-2",
            md: "w-6 h-6 border-\\[3px\\]",
            lg: "w-9 h-9 border-4",
        };
        Object.entries(sizes).forEach(([size, expectedClass]) => {
            const { container, unmount } = render(<Spinner size={size} />);
            const spinEl = container.querySelector(".animate-spin");
            expect(spinEl.className).toMatch(new RegExp(expectedClass));
            unmount();
        });
    });

    it("should apply light border styling when light is true", () => {
        const { container } = render(<Spinner light />);
        const spinEl = container.querySelector(".animate-spin");
        expect(spinEl.className).toMatch(/border-white/);
        expect(spinEl.className).not.toMatch(/border-blue-600/);
    });

    it("should apply dark border styling when light is false", () => {
        const { container } = render(<Spinner light={false} />);
        const spinEl = container.querySelector(".animate-spin");
        expect(spinEl.className).toMatch(/border-blue-600/);
    });

    it("should render a label when provided", () => {
        render(<Spinner label="Loading..." />);
        expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("should not render a label span when label is omitted", () => {
        const { container } = render(<Spinner />);
        expect(container.querySelector("span.text-xs.text-slate-500")).not.toBeInTheDocument();
    });
});