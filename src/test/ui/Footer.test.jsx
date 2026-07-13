// src/test/ui/Footer.test.jsx
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import Footer from "../../ui/Footer";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

// jsdom does not implement <dialog>'s imperative API — polyfill just enough
// for Footer's own contact dialog *and* the nested TermsAndConditionsModal's
// dialog to toggle their `open` property and fire the native "close" event.
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

// Note: because `css: false` in vitest config, no real stylesheet is ever
// loaded, so a closed <dialog>'s content is never actually hidden from
// text/role queries in this environment. We therefore assert on the real
// `.open` DOM property of the two dialogs (looked up by their
// aria-labelledby) rather than on text presence/absence.
const getContactDialog = () =>
    document.querySelector('dialog[aria-labelledby="contact-modal-title"]');
const getTermsDialog = () =>
    document.querySelector('dialog[aria-labelledby="terms-modal-title"]');

describe("Footer", () => {
    beforeEach(() => {
        mockNavigate.mockReset();
    });

    it("renders the brand, tagline, link columns, and copyright text", () => {
        render(<Footer />);

        expect(screen.getByAltText("LeapMentor logo")).toBeInTheDocument();
        expect(screen.getByText("LeapMentor")).toBeInTheDocument();
        expect(
            screen.getByText(/world's leading mentorship platform/),
        ).toBeInTheDocument();

        expect(screen.getByText("For Mentees")).toBeInTheDocument();
        expect(screen.getByText("For Mentors")).toBeInTheDocument();
        expect(screen.getByText("Company")).toBeInTheDocument();

        expect(screen.getByText("Find a Mentor")).toBeInTheDocument();
        expect(screen.getByText("Become a Mentor")).toBeInTheDocument();
        expect(screen.getByText("Contact")).toBeInTheDocument();

        expect(
            screen.getByText("© 2026 LeapMentor Inc. All rights reserved."),
        ).toBeInTheDocument();

        // Both dialogs exist but start closed.
        expect(getContactDialog().open).toBe(false);
        expect(getTermsDialog().open).toBe(false);
    });

    it("navigates to /register/mentee when 'Find a Mentor' is clicked, and fires its hover handlers", () => {
        render(<Footer />);
        const link = screen.getByText("Find a Mentor");

        fireEvent.mouseEnter(link);
        expect(link).toHaveStyle({ color: "#fff" });
        fireEvent.mouseLeave(link);
        expect(link).toHaveStyle({ color: "#9ca3af" });

        fireEvent.click(link);
        expect(mockNavigate).toHaveBeenCalledWith("/register/mentee");
    });

    it("navigates to /register/mentor when 'Become a Mentor' is clicked", () => {
        render(<Footer />);
        fireEvent.click(screen.getByText("Become a Mentor"));
        expect(mockNavigate).toHaveBeenCalledWith("/register/mentor");
    });

    it("opens the contact modal when 'Contact' is clicked, and fires its hover handlers", () => {
        render(<Footer />);
        const contactLink = screen.getByText("Contact");

        fireEvent.mouseEnter(contactLink);
        expect(contactLink).toHaveStyle({ color: "#fff" });
        fireEvent.mouseLeave(contactLink);
        expect(contactLink).toHaveStyle({ color: "#9ca3af" });

        expect(getContactDialog().open).toBe(false);
        fireEvent.click(contactLink);
        expect(getContactDialog().open).toBe(true);

        expect(screen.getByText("Contact Us")).toBeInTheDocument();
        expect(
            screen.getByText("Have questions? We'd love to hear from you."),
        ).toBeInTheDocument();

        // TermsAndConditionsModal (always mounted alongside this) also has an
        // identical mailto link in its own "Contact" section, so scope the
        // query to this contact dialog specifically.
        const emailLink = within(getContactDialog()).getByText(
            "leapmentor2026@gmail.com",
        );
        expect(emailLink).toHaveAttribute(
            "href",
            "https://mail.google.com/mail/?view=cm&to=leapmentor2026@gmail.com",
        );
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("fires the email link's hover handlers", () => {
        render(<Footer />);
        fireEvent.click(screen.getByText("Contact"));
        const emailLink = within(getContactDialog()).getByText(
            "leapmentor2026@gmail.com",
        );

        fireEvent.mouseEnter(emailLink);
        expect(emailLink).toHaveStyle({
            background: "#ede9fe",
            borderColor: "#a5b4fc",
        });

        fireEvent.mouseLeave(emailLink);
        expect(emailLink).toHaveStyle({
            background: "#f1f5f9",
            borderColor: "#e2e8f0",
        });
    });

    it("closes the contact modal via the Close button, firing its hover handlers too", () => {
        render(<Footer />);
        fireEvent.click(screen.getByText("Contact"));
        expect(getContactDialog().open).toBe(true);

        const closeBtn = screen.getByText("Close");
        fireEvent.mouseEnter(closeBtn);
        expect(closeBtn).toHaveStyle({ background: "#f8fafc" });
        fireEvent.mouseLeave(closeBtn);
        expect(closeBtn).toHaveStyle({ background: "none" });

        fireEvent.click(closeBtn);
        expect(getContactDialog().open).toBe(false);
    });

    it("closes the contact modal when the backdrop itself is clicked", () => {
        render(<Footer />);
        fireEvent.click(screen.getByText("Contact"));
        expect(getContactDialog().open).toBe(true);

        const backdrop = screen
            .getByText("Contact Us")
            .closest('[role="presentation"]');
        fireEvent.click(backdrop);

        expect(getContactDialog().open).toBe(false);
    });

    it("does not close the contact modal when clicking inside the modal card", () => {
        render(<Footer />);
        fireEvent.click(screen.getByText("Contact"));
        expect(getContactDialog().open).toBe(true);

        fireEvent.click(screen.getByText("Contact Us"));
        expect(getContactDialog().open).toBe(true);
    });

    it("opens the (readOnly) Terms & Conditions modal via the bottom-bar trigger, firing its hover handlers", () => {
        render(<Footer />);

        // The bottom-bar terms trigger renders with no visible text.
        const termsButton = screen
            .getAllByRole("button")
            .find((b) => !b.textContent.trim());
        expect(termsButton).toBeDefined();

        fireEvent.mouseEnter(termsButton);
        expect(termsButton).toHaveStyle({ color: "#9ca3af" });
        fireEvent.mouseLeave(termsButton);
        expect(termsButton).toHaveStyle({ color: "#4b5563" });

        expect(getTermsDialog().open).toBe(false);
        fireEvent.click(termsButton);
        expect(getTermsDialog().open).toBe(true);

        expect(
            screen.getByText("LeapMentor Terms & Conditions"),
        ).toBeInTheDocument();
    });

    it("closes the Terms modal via its own close (✕) button", () => {
        render(<Footer />);
        const termsButton = screen
            .getAllByRole("button")
            .find((b) => !b.textContent.trim());

        fireEvent.click(termsButton);
        expect(getTermsDialog().open).toBe(true);

        fireEvent.click(screen.getByLabelText("Close modal"));
        expect(getTermsDialog().open).toBe(false);
    });
});