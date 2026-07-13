// src/test/pages/RegisterMentee.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import RegisterMentee from "../../pages/RegisterMentee";

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

describe("RegisterMentee", () => {
    it("renders AuthLeftPanel with mentee-specific props", () => {
        render(<RegisterMentee />);
        const panel = screen.getByTestId("auth-left-panel");
        const props = JSON.parse(panel.getAttribute("data-props"));
        expect(props.imageSrc).toBe("/images/mentee-bg.jpg");
        expect(props.imageAlt).toBe("Mentees learning");
        expect(props.badge).toBe("🚀 Start your growth journey today");
        expect(props.stats).toEqual([
            { num: "50K+", label: "Mentees" },
            { num: "200+", label: "Skills" },
            { num: "4.9★", label: "Rating" },
        ]);
    });

    it("renders the heading and subtext content inside AuthLeftPanel", () => {
        render(<RegisterMentee />);
        expect(screen.getByText(/Find the mentor who/)).toBeInTheDocument();
        expect(screen.getByText(/unlocks your potential\./)).toBeInTheDocument();
        expect(screen.getByText(/Connect with world-class mentors/)).toBeInTheDocument();
    });

    it("renders RegisterForm with role='mentee'", () => {
        render(<RegisterMentee />);
        const form = screen.getByTestId("register-form");
        expect(form).toBeInTheDocument();
        expect(form.getAttribute("data-role")).toBe("mentee");
    });
});