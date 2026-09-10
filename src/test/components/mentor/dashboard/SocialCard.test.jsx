import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import SocialCard from "../../../../features/mentor/view/components/dashboard/SocialCard";

describe("SocialCard", () => {
    it("renders the card heading", () => {
        render(<SocialCard profile={{}} />);
        expect(screen.getByText("Social & Web")).toBeInTheDocument();
    });

    it("renders portfolio and LinkedIn labels", () => {
        render(<SocialCard profile={{}} />);

        expect(screen.getByText("Portfolio")).toBeInTheDocument();
        expect(screen.getByText("LinkedIn Profile")).toBeInTheDocument();
    });

    it("shows em dash placeholders when no urls are present", () => {
        render(<SocialCard profile={{}} />);

        const dashes = screen.getAllByText("—");
        expect(dashes.length).toBe(2);
    });

    it("renders a clickable portfolio link with protocol stripped from display text", () => {
        render(
            <SocialCard profile={{ portfolioUrl: "https://myportfolio.dev" }} />
        );

        const link = screen.getByText("myportfolio.dev");
        expect(link).toBeInTheDocument();
        expect(link.closest("a")).toHaveAttribute(
            "href",
            "https://myportfolio.dev"
        );
        expect(link.closest("a")).toHaveAttribute("target", "_blank");
        expect(link.closest("a")).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("renders a clickable LinkedIn link with protocol stripped from display text", () => {
        render(
            <SocialCard
                profile={{ linkedInUrl: "https://linkedin.com/in/janedoe" }}
            />
        );

        const link = screen.getByText("linkedin.com/in/janedoe");
        expect(link).toBeInTheDocument();
        expect(link.closest("a")).toHaveAttribute(
            "href",
            "https://linkedin.com/in/janedoe"
        );
    });

    it("handles a missing profile prop without crashing", () => {
        render(<SocialCard />);

        expect(screen.getByText("Social & Web")).toBeInTheDocument();
        expect(screen.getAllByText("—").length).toBe(2);
    });

    it("renders both links when both urls are present", () => {
        render(
            <SocialCard
                profile={{
                    portfolioUrl: "https://myportfolio.dev",
                    linkedInUrl: "https://linkedin.com/in/janedoe",
                }}
            />
        );

        expect(screen.getByText("myportfolio.dev")).toBeInTheDocument();
        expect(screen.getByText("linkedin.com/in/janedoe")).toBeInTheDocument();
        expect(screen.queryByText("—")).not.toBeInTheDocument();
    });
});