import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AuthLeftPanel from "../../../components/auth/AuthLeftPanel";

describe("AuthLeftPanel", () => {
    it("renders image with src and alt", () => {
        render(<AuthLeftPanel imageSrc="/img.jpg" imageAlt="alt text" />);
        const img = screen.getByAltText("alt text");
        expect(img).toHaveAttribute("src", "/img.jpg");
    });

    it("hides image on error", () => {
        render(<AuthLeftPanel imageSrc="/img.jpg" imageAlt="alt text" />);
        const img = screen.getByAltText("alt text");
        fireEvent.error(img);
        expect(img.style.display).toBe("none");
    });

    it("does not render badge when not provided", () => {
        const { container } = render(<AuthLeftPanel imageSrc="/img.jpg" />);
        expect(container.querySelector(".inline-block")).not.toBeInTheDocument();
    });

    it("renders badge when provided", () => {
        render(<AuthLeftPanel imageSrc="/img.jpg" badge="Trusted badge" />);
        expect(screen.getByText("Trusted badge")).toBeInTheDocument();
    });

    it("renders heading and subtext", () => {
        render(
            <AuthLeftPanel
                imageSrc="/img.jpg"
                heading="My Heading"
                subtext="My subtext"
            />,
        );
        expect(screen.getByText("My Heading")).toBeInTheDocument();
        expect(screen.getByText("My subtext")).toBeInTheDocument();
    });

    it("does not render stat pills when stats is empty", () => {
        const { container } = render(<AuthLeftPanel imageSrc="/img.jpg" />);
        expect(container.querySelector(".flex.gap-3")).not.toBeInTheDocument();
    });

    it("renders stat pills when stats provided", () => {
        render(
            <AuthLeftPanel
                imageSrc="/img.jpg"
                stats={[
                    { num: "10k", label: "Mentors" },
                    { num: "5k", label: "Mentees" },
                ]}
            />,
        );
        expect(screen.getByText("10k")).toBeInTheDocument();
        expect(screen.getByText("Mentors")).toBeInTheDocument();
        expect(screen.getByText("5k")).toBeInTheDocument();
        expect(screen.getByText("Mentees")).toBeInTheDocument();
    });
});