// src/test/ui/TermsAndConditionsModal.test.jsx
import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TermsAndConditionsModal from "../../shared/marketing/TermsAndConditionsModal";

// jsdom does not implement <dialog>'s imperative API — polyfill just enough
// for the component's effects (showModal/close toggle the `open` property).
beforeAll(() => {
    if (!HTMLDialogElement.prototype.showModal) {
        HTMLDialogElement.prototype.showModal = function () {
            this.open = true;
        };
    }
    if (!HTMLDialogElement.prototype.close) {
        HTMLDialogElement.prototype.close = function () {
            this.open = false;
            this.dispatchEvent(new Event("close"));
        };
    }
});

describe("TermsAndConditionsModal", () => {
    afterEach(() => {
        document.body.style.overflow = "";
    });

    it("renders nothing content-wise different but calls showModal when isOpen=true", () => {
        render(
            <TermsAndConditionsModal isOpen={true} onClose={vi.fn()} onAccept={vi.fn()} />,
        );
        expect(screen.getByRole("heading", { name: "Terms & Conditions" })).toBeInTheDocument();
        expect(document.body.style.overflow).toBe("hidden");
    });

    it("does nothing to the dialog when initially mounted with isOpen=false", () => {
        render(
            <TermsAndConditionsModal isOpen={false} onClose={vi.fn()} onAccept={vi.fn()} />,
        );
        expect(document.body.style.overflow).toBe("");
    });

    it("restores body overflow when isOpen=false", () => {
        const { rerender } = render(
            <TermsAndConditionsModal isOpen={true} onClose={vi.fn()} onAccept={vi.fn()} />,
        );
        expect(document.body.style.overflow).toBe("hidden");

        rerender(
            <TermsAndConditionsModal isOpen={false} onClose={vi.fn()} onAccept={vi.fn()} />,
        );
        expect(document.body.style.overflow).toBe("");
    });

    it("shows the role-specific subtitle for 'mentor' (default role) when not readOnly", () => {
        render(
            <TermsAndConditionsModal isOpen={true} onClose={vi.fn()} onAccept={vi.fn()} />,
        );
        expect(
            screen.getByText("Please read the full agreement before registering as a mentor."),
        ).toBeInTheDocument();
    });

    it("shows the role-specific subtitle for 'mentee'", () => {
        render(
            <TermsAndConditionsModal isOpen={true} onClose={vi.fn()} onAccept={vi.fn()} role="mentee" />,
        );
        expect(
            screen.getByText("Please read the full agreement before registering as a mentee."),
        ).toBeInTheDocument();
    });

    it("shows the generic readOnly subtitle and hides the checkbox/footer when readOnly", () => {
        render(
            <TermsAndConditionsModal isOpen={true} onClose={vi.fn()} onAccept={vi.fn()} readOnly />,
        );
        expect(screen.getByText("LeapMentor Terms & Conditions")).toBeInTheDocument();
        expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
        expect(screen.queryByText("Accept & Continue")).not.toBeInTheDocument();
    });

    it("shows mentor-specific conduct copy for role='mentor'", () => {
        render(
            <TermsAndConditionsModal isOpen={true} onClose={vi.fn()} onAccept={vi.fn()} role="mentor" />,
        );
        expect(screen.getByText(/As a mentor, you agree to provide accurate information/)).toBeInTheDocument();
    });

    it("shows mentee-specific conduct copy for role='mentee'", () => {
        render(
            <TermsAndConditionsModal isOpen={true} onClose={vi.fn()} onAccept={vi.fn()} role="mentee" />,
        );
        expect(screen.getByText(/As a mentee, you agree to engage respectfully/)).toBeInTheDocument();
    });

    it("the Accept button is disabled until the checkbox is checked, and enables once it is", () => {
        const onAccept = vi.fn();
        render(
            <TermsAndConditionsModal isOpen={true} onClose={vi.fn()} onAccept={onAccept} />,
        );
        const checkbox = screen.getByRole("checkbox");
        const acceptButton = screen.getByText("Accept & Continue");
        expect(acceptButton).toBeDisabled();

        fireEvent.click(acceptButton);
        expect(onAccept).not.toHaveBeenCalled();

        fireEvent.click(checkbox);
        expect(acceptButton).not.toBeDisabled();

        fireEvent.click(acceptButton);
        expect(onAccept).toHaveBeenCalledTimes(1);
    });

    it("resets the checkbox back to unchecked whenever the modal re-opens", () => {
        const { rerender } = render(
            <TermsAndConditionsModal isOpen={true} onClose={vi.fn()} onAccept={vi.fn()} />,
        );
        fireEvent.click(screen.getByRole("checkbox"));
        expect(screen.getByRole("checkbox")).toBeChecked();

        rerender(<TermsAndConditionsModal isOpen={false} onClose={vi.fn()} onAccept={vi.fn()} />);
        rerender(<TermsAndConditionsModal isOpen={true} onClose={vi.fn()} onAccept={vi.fn()} />);

        expect(screen.getByRole("checkbox")).not.toBeChecked();
    });

    it("calls onClose when the ✕ button is clicked", () => {
        const onClose = vi.fn();
        render(<TermsAndConditionsModal isOpen={true} onClose={onClose} onAccept={vi.fn()} />);
        fireEvent.click(screen.getByLabelText("Close modal"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when the Cancel button is clicked", () => {
        const onClose = vi.fn();
        render(<TermsAndConditionsModal isOpen={true} onClose={onClose} onAccept={vi.fn()} />);
        fireEvent.click(screen.getByText("Cancel"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when the backdrop itself is clicked, but not when clicking inside the panel", () => {
        const onClose = vi.fn();
        render(<TermsAndConditionsModal isOpen={true} onClose={onClose} onAccept={vi.fn()} />);

        fireEvent.click(screen.getByRole("heading", { name: "Terms & Conditions" }));
        expect(onClose).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole("presentation"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("contains a mailto contact link", () => {
        render(<TermsAndConditionsModal isOpen={true} onClose={vi.fn()} onAccept={vi.fn()} />);
        const link = screen.getByText("leapmentor2026@gmail.com");
        expect(link).toHaveAttribute(
            "href",
            "https://mail.google.com/mail/?view=cm&to=leapmentor2026@gmail.com",
        );
    });
});