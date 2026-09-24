// src/test/pages/MenteeOnboarding.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MenteeOnboarding from "../../features/mentee/view/pages/MenteeOnboarding";

vi.mock("../../features/mentee/view/components/onboarding/MenteeOnboardingShell", () => ({
    default: () => <div data-testid="mentee-onboarding-shell" />,
}));

describe("MenteeOnboarding", () => {
    it("renders the MenteeOnboardingShell", () => {
        render(<MenteeOnboarding />);
        expect(screen.getByTestId("mentee-onboarding-shell")).toBeInTheDocument();
    });
});