import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import FilterTabs from "../../../shared/components/FilterTabs";

describe("FilterTabs Component", () => {
    const options = ["all", "active", "completed"];

    it("should render all options with correct structural styles for default properties", () => {
        const mockOnChange = vi.fn();
        render(<FilterTabs options={options} active="active" onChange={mockOnChange} />);

        options.forEach((opt) => {
            const button = screen.getByRole("button", { name: new RegExp(opt, "i") });
            expect(button).toBeInTheDocument();

            // Verify active vs inactive color matching defaults
            if (opt === "active") {
                expect(button.style.background).toBe("rgb(37, 99, 235)"); // #2563eb fallback matching text
            } else {
                expect(button.style.background).toBe("rgb(255, 255, 255)"); // #fff fallback
            }
        });
    });

    it("should accept custom activeColor styling updates override parameters", () => {
        const mockOnChange = vi.fn();
        render(<FilterTabs options={options} active="all" onChange={mockOnChange} activeColor="#ff0000" />);

        const activeButton = screen.getByRole("button", { name: /all/i });
        expect(activeButton.style.background).toBe("rgb(255, 0, 0)"); // #ff0000 custom override
    });

    it("should invoke the onChange callback parameter when an alternative option is clicked", async () => {
        const mockOnChange = vi.fn();
        const user = userEvent.setup();
        render(<FilterTabs options={options} active="all" onChange={mockOnChange} />);

        const nextButton = screen.getByRole("button", { name: /completed/i });
        await user.click(nextButton);

        expect(mockOnChange).toHaveBeenCalledTimes(1);
        expect(mockOnChange).toHaveBeenCalledWith("completed");
    });
});