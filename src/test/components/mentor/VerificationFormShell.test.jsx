import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import React from "react";
import VerificationFormShell from "../../../features/mentor/view/components/VerificationFormShell";

// Declare tracking hooks using an absolute isolated mock control payload registry
const mockSubmitVerification = vi.fn();
let mockLoading = false;
let mockMsg = { type: "", text: "" };

vi.mock("../../../features/mentor/presenter/useVerificationSubmit", () => ({
    useVerificationSubmit: () => ({
        loading: mockLoading,
        msg: mockMsg,
        submitVerification: mockSubmitVerification,
    }),
}));
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

// Mock subcomponents cleanly to track data transmissions safely without schema locks
vi.mock("../../../features/mentor/view/components/PhoneNumberField", () => ({
    default: ({ value, onChange, error }) => (
        <div>
            <input
                data-testid="shell-phone-stub"
                value={value}
                onChange={(e) => onChange({ target: { value: e.target.value } })}
            />
            {error && <span>{error}</span>}
        </div>
    ),
}));

vi.mock("../../../features/mentor/view/components/ResumeUpload", () => ({
    default: ({ onChange, error }) => (
        <div>
            <button
                type="button"
                data-testid="shell-resume-stub"
                onClick={() => onChange(new File(["cv"], "cv.pdf", { type: "application/pdf" }), null)}
            >
                Attach Resume
            </button>
            {error && <span>{error}</span>}
        </div>
    ),
}));

vi.mock("../../../features/mentor/view/components/WorkExperienceUpload", () => ({
    default: ({ onChange, error }) => (
        <div>
            <button
                type="button"
                data-testid="shell-work-stub"
                onClick={() => onChange([new File(["work"], "proof.pdf", { type: "application/pdf" })], null)}
            >
                Attach Proof
            </button>
            {error && <span>{error}</span>}
        </div>
    ),
}));

vi.mock("../../../features/mentor/view/components/VerificationInstructionsModal", () => ({
    default: ({ onClose }) => (
        <div data-testid="instructions-modal-stub">
            <button onClick={onClose}>Dismiss Guide</button>
        </div>
    ),
}));

vi.mock("@/shared/components/FullScreenLoader", () => ({
    default: ({ message }) => <div data-testid="shell-loader-stub">{message}</div>,
}));

describe("VerificationFormShell Component Suite", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        mockLoading = false;
        mockMsg = { type: "", text: "" };
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("should display the guide modal overlay on mount and allow closure controls to update visibility flags", () => {
        render(<VerificationFormShell />);
        expect(screen.getByTestId("instructions-modal-stub")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /Dismiss Guide/i }));
        expect(screen.queryByTestId("instructions-modal-stub")).not.toBeInTheDocument();
    });

    it("should stop form submission and trigger error text alerts if required parameters are missing", async () => {
        render(<VerificationFormShell />);
        fireEvent.click(screen.getByRole("button", { name: /Dismiss Guide/i }));

        const form = screen.getByRole("button", { name: /Submit for Verification/i }).form;

        await act(async () => {
            fireEvent.submit(form);
        });

        expect(screen.getByText("Phone number is required")).toBeInTheDocument();
        expect(screen.getByText("Resume is required")).toBeInTheDocument();
        expect(mockSubmitVerification).not.toHaveBeenCalled();
    });

    it("should handle error loops gracefully if server communication lines reject payloads", async () => {
        // Re-map global mock message properties before running initial instantiation renders
        mockMsg = { type: "error", text: "Database cluster synchronization failure." };

        render(<VerificationFormShell />);
        expect(screen.getByText("Database cluster synchronization failure.")).toBeInTheDocument();
    });

    it("should accept valid structures, trigger network dispatches, and redirect on completion", async () => {
        mockSubmitVerification.mockResolvedValueOnce({ success: true });

        // Simulate active loading label string variations to cover spinner code pathways
        mockLoading = true;

        render(<VerificationFormShell />);
        fireEvent.click(screen.getByRole("button", { name: /Dismiss Guide/i }));

        const phoneInput = screen.getByTestId("shell-phone-stub");
        fireEvent.change(phoneInput, { target: { value: "+919876543210" } });

        fireEvent.click(screen.getByTestId("shell-resume-stub"));
        fireEvent.click(screen.getByTestId("shell-work-stub"));

        expect(screen.getByText("Uploading documents…")).toBeInTheDocument();
        mockLoading = false; // drop lock back down to trigger submission sequence

        const formElement = screen.getByTestId("shell-phone-stub").form;

        await act(async () => {
            fireEvent.submit(formElement);
        });

        expect(mockSubmitVerification).toHaveBeenCalledWith({
            phoneNumber: "+919876543210",
            resumeFile: expect.any(File),
            workExperienceFiles: expect.any(Array),
        });

        expect(screen.getByTestId("shell-loader-stub")).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(1500);
        });
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/mentor");
    });
});