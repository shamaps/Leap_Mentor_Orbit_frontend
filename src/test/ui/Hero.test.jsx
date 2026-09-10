// src/test/ui/Hero.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import Hero from "../../shared/marketing/Hero";

describe("Hero", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it("renders the heading, copy, and all three slide images", () => {
        render(<Hero />);
        expect(screen.getByText(/Expert Mentorship/)).toBeInTheDocument();
        expect(screen.getAllByRole("img")).toHaveLength(3);
        expect(screen.getByText("98%")).toBeInTheDocument();
    });

    it("fades the current slide out at 3000ms and advances to the next slide 400ms later", () => {
        render(<Hero />);
        const images = screen.getAllByRole("img");
        expect(images[0]).toHaveStyle({ opacity: 1 });
        expect(images[1]).toHaveStyle({ opacity: 0 });

        act(() => {
            vi.advanceTimersByTime(3000);
        });
        // fade=false immediately after the 3s tick — every slide's opacity
        // condition (current === i && fade) is now false for all i
        expect(images[0]).toHaveStyle({ opacity: 0 });

        act(() => {
            vi.advanceTimersByTime(400);
        });
        // current has advanced to 1, fade is back to true
        expect(images[1]).toHaveStyle({ opacity: 1 });
        expect(images[0]).toHaveStyle({ opacity: 0 });
    });

    it("wraps back around to the first slide after cycling through all three", () => {
        render(<Hero />);
        act(() => {
            vi.advanceTimersByTime(3400); // -> slide 1
        });
        act(() => {
            vi.advanceTimersByTime(3400); // -> slide 2
        });
        act(() => {
            vi.advanceTimersByTime(3400); // -> slide 0 (wraps)
        });

        const images = screen.getAllByRole("img");
        expect(images[0]).toHaveStyle({ opacity: 1 });
    });

    it("clears the interval on unmount without throwing", () => {
        const { unmount } = render(<Hero />);
        expect(() => {
            unmount();
            act(() => {
                vi.advanceTimersByTime(10000);
            });
        }).not.toThrow();
    });
});