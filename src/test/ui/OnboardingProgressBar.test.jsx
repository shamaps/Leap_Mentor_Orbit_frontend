// src/test/ui/OnboardingProgressBar.test.jsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import OnboardingProgressBar from "../../ui/OnboardingProgressBar";

const fields = [
    { key: "name", type: "text" },
    { key: "bio", type: "text" },
    { key: "skills", type: "array" },
];

describe("OnboardingProgressBar", () => {
    it("shows 0% (blue) when no fields are filled", () => {
        render(
            <OnboardingProgressBar
                form={{ name: "", bio: null, skills: [] }}
                fields={fields}
            />,
        );
        expect(screen.getByText("0%")).toBeInTheDocument();
    });

    it("counts a scalar field as filled when it has a non-empty, non-null, non-undefined value", () => {
        render(
            <OnboardingProgressBar
                form={{ name: "Asha", bio: undefined, skills: [] }}
                fields={fields}
            />,
        );
        // 1 of 3 filled → 33%, under 40 → blue bracket
        expect(screen.getByText("33%")).toBeInTheDocument();
    });

    it("counts an array field as filled only when it is a non-empty array (purple bracket 40-74%)", () => {
        render(
            <OnboardingProgressBar
                form={{ name: "Asha", bio: "Hi there", skills: [] }}
                fields={fields}
            />,
        );
        // 2 of 3 filled → 67%, in [40,75) → purple
        expect(screen.getByText("67%")).toBeInTheDocument();
    });

    it("treats a non-empty array as filled and shows the green 'Complete' state at 100%", () => {
        render(
            <OnboardingProgressBar
                form={{ name: "Asha", bio: "Hi there", skills: ["React"] }}
                fields={fields}
            />,
        );
        expect(screen.getByText("✓ Complete")).toBeInTheDocument();
    });

    it("treats a non-array value on an array-type field as not filled", () => {
        render(
            <OnboardingProgressBar
                form={{ name: "Asha", bio: "Hi there", skills: "not-an-array" }}
                fields={fields}
            />,
        );
        expect(screen.getByText("67%")).toBeInTheDocument();
    });
});