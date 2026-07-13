import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AuthSSOButtons from "../../../components/auth/AuthSSOButtons";

describe("AuthSSOButtons", () => {
    it("renders Google and LinkedIn buttons", () => {
        const ref = { current: null };
        render(
            <AuthSSOButtons googleBtnRef={ref} loading={false} clerkLoaded onLinkedIn={() => { }} />,
        );
        expect(screen.getByText("Google")).toBeInTheDocument();
        expect(screen.getByText("LinkedIn")).toBeInTheDocument();
    });

    it("clicks the hidden google button's inner div when Google button clicked", () => {
        const innerClick = vi.fn();
        const ref = { current: null };

        render(
            <AuthSSOButtons googleBtnRef={ref} loading={false} clerkLoaded onLinkedIn={() => { }} />,
        );

        // Simulate Google's SDK having rendered its button markup inside the ref div
        const innerButtonDiv = document.createElement("div");
        innerButtonDiv.setAttribute("role", "button");
        innerButtonDiv.click = innerClick;
        ref.current.appendChild(innerButtonDiv);

        fireEvent.click(screen.getByText("Google"));
        expect(innerClick).toHaveBeenCalled();
    });

    it("does not throw when google button ref has no inner div", () => {
        const mockDiv = { querySelector: vi.fn(() => null) };
        const ref = { current: mockDiv };
        render(
            <AuthSSOButtons googleBtnRef={ref} loading={false} clerkLoaded onLinkedIn={() => { }} />,
        );
        expect(() => fireEvent.click(screen.getByText("Google"))).not.toThrow();
    });

    it("does not throw when googleBtnRef.current is null", () => {
        const ref = { current: null };
        render(
            <AuthSSOButtons googleBtnRef={ref} loading={false} clerkLoaded onLinkedIn={() => { }} />,
        );
        expect(() => fireEvent.click(screen.getByText("Google"))).not.toThrow();
    });

    it("calls onLinkedIn when LinkedIn button clicked", () => {
        const onLinkedIn = vi.fn();
        const ref = { current: null };
        render(
            <AuthSSOButtons googleBtnRef={ref} loading={false} clerkLoaded onLinkedIn={onLinkedIn} />,
        );
        fireEvent.click(screen.getByText("LinkedIn"));
        expect(onLinkedIn).toHaveBeenCalled();
    });

    it("disables LinkedIn button when loading is true", () => {
        const ref = { current: null };
        render(
            <AuthSSOButtons googleBtnRef={ref} loading={true} clerkLoaded onLinkedIn={() => { }} />,
        );
        expect(screen.getByText("LinkedIn").closest("button")).toBeDisabled();
    });

    it("disables LinkedIn button when clerkLoaded is false", () => {
        const ref = { current: null };
        render(
            <AuthSSOButtons googleBtnRef={ref} loading={false} clerkLoaded={false} onLinkedIn={() => { }} />,
        );
        expect(screen.getByText("LinkedIn").closest("button")).toBeDisabled();
    });

    it("applies opacity/pointer-events-none class to google wrapper when loading", () => {
        const ref = { current: null };
        const { container } = render(
            <AuthSSOButtons googleBtnRef={ref} loading={true} clerkLoaded onLinkedIn={() => { }} />,
        );
        expect(container.querySelector(".opacity-60")).toBeInTheDocument();
    });

    it("does not apply opacity class to google wrapper when not loading", () => {
        const ref = { current: null };
        const { container } = render(
            <AuthSSOButtons googleBtnRef={ref} loading={false} clerkLoaded onLinkedIn={() => { }} />,
        );
        expect(container.querySelector(".opacity-60")).not.toBeInTheDocument();
    });
});