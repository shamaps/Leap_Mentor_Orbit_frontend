// src/test/pages/LoginMentee.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LoginMentee from "../../pages/LoginMentee";

vi.mock("../../components/auth/LoginLeftPanel", () => ({
    default: (props) => <div data-testid="login-left-panel" data-role={props.role} />,
}));

vi.mock("../../components/auth/LoginForm", () => ({
    default: (props) => (
        <div
            data-testid="login-form"
            data-role={props.role}
            data-placeholder={props.placeholder}
            data-register-path={props.registerPath}
        />
    ),
}));

describe("LoginMentee", () => {
    it("renders LoginLeftPanel with role='mentee'", () => {
        render(<LoginMentee />);
        const panel = screen.getByTestId("login-left-panel");
        expect(panel.getAttribute("data-role")).toBe("mentee");
    });

    it("renders LoginForm with mentee-specific props (no explicit role prop)", () => {
        render(<LoginMentee />);
        const form = screen.getByTestId("login-form");
        // LoginMentee does not pass a `role` prop to LoginForm.
        expect(form.getAttribute("data-role")).toBeNull();
        expect(form.getAttribute("data-placeholder")).toBe("you@example.com");
        expect(form.getAttribute("data-register-path")).toBe("/register/mentee");
    });
});