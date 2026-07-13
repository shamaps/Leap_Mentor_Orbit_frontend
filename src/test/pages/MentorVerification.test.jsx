// src/test/pages/MentorVerification.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MentorVerification from "../../pages/MentorVerification";

vi.mock("../../components/mentor/VerificationFormShell", () => ({
    default: () => <div data-testid="verification-form-shell" />,
}));

describe("MentorVerification", () => {
    it("renders the VerificationFormShell", () => {
        render(<MentorVerification />);
        expect(screen.getByTestId("verification-form-shell")).toBeInTheDocument();
    });
});