// src/test/pages/MentorOnboarding.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MentorOnboarding from "../../pages/MentorOnboarding";

vi.mock("../../components/mentor/onboarding/OnboardingFormShell", () => ({
    default: () => <div data-testid="onboarding-form-shell" />,
}));

describe("MentorOnboarding", () => {
    it("renders the OnboardingFormShell", () => {
        render(<MentorOnboarding />);
        expect(screen.getByTestId("onboarding-form-shell")).toBeInTheDocument();
    });
});