// src/test/pages/RegisterMentor.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import RegisterMentor from "../../pages/RegisterMentor";

vi.mock("../../components/auth/AuthLeftPanel", () => ({
    default: (props) => (
        <div data-testid="auth-left-panel" data-props={JSON.stringify({
            imageSrc: props.imageSrc,
            imageAlt: props.imageAlt,
            badge: props.badge,
            stats: props.stats,
        })}
        >
            {props.heading}
            {props.subtext}
        </div>
    ),
}));

vi.mock("../../components/auth/RegisterForm", () => ({
    default: (props) => <div data-testid="register-form" data-role={props.role} />,
}));

describe("RegisterMentor", () => {
    it("renders AuthLeftPanel with mentor-specific props", () => {
        render(<RegisterMentor />);
        const panel = screen.getByTestId("auth-left-panel");
        const props = JSON.parse(panel.getAttribute("data-props"));
        expect(props.imageSrc).toBe("/images/mentor-bg.jpg");
        expect(props.imageAlt).toBe("Mentors collaborating");
        expect(props.badge).toBe("🌍 Trusted by 10,000+ mentors globally");
        expect(props.stats).toEqual([
            { num: "10K+", label: "Mentors" },
            { num: "50K+", label: "Sessions" },
            { num: "98%", label: "Satisfaction" },
        ]);
    });

    it("renders the heading and subtext content inside AuthLeftPanel", () => {
        render(<RegisterMentor />);
        expect(screen.getByText(/Empowering the next/)).toBeInTheDocument();
        expect(screen.getByText(/generation of leaders\./)).toBeInTheDocument();
        expect(screen.getByText(/Join over 10,000\+ mentors globally/)).toBeInTheDocument();
    });

    it("renders RegisterForm with role='mentor'", () => {
        render(<RegisterMentor />);
        const form = screen.getByTestId("register-form");
        expect(form).toBeInTheDocument();
        expect(form.getAttribute("data-role")).toBe("mentor");
    });
});