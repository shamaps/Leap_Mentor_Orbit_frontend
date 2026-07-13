// src/test/ui/Navbar.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Navbar from "../../ui/Navbar";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

describe("Navbar", () => {
    let scrollToSpy;

    beforeEach(() => {
        mockNavigate.mockReset();
        scrollToSpy = vi.fn();
        globalThis.scrollTo = scrollToSpy;
        window.history.pushState({}, "", "/");
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("renders the logo and desktop Register/Login buttons", () => {
        render(<Navbar />);
        expect(screen.getByAltText("LeapMentor logo")).toBeInTheDocument();
        expect(screen.getByText("LeapMentor")).toBeInTheDocument();
        expect(screen.getByText("Register")).toBeInTheDocument();
        expect(screen.getByText("Login")).toBeInTheDocument();
    });

    it("smooth-scrolls to top when the logo is clicked while already on \"/\"", () => {
        window.history.pushState({}, "", "/");
        render(<Navbar />);
        fireEvent.click(screen.getByAltText("LeapMentor logo").closest("button"));

        expect(scrollToSpy).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("navigates to \"/\" when the logo is clicked from a different route", () => {
        window.history.pushState({}, "", "/dashboard");
        render(<Navbar />);
        fireEvent.click(screen.getByAltText("LeapMentor logo").closest("button"));

        expect(mockNavigate).toHaveBeenCalledWith("/");
        expect(scrollToSpy).not.toHaveBeenCalled();
    });

    it("navigates to /login when the Login button is clicked", () => {
        render(<Navbar />);
        fireEvent.click(screen.getByText("Login"));
        expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    it("toggles the register dropdown open and closed on repeated clicks", () => {
        render(<Navbar />);
        expect(screen.queryByText("Become a Mentor")).not.toBeInTheDocument();

        fireEvent.click(screen.getByText("Register"));
        expect(screen.getByText("Become a Mentor")).toBeInTheDocument();
        expect(screen.getByText("Find a Mentor")).toBeInTheDocument();

        fireEvent.click(screen.getByText("Register"));
        expect(screen.queryByText("Become a Mentor")).not.toBeInTheDocument();
    });

    it("navigates to /register/mentor and closes the dropdown when 'Become a Mentor' is clicked", () => {
        render(<Navbar />);
        fireEvent.click(screen.getByText("Register"));
        fireEvent.click(screen.getByText("Become a Mentor"));

        expect(mockNavigate).toHaveBeenCalledWith("/register/mentor");
        expect(screen.queryByText("Become a Mentor")).not.toBeInTheDocument();
    });

    it("navigates to /register/mentee and closes the dropdown when 'Find a Mentor' is clicked", () => {
        render(<Navbar />);
        fireEvent.click(screen.getByText("Register"));
        fireEvent.click(screen.getByText("Find a Mentor"));

        expect(mockNavigate).toHaveBeenCalledWith("/register/mentee");
        expect(screen.queryByText("Find a Mentor")).not.toBeInTheDocument();
    });

    it("closes the register dropdown when clicking outside of it", () => {
        render(
            <div>
                <div data-testid="outside">outside area</div>
                <Navbar />
            </div>,
        );
        fireEvent.click(screen.getByText("Register"));
        expect(screen.getByText("Become a Mentor")).toBeInTheDocument();

        fireEvent.mouseDown(screen.getByTestId("outside"));
        expect(screen.queryByText("Become a Mentor")).not.toBeInTheDocument();
    });

    it("does not close the dropdown when clicking inside it", () => {
        render(<Navbar />);
        fireEvent.click(screen.getByText("Register"));
        fireEvent.mouseDown(screen.getByText("Become a Mentor"));
        expect(screen.getByText("Become a Mentor")).toBeInTheDocument();
    });

    it("removes the outside-click listener on unmount", () => {
        const removeSpy = vi.spyOn(document, "removeEventListener");
        const { unmount } = render(<Navbar />);
        unmount();
        expect(removeSpy).toHaveBeenCalledWith("mousedown", expect.any(Function));
    });

    it("toggles the mobile hamburger menu open and closed", () => {
        render(<Navbar />);
        expect(screen.queryByText("🚀 Become a Mentor")).not.toBeInTheDocument();

        // The hamburger is the only button with an svg and no visible text.
        const hamburger = screen.getAllByRole("button").find(
            (b) => b.querySelector("svg") && !b.textContent.trim(),
        );
        fireEvent.click(hamburger);
        expect(screen.getByText("🚀 Become a Mentor")).toBeInTheDocument();

        fireEvent.click(hamburger);
        expect(screen.queryByText("🚀 Become a Mentor")).not.toBeInTheDocument();
    });

    it("mobile menu: 'Become a Mentor' navigates and closes the menu", () => {
        render(<Navbar />);
        const hamburger = screen.getAllByRole("button").find(
            (b) => b.querySelector("svg") && !b.textContent.trim(),
        );
        fireEvent.click(hamburger);
        fireEvent.click(screen.getByText("🚀 Become a Mentor"));

        expect(mockNavigate).toHaveBeenCalledWith("/register/mentor");
        expect(screen.queryByText("🚀 Become a Mentor")).not.toBeInTheDocument();
    });

    it("mobile menu: 'Find a Mentor' navigates and closes the menu", () => {
        render(<Navbar />);
        const hamburger = screen.getAllByRole("button").find(
            (b) => b.querySelector("svg") && !b.textContent.trim(),
        );
        fireEvent.click(hamburger);
        fireEvent.click(screen.getByText("🎓 Find a Mentor"));

        expect(mockNavigate).toHaveBeenCalledWith("/register/mentee");
    });

    it("mobile menu: 'Login' navigates and closes the menu", () => {
        render(<Navbar />);
        const hamburger = screen.getAllByRole("button").find(
            (b) => b.querySelector("svg") && !b.textContent.trim(),
        );
        fireEvent.click(hamburger);
        fireEvent.click(screen.getAllByText("Login")[1]);

        expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
});