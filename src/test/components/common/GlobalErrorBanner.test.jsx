import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import GlobalErrorBanner from "../../../shared/components/GlobalErrorBanner";
import { clearGlobalError } from "../../../app/store/slices/uiSlice";

// ── Mock Redux Bindings ──
vi.mock("react-redux", () => ({
    useSelector: vi.fn(),
    useDispatch: vi.fn(),
}));

vi.mock("../../../app/store/slices/uiSlice", () => ({
    clearGlobalError: vi.fn(() => ({ type: "ui/clearGlobalError-mock" })),
}));

describe("GlobalErrorBanner Component Suite", () => {
    const mockDispatch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        useDispatch.mockReturnValue(mockDispatch);
    });

    it("should return null and render nothing if globalError state is empty", () => {
        useSelector.mockReturnValue(null);
        const { container } = render(<GlobalErrorBanner />);
        expect(container.firstChild).toBeNull();
    });

    it("should display the active error message and dispatch clearGlobalError on dismiss button click", () => {
        const sampleError = { message: "Network connection refused by database ledger." };
        useSelector.mockReturnValue(sampleError);

        render(<GlobalErrorBanner />);

        // Assert error message presence
        expect(screen.getByText("Network connection refused by database ledger.")).toBeInTheDocument();

        // Click dismiss cross button
        const dismissBtn = screen.getByRole("button", { name: /Dismiss/i });
        fireEvent.click(dismissBtn);

        expect(mockDispatch).toHaveBeenCalledWith({ type: "ui/clearGlobalError-mock" });
    });
});