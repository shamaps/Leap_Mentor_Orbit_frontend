import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import UserGrowthChart from "../../../../features/admin/view/charts/UserGrowthChart";

describe("UserGrowthChart Component Suite", () => {
    const generateMockGrowthData = (count) => {
        return Array.from({ length: count }, (_, i) => ({
            label: `Day ${i + 1}`,
            count: Math.floor(Math.random() * 50) + 5,
        }));
    };

    it("should output the blank fallback layout context if growth data array is empty", () => {
        render(<UserGrowthChart data={[]} />);
        expect(screen.getByText("No growth data yet.")).toBeInTheDocument();
    });

    it("should render user growth tracking path labels and tabs efficiently", () => {
        const data30Days = generateMockGrowthData(45);
        render(<UserGrowthChart data={data30Days} />);

        expect(screen.getByText("User Growth")).toBeInTheDocument();
        expect(screen.getByText("New registrations over time")).toBeInTheDocument();

        // Verify filter range options render onto the screen selection bar
        expect(screen.getByRole("button", { name: "7D" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "30D" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "90D" })).toBeInTheDocument();
    });

    it("should slice and adapt data bounds dynamically when click updates toggle RANGES buttons", () => {
        const largeDataSet = generateMockGrowthData(100);
        render(<UserGrowthChart data={largeDataSet} />);

        const button7D = screen.getByRole("button", { name: "7D" });
        const button90D = screen.getByRole("button", { name: "90D" });

        // Switch range filtering views to verify state changes execute
        fireEvent.click(button7D);
        expect(button7D).toHaveStyle({ color: "#1e40af" }); // checking active styling colors

        fireEvent.click(button90D);
        expect(button90D).toHaveStyle({ color: "#1e40af" });
    });

    it("should execute interaction updates when mouse pointers hover onto SVG interactive nodes", () => {
        const smallDataSet = generateMockGrowthData(10);
        render(<UserGrowthChart data={smallDataSet} />);

        // Capture transparent target mapping rectangles
        const targetHitboxes = document.querySelectorAll("rect[fill='transparent']");
        expect(targetHitboxes.length).toBeGreaterThan(0);

        // Simulate mouse entering individual tracking point nodes
        fireEvent.mouseEnter(targetHitboxes[0]);

        // Tooltip popup context parameters should become visible inside the live SVG document
        expect(screen.getByText(/users/i)).toBeInTheDocument();

        // Simulate mouse tracking exiting chart workspace structures
        const chartSvgNode = document.querySelector("svg");
        fireEvent.mouseLeave(chartSvgNode);
        expect(screen.queryByText(/users/i)).not.toBeInTheDocument();
    });

    it("should safely evaluate line drawing path loops when all incoming count indices map to 0", () => {
        const flatZeroData = [
            { label: "Day 1", count: 0 },
            { label: "Day 2", count: 0 },
        ];
        render(<UserGrowthChart data={flatZeroData} />);

        // Max ceiling scale fallback should compute to 10
        expect(screen.getByText("10")).toBeInTheDocument();
    });
});