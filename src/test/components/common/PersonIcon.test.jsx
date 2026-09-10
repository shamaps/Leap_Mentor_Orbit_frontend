import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import React from "react";
import PersonIcon from "../../../shared/components/PersonIcon";

describe("PersonIcon Component Suite", () => {
    it("should mount smoothly and fallback safely onto standard default props attributes", () => {
        const { container } = render(<PersonIcon />);
        const svgElement = container.querySelector("svg");

        expect(svgElement).toBeInTheDocument();
        // Fallbacks verification matrices[cite: 13]
        expect(svgElement).toHaveAttribute("width", "13");
        expect(svgElement).toHaveAttribute("height", "13");
        expect(svgElement).toHaveAttribute("stroke", "white");
        expect(svgElement).toHaveAttribute("stroke-width", "2");
    });

    it("should map customized rendering parameters into graphic layouts correctly when supplied", () => {
        const { container } = render(
            <PersonIcon size={24} stroke="#ef4444" strokeWidth="1.5" />
        );
        const svgElement = container.querySelector("svg");

        expect(svgElement).toHaveAttribute("width", "24");
        expect(svgElement).toHaveAttribute("height", "24");
        expect(svgElement).toHaveAttribute("stroke", "#ef4444");
        expect(svgElement).toHaveAttribute("stroke-width", "1.5");
    });
});