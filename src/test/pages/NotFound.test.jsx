// src/test/pages/NotFound.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import NotFound from "../../shared/marketing/NotFound";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

describe("NotFound", () => {
    beforeEach(() => {
        mockNavigate.mockReset();
    });

    it("renders the 404 heading and message", () => {
        render(<NotFound />);
        expect(screen.getByText("404")).toBeInTheDocument();
        expect(
            screen.getByText("Oops! The page you’re looking for doesn’t exist."),
        ).toBeInTheDocument();
    });

    it("renders the Go Home and Go Back buttons", () => {
        render(<NotFound />);
        expect(screen.getByRole("button", { name: "Go Home" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Go Back" })).toBeInTheDocument();
    });

    it("navigates to / when Go Home is clicked", () => {
        render(<NotFound />);
        fireEvent.click(screen.getByRole("button", { name: "Go Home" }));
        expect(mockNavigate).toHaveBeenCalledWith("/");
    });

    it("navigates back (-1) when Go Back is clicked", () => {
        render(<NotFound />);
        fireEvent.click(screen.getByRole("button", { name: "Go Back" }));
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
});