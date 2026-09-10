import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import ReportSuccessModal from "../../../../features/shared-dashboard/view/components/tabs/ReportSuccessModal";

describe("ReportSuccessModal Component", () => {
    it("should render structural contents and header status correctly", () => {
        const mockOnBack = vi.fn();
        render(<ReportSuccessModal onBack={mockOnBack} />);

        // Check main layout header texts
        expect(screen.getByText("Report Submitted")).toBeInTheDocument();

        // Check main description copy
        expect(
            screen.getByText(/Our team will review your report and take appropriate action/i)
        ).toBeInTheDocument();

        // Check confidentiality policy legal text
        expect(
            screen.getByText(/All reports are confidential. You will not be notified/i)
        ).toBeInTheDocument();
    });

    it("should trigger onBack callback function execution when action button is clicked", async () => {
        const mockOnBack = vi.fn();
        const user = userEvent.setup();

        render(<ReportSuccessModal onBack={mockOnBack} />);

        // Locate action navigation redirect trigger button
        const backBtn = screen.getByRole("button", { name: /Back to Session/i });
        expect(backBtn).toBeInTheDocument();

        // Trigger user click simulation
        await user.click(backBtn);

        // Validate behavior expectation callback execution
        expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
});