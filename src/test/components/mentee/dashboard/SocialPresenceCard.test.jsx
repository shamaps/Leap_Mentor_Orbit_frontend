// components/mentee/dashboard/__tests__/SocialPresenceCard.test.jsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SocialPresenceCard from "../../../../features/mentee/view/components/dashboard/SocialPresenceCard";

describe("SocialPresenceCard", () => {
    it("renders em-dash placeholders and no external links when profile is undefined", () => {
        render(<SocialPresenceCard />);

        const dashes = screen.getAllByText("—");
        expect(dashes).toHaveLength(2);
        expect(screen.queryAllByRole("link")).toHaveLength(0);
    });

    it("renders em-dash placeholders when linkedInUrl and portfolioUrl are absent", () => {
        render(<SocialPresenceCard profile={{}} />);

        expect(screen.getAllByText("—")).toHaveLength(2);
    });

    it("renders the LinkedIn handle stripped of the base URL, and an external link", () => {
        const profile = {
            linkedInUrl: "https://www.linkedin.com/in/shama-kausar",
        };
        render(<SocialPresenceCard profile={profile} />);

        expect(screen.getByText("shama-kausar")).toBeInTheDocument();
        const links = screen.getAllByRole("link");
        expect(links).toHaveLength(2); // handle link + external icon link
        for (const link of links) {
            expect(link).toHaveAttribute("href", profile.linkedInUrl);
        }
        // Portfolio still shows fallback
        expect(screen.getByText("—")).toBeInTheDocument();
    });

    it("renders the portfolio URL stripped of the protocol, and an external link", () => {
        const profile = { portfolioUrl: "https://shama.dev" };
        render(<SocialPresenceCard profile={profile} />);

        expect(screen.getByText("shama.dev")).toBeInTheDocument();
        const links = screen.getAllByRole("link");
        expect(links).toHaveLength(2);
        for (const link of links) {
            expect(link).toHaveAttribute("href", profile.portfolioUrl);
        }
        expect(screen.getByText("—")).toBeInTheDocument();
    });

    it("renders both LinkedIn and portfolio links when both are present", () => {
        const profile = {
            linkedInUrl: "https://www.linkedin.com/in/shama-kausar",
            portfolioUrl: "http://shama.dev",
        };
        render(<SocialPresenceCard profile={profile} />);

        expect(screen.getByText("shama-kausar")).toBeInTheDocument();
        expect(screen.getByText("shama.dev")).toBeInTheDocument();
        expect(screen.queryByText("—")).not.toBeInTheDocument();
        expect(screen.getAllByRole("link")).toHaveLength(4);
    });

    it("handles a LinkedIn URL without the www. subdomain", () => {
        const profile = { linkedInUrl: "https://linkedin.com/in/shama-kausar" };
        render(<SocialPresenceCard profile={profile} />);

        expect(screen.getByText("shama-kausar")).toBeInTheDocument();
    });
});