import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import StatCard from "../../../components/common/StatCard";

describe("StatCard Component Suite", () => {
    const mockIcon = <span data-testid="mock-icon">📊</span>;

    // ── 1. SIMPLE VARIANT TESTS ─────────────────────────────────
    describe("Variant: simple", () => {
        it("should render default non-accented layout parameters correctly", () => {
            render(<StatCard label="Notifications" value={15} icon={mockIcon} variant="simple" />);

            expect(screen.getByText("15")).toBeInTheDocument();
            expect(screen.getByText("Notifications")).toBeInTheDocument();
            expect(screen.getByTestId("mock-icon")).toBeInTheDocument();

            // Check default non-accented text color classes
            expect(screen.getByText("Notifications")).toHaveClass("text-slate-500");
        });

        it("should apply customized background and text colors when accent is active", () => {
            render(<StatCard label="Alerts" value={5} icon={mockIcon} variant="simple" accent={true} />);

            expect(screen.getByText("Alerts")).toHaveClass("text-blue-600");
            const wrapper = screen.getByText("5").closest(".flex");
            expect(wrapper).toHaveClass("border-blue-200", "bg-blue-50/40");
        });
    });

    // ── 2. HOME VARIANT TESTS ───────────────────────────────────
    describe("Variant: home", () => {
        it("should render correctly with secondary description sub-text values", () => {
            render(
                <StatCard label="Active Mentees" value="24" sub="3 new this week" icon={mockIcon} variant="home" />
            );

            expect(screen.getByText("24")).toBeInTheDocument();
            expect(screen.getByText("Active Mentees")).toBeInTheDocument();
            expect(screen.getByText("3 new this week")).toBeInTheDocument();
        });
    });

    // ── 3. EARNINGS VARIANT TESTS ───────────────────────────────
    describe("Variant: earnings", () => {
        it("should map customized color properties on status text correctly", () => {
            render(
                <StatCard
                    label="Total Revenue"
                    value="$1,200"
                    sub="+12% growth"
                    subColor="text-teal-500"
                    icon={mockIcon}
                    variant="earnings"
                />
            );

            expect(screen.getByText("Total Revenue")).toBeInTheDocument();
            expect(screen.getByText("$1,200")).toBeInTheDocument();

            const subText = screen.getByText("+12% growth");
            expect(subText).toBeInTheDocument();
            expect(subText).toHaveClass("text-teal-500");
        });
    });

    // ── 4. ADMIN VARIANT TESTS (DEFAULT) ────────────────────────
    describe("Variant: admin (default)", () => {
        it("should safely evaluate local fallback string formatting if values are undefined", () => {
            render(<StatCard label="Admin Metric" variant="admin" />);

            expect(screen.getByText("—")).toBeInTheDocument();
            expect(screen.getByText("Admin Metric")).toBeInTheDocument();
        });

        it("should apply radial and icon background string computations when a custom hex accent is supplied", () => {
            const { container } = render(
                <StatCard label="Total Users" value={50000} icon={mockIcon} accent="#ff0000" />
            );
            expect(screen.getByText("50,000")).toBeInTheDocument();

            const radialOverlay = container.querySelector(".absolute");
            expect(radialOverlay.style.background).toContain("rgba(255, 0, 0, 0.07)");

            const iconContainer = screen.getByTestId("mock-icon").parentElement;
            expect(iconContainer).toHaveStyle({ color: "#ff0000" });
        });

        it("should compute and inject an upward green trend vector badge if values are positive", () => {
            render(<StatCard label="Conversion" value={100} trend={15} sub="Target hit" />);

            const trendText = screen.getByText("15%");
            expect(trendText).toBeInTheDocument();
            expect(trendText.style.color).toBe("rgb(22, 163, 74)"); 


            const line = trendText.previousElementSibling.querySelector("line");
            expect(line).toBeInTheDocument();
        });

        it("should compute and inject a downward red trend vector badge if values are negative", () => {
            render(<StatCard label="Bounce Rate" value={4} trend={-8} />);

            const trendText = screen.getByText("8%"); // Evaluates absolute value
            expect(trendText).toBeInTheDocument();
            expect(trendText.style.color).toBe("rgb(220, 38, 38)"); // Matches #dc2626 crimson red
        });
    });
});