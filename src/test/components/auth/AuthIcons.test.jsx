import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
    LinkedInIcon,
    AppleIcon,
    GoogleIcon,
    LeapMentorLogo,
} from "../../../features/auth/view/components/AuthIcons";

describe("AuthIcons", () => {
    it("renders LinkedInIcon svg", () => {
        const { container } = render(<LinkedInIcon />);
        expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("renders AppleIcon svg", () => {
        const { container } = render(<AppleIcon />);
        expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("renders GoogleIcon svg with multiple paths", () => {
        const { container } = render(<GoogleIcon />);
        expect(container.querySelector("svg")).toBeInTheDocument();
        expect(container.querySelectorAll("path").length).toBe(4);
    });

    it("renders LeapMentorLogo image with correct src and alt", () => {
        const { getByAltText } = render(<LeapMentorLogo />);
        const img = getByAltText("LeapMentor logo");
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute("src", "/images/logo.webp");
    });
});