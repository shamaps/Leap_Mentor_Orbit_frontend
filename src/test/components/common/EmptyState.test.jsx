import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import EmptyState from "../../../components/common/EmptyState";

describe("EmptyState Component Suite", () => {
    it("should render the message with minimal required props and the default icon", () => {
        const { container } = render(<EmptyState message="No items found" />);
        expect(screen.getByText("No items found")).toBeInTheDocument();
        expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("should render a custom icon when provided instead of the default svg", () => {
        const { container } = render(
            <EmptyState message="No items found" icon={<span data-testid="custom-icon">🎉</span>} />
        );
        expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
        // default svg path should not be present when a custom icon is passed
        expect(container.querySelector('path[d="M23 21v-2a4 4 0 0 0-3-3.87"]')).not.toBeInTheDocument();
    });

    it("should not render subMessage when omitted", () => {
        render(<EmptyState message="No items found" />);
        expect(screen.queryByText(/leading-relaxed/)).not.toBeInTheDocument();
    });

    it("should render subMessage when provided", () => {
        render(<EmptyState message="No items found" subMessage="Try adjusting your filters" />);
        expect(screen.getByText("Try adjusting your filters")).toBeInTheDocument();
    });

    it("should not render the action button when only actionLabel is provided without onAction", () => {
        render(<EmptyState message="No items found" actionLabel="Reset" />);
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should not render the action button when only onAction is provided without actionLabel", () => {
        const mockAction = vi.fn();
        render(<EmptyState message="No items found" onAction={mockAction} />);
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should render the action button and trigger onAction when both actionLabel and onAction are provided", () => {
        const mockAction = vi.fn();
        render(<EmptyState message="No items found" actionLabel="Reset Filters" onAction={mockAction} />);

        const btn = screen.getByRole("button", { name: "Reset Filters" });
        expect(btn).toBeInTheDocument();
        fireEvent.click(btn);
        expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it("should apply fullWidth grid-span classes when fullWidth is true", () => {
        const { container } = render(<EmptyState message="No items found" fullWidth />);
        expect(container.firstChild.className).toMatch(/col-span-1/);
        expect(container.firstChild.className).toMatch(/md:col-span-2/);
        expect(container.firstChild.className).toMatch(/lg:col-span-3/);
    });

    it("should not apply fullWidth classes when fullWidth is false (default)", () => {
        const { container } = render(<EmptyState message="No items found" />);
        expect(container.firstChild.className).not.toMatch(/col-span-1/);
    });

    it("should apply compact padding classes when compact is true", () => {
        const { container } = render(<EmptyState message="No items found" compact />);
        expect(container.firstChild.className).toMatch(/py-8/);
        expect(container.firstChild.className).not.toMatch(/py-20/);
    });

    it("should apply default (non-compact) padding classes when compact is false", () => {
        const { container } = render(<EmptyState message="No items found" />);
        expect(container.firstChild.className).toMatch(/py-20/);
        expect(container.firstChild.className).not.toMatch(/py-8/);
    });

    it("should render both fullWidth and compact together", () => {
        const { container } = render(<EmptyState message="No items found" fullWidth compact />);
        expect(container.firstChild.className).toMatch(/col-span-1/);
        expect(container.firstChild.className).toMatch(/py-8/);
    });
});