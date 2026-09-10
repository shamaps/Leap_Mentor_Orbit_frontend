// components/mentee/dashboard/__tests__/ProfessionalDetailsCard.test.jsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ProfessionalDetailsCard from "../../../../features/mentee/view/components/dashboard/ProfessionalDetailsCard";

describe("ProfessionalDetailsCard", () => {
    it("renders em-dash fallbacks for every field when profile is undefined", () => {
        render(<ProfessionalDetailsCard />);

        expect(screen.getByText("Current Role")).toBeInTheDocument();
        expect(screen.getByText("Experience")).toBeInTheDocument();
        expect(screen.getByText("Company")).toBeInTheDocument();
        expect(screen.getByText("Industry")).toBeInTheDocument();

        // 4 fields, all falling back to the em-dash
        expect(screen.getAllByText("—")).toHaveLength(4);
    });

    it("renders em-dash fallbacks when profile fields are missing", () => {
        render(<ProfessionalDetailsCard profile={{}} />);
        expect(screen.getAllByText("—")).toHaveLength(4);
    });

    it("renders all provided professional detail values", () => {
        const profile = {
            currentRole: "Software Engineer",
            yearsOfExperience: 5,
            company: "Nineleaps",
            industry: "Technology",
        };
        render(<ProfessionalDetailsCard profile={profile} />);

        expect(screen.getByText("Software Engineer")).toBeInTheDocument();
        expect(screen.getByText("5 Years")).toBeInTheDocument();
        expect(screen.getByText("Nineleaps")).toBeInTheDocument();
        expect(screen.getByText("Technology")).toBeInTheDocument();
    });

    it("falls back to em-dash for experience when yearsOfExperience is 0", () => {
        // 0 is falsy, so the ternary should take the "—" branch
        const profile = { yearsOfExperience: 0 };
        render(<ProfessionalDetailsCard profile={profile} />);

        const experienceSection = screen.getByText("Experience").parentElement;
        expect(experienceSection).toHaveTextContent("—");
    });

    it("renders partial data with a mix of values and fallbacks", () => {
        const profile = { currentRole: "PM", industry: "Fintech" };
        render(<ProfessionalDetailsCard profile={profile} />);

        expect(screen.getByText("PM")).toBeInTheDocument();
        expect(screen.getByText("Fintech")).toBeInTheDocument();
        expect(screen.getAllByText("—")).toHaveLength(2); // Experience + Company
    });
});