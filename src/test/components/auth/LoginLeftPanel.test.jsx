import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LoginLeftPanel from "../../../components/auth/LoginLeftPanel";

describe("LoginLeftPanel", () => {
    it("renders mentor copy when role is mentor", () => {
        render(<LoginLeftPanel role="mentor" />);
        expect(screen.getByText(/Empower the next/)).toBeInTheDocument();
        expect(
            screen.getByText(/Share your expertise and help aspiring professionals/),
        ).toBeInTheDocument();
    });

    it("renders mentee copy when role is mentee", () => {
        render(<LoginLeftPanel role="mentee" />);
        expect(screen.getByText(/Find the mentor who/)).toBeInTheDocument();
        expect(
            screen.getByText(/Connect with experienced mentors/),
        ).toBeInTheDocument();
    });

    it("renders mentee copy when role is undefined", () => {
        render(<LoginLeftPanel />);
        expect(screen.getByText(/Find the mentor who/)).toBeInTheDocument();
    });

    it("renders the login hero image", () => {
        render(<LoginLeftPanel role="mentor" />);
        const img = screen.getByAltText("Login visual");
        expect(img).toHaveAttribute("src", "/images/login.webp");
    });
});