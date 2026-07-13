import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import SkillsCard from "../../../../components/mentor/dashboard/SkillsCard";

describe("SkillsCard", () => {
    it("renders the card heading", () => {
        render(<SkillsCard profile={{ skills: [] }} />);
        expect(screen.getByText("Skills & Expertise")).toBeInTheDocument();
    });

    it("shows an empty state when there are no skills", () => {
        render(<SkillsCard profile={{ skills: [] }} />);

        expect(screen.getByText("No skills added yet.")).toBeInTheDocument();
        expect(screen.queryByText("Core Skills")).not.toBeInTheDocument();
    });

    it("shows an empty state when profile is undefined", () => {
        render(<SkillsCard />);
        expect(screen.getByText("No skills added yet.")).toBeInTheDocument();
    });

    it("renders each skill as a badge under Core Skills", () => {
        render(
            <SkillsCard profile={{ skills: ["React", "Node.js", "System Design"] }} />
        );

        expect(screen.getByText("Core Skills")).toBeInTheDocument();
        expect(screen.getByText("React")).toBeInTheDocument();
        expect(screen.getByText("Node.js")).toBeInTheDocument();
        expect(screen.getByText("System Design")).toBeInTheDocument();
    });

    it("renders the correct number of skill badges", () => {
        const skills = ["React", "Node.js", "System Design"];
        render(<SkillsCard profile={{ skills }} />);

        skills.forEach((skill) => {
            expect(screen.getByText(skill)).toBeInTheDocument();
        });
    });
});