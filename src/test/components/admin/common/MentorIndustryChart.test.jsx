import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import MentorIndustryChart from "../../../../features/admin/view/charts/MentorIndustryChart";

// This injects the missing props into CustomTooltip, CustomXTick, and ColoredBar to hit 100% coverage
vi.mock("recharts", async () => {
    const original = await vi.importActual("recharts");
    const React = require("react");

    return {
        ...original,
        ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
        BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
        YAxis: () => <div data-testid="yaxis" />,
        CartesianGrid: () => <div data-testid="cartesian-grid" />,
        LabelList: () => <div data-testid="label-list" />,
        Rectangle: (props) => <div data-testid="rectangle" data-fill={props.fill} />,

        // Evaluate ColoredBar (Line 97)
        Bar: ({ shape, children }) => (
            <div data-testid="bar">
                {shape && React.cloneElement(shape, { index: 1, x: 0, y: 0, width: 10, height: 10 })}
                {children}
            </div>
        ),

        // Evaluate CustomXTick (Line 73)
        XAxis: ({ tick }) => (
            <div data-testid="xaxis">
                {tick && React.cloneElement(tick, { x: 0, y: 0, payload: { value: "Mocked Industry Tick" } })}
            </div>
        ),

        // Evaluate CustomTooltip active/inactive branches (Lines 40-42)
        Tooltip: ({ content }) => (
            <div data-testid="tooltip">
                {/* Branch: Active Tooltip with 1 mentor */}
                {content && React.cloneElement(content, {
                    active: true,
                    payload: [{ payload: { industry: "Tech Tooltip", count: 1, pct: "25.0" } }]
                })}
                {/* Branch: Active Tooltip with > 1 mentor (tests 's' pluralization) */}
                {content && React.cloneElement(content, {
                    active: true,
                    payload: [{ payload: { industry: "Design Tooltip", count: 5, pct: "75.0" } }]
                })}
                {/* Branch: Inactive/Empty Tooltip */}
                {content && React.cloneElement(content, { active: false, payload: [] })}
            </div>
        ),
    };
});

describe("MentorIndustryChart Component Suite", () => {
    const mockData = [
        { industry: "Engineering", count: 12 },
        { industry: "Product Management", count: 5 },
        { industry: "Design", count: 1 },
    ];

    it("should render an empty notice layout when data is an empty collection array", () => {
        render(<MentorIndustryChart data={[]} />);
        expect(screen.getByText("No industry data available yet.")).toBeInTheDocument();
    });

    it("should plot chart metric labels and legend markers accurately when valid data is parsed", () => {
        render(<MentorIndustryChart data={mockData} />);

        expect(screen.getByText(/18 mentors across 3 industries/i)).toBeInTheDocument();
        expect(screen.getByText("Engineering")).toBeInTheDocument();
        expect(screen.getByText("Product Management")).toBeInTheDocument();
        expect(screen.getByText("Design")).toBeInTheDocument();
    });

    it("should cover computed bar dynamic sizing limits safely across compact datasets", () => {
        // Test dataset with <= 3 entries for broad bar sizing rules
        const { rerender } = render(<MentorIndustryChart data={[{ industry: "Engineering", count: 1 }]} />);
        expect(screen.getByText(/1 mentor across 1 industry/i)).toBeInTheDocument();

        // Test dataset with 4-6 entries for intermediate bar sizing logic
        const mediumData = [
            { industry: "A", count: 1 },
            { industry: "B", count: 2 },
            { industry: "C", count: 3 },
            { industry: "D", count: 4 },
        ];
        rerender(<MentorIndustryChart data={mediumData} />);
        expect(screen.getByText(/10 mentors across 4 industries/i)).toBeInTheDocument();
    });

    it("should handle zero max count data safely and evaluate getYAxisTicks fallback condition", () => {
        // Tests: if (maxVal === 0) return [0]; inside getYAxisTicks
        const zeroData = [{ industry: "Unassigned", count: 0 }];
        render(<MentorIndustryChart data={zeroData} />);

        expect(screen.getByText(/0 mentors across 1 industry/i)).toBeInTheDocument();
    });

    it("should evaluate the custom tooltip, axis tick, and shape components via mocked render props", () => {
        render(<MentorIndustryChart data={mockData} />);

        // Assert CustomXTick mounted and rendered its injected payload value
        expect(screen.getByText("Mocked Industry Tick")).toBeInTheDocument();

        // Assert CustomTooltip mounted and handled grammar branching dynamically
        expect(screen.getByText("Tech Tooltip")).toBeInTheDocument();
        expect(screen.getByText("1 mentor · 25.0%")).toBeInTheDocument();
        expect(screen.getByText("5 mentors · 75.0%")).toBeInTheDocument();

        // Assert ColoredBar mounted and computed its PALETTE index
        expect(screen.getByTestId("rectangle")).toBeInTheDocument();
    });
});