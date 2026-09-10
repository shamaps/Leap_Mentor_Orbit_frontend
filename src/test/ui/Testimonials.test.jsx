// src/test/ui/Testimonials.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import Testimonials from "../../shared/marketing/Testimonials";

describe("Testimonials", () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    const getDots = (container) => {
        // The indicator-dot row is the only element carrying "mt-10" here.
        const dotsContainer = container.querySelector(".mt-10");
        return dotsContainer.querySelectorAll("button");
    };

    const getRightArrow = () =>
        screen
            .getAllByRole("button")
            .find((b) => b.querySelector('polyline[points="9 18 15 12 9 6"]'));

    const getLeftArrow = () =>
        screen
            .getAllByRole("button")
            .find((b) => b.querySelector('polyline[points="15 18 9 12 15 6"]'));

    it("renders the heading, stats, and the initial trio of testimonials (prev/active/next)", () => {
        render(<Testimonials />);

        expect(screen.getByText("What Our Community Says")).toBeInTheDocument();
        expect(screen.getByText("Real stories, real growth")).toBeInTheDocument();

        expect(screen.getByText("5,000+")).toBeInTheDocument();
        expect(screen.getByText("Mentees Helped")).toBeInTheDocument();
        expect(screen.getByText("98%")).toBeInTheDocument();
        expect(screen.getByText("Satisfaction Rate")).toBeInTheDocument();
        expect(screen.getByText("4.9★")).toBeInTheDocument();
        expect(screen.getByText("Average Rating")).toBeInTheDocument();

        // active=0 → prev=index5 (Rohit Joshi), curr=index0 (Priya Sharma), next=index1 (Arjun Mehta)
        expect(screen.getByText("Rohit Joshi")).toBeInTheDocument();
        expect(screen.getByText("Priya Sharma")).toBeInTheDocument();
        expect(screen.getByText("Arjun Mehta")).toBeInTheDocument();
        expect(screen.queryByText("Sneha Reddy")).not.toBeInTheDocument();
    });

    it("renders 5 stars and full details on the active testimonial card", () => {
        const { container } = render(<Testimonials />);
        const activeCard = container.querySelector(".border-violet-100");

        expect(activeCard).not.toBeNull();
        expect(activeCard.querySelectorAll("svg").length).toBeGreaterThanOrEqual(5);
        expect(
            screen.getByText(/LeapMentor completely transformed my career/),
        ).toBeInTheDocument();
        expect(screen.getByText(/Software Engineer/)).toBeInTheDocument();
    });

    it("advances to the next testimonial when the right arrow is clicked", () => {
        render(<Testimonials />);
        fireEvent.click(getRightArrow());

        act(() => {
            vi.advanceTimersByTime(300);
        });

        // curr should now be index1: prev=0 (Priya), curr=1 (Arjun), next=2 (Sneha)
        expect(screen.getByText("Priya Sharma")).toBeInTheDocument();
        expect(screen.getByText("Arjun Mehta")).toBeInTheDocument();
        expect(screen.getByText("Sneha Reddy")).toBeInTheDocument();
        expect(screen.queryByText("Rohit Joshi")).not.toBeInTheDocument();
    });

    it("ignores a second arrow click while a shift animation is already in-flight", () => {
        render(<Testimonials />);
        const rightArrow = getRightArrow();

        fireEvent.click(rightArrow);
        fireEvent.click(rightArrow); // no-op: guarded by `if (animating) return;`

        act(() => {
            vi.advanceTimersByTime(300);
        });

        // Only a single step should have occurred: index 0 -> 1 (not -> 2).
        // Note "Sneha Reddy" (index 2) is visible either way, since it's the
        // "next" dimmed card once curr=1 — so it can't distinguish 1 vs 2
        // shifts. "Priya Sharma" (index 0, still visible as "prev" after one
        // shift but gone after two) and "Karan Patel" (index 3, only visible
        // after two shifts) are the decisive signals.
        expect(screen.getByText("Priya Sharma")).toBeInTheDocument();
        expect(screen.getByText("Arjun Mehta")).toBeInTheDocument();
        expect(screen.queryByText("Karan Patel")).not.toBeInTheDocument();
    });

    it("goes to the previous (wrapping) testimonial when the left arrow is clicked", () => {
        render(<Testimonials />);
        fireEvent.click(getLeftArrow());

        act(() => {
            vi.advanceTimersByTime(300);
        });

        // active wraps from 0 to 5: prev=4 (Divya Nair), curr=5 (Rohit Joshi), next=0 (Priya Sharma)
        expect(screen.getByText("Divya Nair")).toBeInTheDocument();
        expect(screen.getByText("Rohit Joshi")).toBeInTheDocument();
        expect(screen.getByText("Priya Sharma")).toBeInTheDocument();
        expect(screen.queryByText("Arjun Mehta")).not.toBeInTheDocument();
    });

    it("advances when the dimmed 'next' side card itself is clicked", () => {
        render(<Testimonials />);
        fireEvent.click(screen.getByText("Arjun Mehta")); // dimmed next-card (index 1)

        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(screen.getByText("Sneha Reddy")).toBeInTheDocument();
        expect(screen.queryByText("Rohit Joshi")).not.toBeInTheDocument();
    });

    it("advances (backwards) when the dimmed 'prev' side card itself is clicked", () => {
        render(<Testimonials />);
        fireEvent.click(screen.getByText("Rohit Joshi")); // dimmed prev-card (index 5)

        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(screen.getByText("Divya Nair")).toBeInTheDocument();
        expect(screen.queryByText("Arjun Mehta")).not.toBeInTheDocument();
    });

    it("jumps directly to a testimonial when its indicator dot is clicked", () => {
        const { container } = render(<Testimonials />);
        const dots = getDots(container);

        fireEvent.click(dots[3]); // Karan Patel

        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(screen.getByText("Karan Patel")).toBeInTheDocument();
    });

    it("does nothing when the currently-active dot is clicked", () => {
        const { container } = render(<Testimonials />);
        const dots = getDots(container);

        fireEvent.click(dots[0]); // already active

        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(screen.getByText("Priya Sharma")).toBeInTheDocument();
    });

    it("ignores dot clicks while a shift animation is already in-flight", () => {
        const { container } = render(<Testimonials />);
        const dots = getDots(container);

        fireEvent.click(dots[2]); // starts animating -> index 2
        fireEvent.click(dots[4]); // ignored: guarded by `!animating`

        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(screen.getByText("Sneha Reddy")).toBeInTheDocument(); // index 2
        expect(screen.queryByText("Divya Nair")).not.toBeInTheDocument(); // index 4
    });

    it("auto-advances to the next testimonial after the 4s interval elapses", () => {
        render(<Testimonials />);

        act(() => {
            vi.advanceTimersByTime(4000);
        });
        act(() => {
            vi.advanceTimersByTime(300);
        });

        expect(screen.getByText("Arjun Mehta")).toBeInTheDocument();
        expect(screen.queryByText("Rohit Joshi")).not.toBeInTheDocument();
    });

    it("clears the interval on unmount without throwing", () => {
        const { unmount } = render(<Testimonials />);
        expect(() => {
            unmount();
            act(() => {
                vi.advanceTimersByTime(10000);
            });
        }).not.toThrow();
    });
});