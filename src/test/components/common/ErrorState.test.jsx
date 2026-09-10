import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import ErrorState from "../../../shared/components/ErrorState";

describe("ErrorState Component Suite", () => {
    it("should render the message with minimal required props", () => {
        render(<ErrorState message="Something went wrong" />);
        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("should not render subMessage, or action button, when they are omitted", () => {
        render(<ErrorState message="Error occurred" />);
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("should render subMessage when provided", () => {
        render(<ErrorState message="Error occurred" subMessage="Please try again later" />);
        expect(screen.getByText("Please try again later")).toBeInTheDocument();
    });

    it("should render the action button with default label and trigger onAction on click", () => {
        const mockAction = vi.fn();
        render(<ErrorState message="Error occurred" onAction={mockAction} />);

        const btn = screen.getByRole("button", { name: "Retry" });
        expect(btn).toBeInTheDocument();
        fireEvent.click(btn);
        expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it("should render the action button with a custom actionLabel", () => {
        const mockAction = vi.fn();
        render(<ErrorState message="Error occurred" onAction={mockAction} actionLabel="Try Again" />);
        expect(screen.getByRole("button", { name: "Try Again" })).toBeInTheDocument();
    });

    it("should apply fullWidth grid-span classes when fullWidth is true", () => {
        const { container } = render(<ErrorState message="Error occurred" fullWidth />);
        expect(container.firstChild.className).toMatch(/col-span-1/);
        expect(container.firstChild.className).toMatch(/md:col-span-2/);
        expect(container.firstChild.className).toMatch(/lg:col-span-3/);
    });

    it("should not apply fullWidth classes when fullWidth is false (default)", () => {
        const { container } = render(<ErrorState message="Error occurred" />);
        expect(container.firstChild.className).not.toMatch(/col-span-1/);
    });

    it("should apply compact padding classes when compact is true", () => {
        const { container } = render(<ErrorState message="Error occurred" compact />);
        expect(container.firstChild.className).toMatch(/py-8/);
        expect(container.firstChild.className).not.toMatch(/py-16/);
    });

    it("should apply default (non-compact) padding classes when compact is false", () => {
        const { container } = render(<ErrorState message="Error occurred" />);
        expect(container.firstChild.className).toMatch(/py-16/);
        expect(container.firstChild.className).not.toMatch(/py-8/);
    });

    it("should render both fullWidth and compact together", () => {
        const { container } = render(<ErrorState message="Error occurred" fullWidth compact />);
        expect(container.firstChild.className).toMatch(/col-span-1/);
        expect(container.firstChild.className).toMatch(/py-8/);
    });
});