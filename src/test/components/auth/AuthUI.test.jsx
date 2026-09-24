import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
    AuthMessageBanner,
    AuthDivider,
    AuthField,
    AuthBrand,
} from "../../../features/auth/view/components/AuthUI";

describe("AuthMessageBanner", () => {
    it("returns null when no text provided", () => {
        const { container } = render(<AuthMessageBanner type="error" text="" />);
        expect(container).toBeEmptyDOMElement();
    });

    it("renders success styling", () => {
        render(<AuthMessageBanner type="success" text="It worked" />);
        const el = screen.getByText("It worked");
        expect(el).toHaveClass("bg-green-50");
    });

    it("renders info styling", () => {
        render(<AuthMessageBanner type="info" text="FYI" />);
        const el = screen.getByText("FYI");
        expect(el).toHaveClass("bg-blue-50");
    });

    it("renders error styling", () => {
        render(<AuthMessageBanner type="error" text="Oops" />);
        const el = screen.getByText("Oops");
        expect(el).toHaveClass("bg-red-50");
    });

    it("falls back to error styling for unknown type", () => {
        render(<AuthMessageBanner type="unknown" text="Weird" />);
        const el = screen.getByText("Weird");
        expect(el).toHaveClass("bg-red-50");
    });
});

describe("AuthDivider", () => {
    it("renders default label", () => {
        render(<AuthDivider />);
        expect(screen.getByText("Or sign up with")).toBeInTheDocument();
    });

    it("renders custom label", () => {
        render(<AuthDivider label="Or sign in with" />);
        expect(screen.getByText("Or sign in with")).toBeInTheDocument();
    });
});

describe("AuthField", () => {
    it("renders label and input", () => {
        render(<AuthField label="Email" placeholder="you@x.com" />);
        expect(screen.getByText("Email")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("you@x.com")).toBeInTheDocument();
    });

    it("does not render hint when not provided", () => {
        const { container } = render(<AuthField label="Email" />);
        expect(container.querySelector(".text-slate-400")).not.toBeInTheDocument();
    });

    it("renders hint when provided", () => {
        render(<AuthField label="Email" hint="Use your work email" />);
        expect(screen.getByText("Use your work email")).toBeInTheDocument();
    });

    it("spreads extra input props onto input", () => {
        const { container } = render(<AuthField label="Email" type="email" name="email" />);
        const input = container.querySelector("input");
        expect(input).toHaveAttribute("type", "email");
        expect(input).toHaveAttribute("name", "email");
    });
});

describe("AuthBrand", () => {
    it("renders logo and brand name", () => {
        render(<AuthBrand logo={<span data-testid="logo">L</span>} />);
        expect(screen.getByTestId("logo")).toBeInTheDocument();
        expect(screen.getByText("LeapMentor")).toBeInTheDocument();
    });

    it("renders without logo", () => {
        render(<AuthBrand />);
        expect(screen.getByText("LeapMentor")).toBeInTheDocument();
    });
});