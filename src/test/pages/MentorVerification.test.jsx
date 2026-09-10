// src/test/pages/MentorVerification.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MentorVerification from "../../features/mentor/view/pages/MentorVerification";

vi.mock("../../features/mentor/view/components/VerificationFormShell", () => ({
    default: () => <div data-testid="verification-form-shell" />,
}));

describe("MentorVerification", () => {
    it("renders the VerificationFormShell", () => {
        render(<MentorVerification />);
        expect(screen.getByTestId("verification-form-shell")).toBeInTheDocument();
    });
});