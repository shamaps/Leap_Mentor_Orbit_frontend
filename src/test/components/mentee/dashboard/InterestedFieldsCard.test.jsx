// components/mentee/dashboard/__tests__/InterestedFieldsCard.test.jsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import InterestedFieldsCard from "../../../../components/mentee/dashboard/InterestedFieldsCard";

describe("InterestedFieldsCard", () => {
    it("renders empty-state copy when no fields and no skills are provided", () => {
        render(<InterestedFieldsCard profile={{}} />);

        expect(screen.getByText("No fields added yet.")).toBeInTheDocument();
        expect(screen.getByText("No skills added yet.")).toBeInTheDocument();
    });

    it("renders empty-state copy when profile prop is undefined", () => {
        render(<InterestedFieldsCard />);

        expect(screen.getByText("No fields added yet.")).toBeInTheDocument();
        expect(screen.getByText("No skills added yet.")).toBeInTheDocument();
    });

    it("renders a chip for every interested field", () => {
        const profile = { interestedFields: ["AI/ML", "Web Dev"], skills: [] };
        render(<InterestedFieldsCard profile={profile} />);

        expect(screen.getByText("AI/ML")).toBeInTheDocument();
        expect(screen.getByText("Web Dev")).toBeInTheDocument();
        expect(screen.getByText("No skills added yet.")).toBeInTheDocument();
    });

    it("renders a chip for every skill", () => {
        const profile = { interestedFields: [], skills: ["React", "Node.js"] };
        render(<InterestedFieldsCard profile={profile} />);

        expect(screen.getByText("React")).toBeInTheDocument();
        expect(screen.getByText("Node.js")).toBeInTheDocument();
        expect(screen.getByText("No fields added yet.")).toBeInTheDocument();
    });

    it("renders both fields and skills together", () => {
        const profile = {
            interestedFields: ["Cloud"],
            skills: ["Docker"],
        };
        render(<InterestedFieldsCard profile={profile} />);

        expect(screen.getByText("Cloud")).toBeInTheDocument();
        expect(screen.getByText("Docker")).toBeInTheDocument();
        expect(screen.queryByText("No fields added yet.")).not.toBeInTheDocument();
        expect(screen.queryByText("No skills added yet.")).not.toBeInTheDocument();
    });

    it("renders section headings", () => {
        render(<InterestedFieldsCard profile={{}} />);

        expect(screen.getByText("Interested Fields")).toBeInTheDocument();
        expect(screen.getByText("Top Skills")).toBeInTheDocument();
    });
});