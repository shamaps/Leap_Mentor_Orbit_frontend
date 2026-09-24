// src/test/components/mentor/dashboard/requests/ReferredByProfileModal.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ReferredByProfileModal from "../../../../../features/mentor/view/components/dashboard/requests/ReferredByProfileModal";

const baseMentor = {
    name: "Alex Kim",
    email: "alex@example.com",
    currentRole: "Senior Engineer",
    company: "Acme",
    industry: "Tech",
    bio: "Loves mentoring.",
    hourlyRate: 50,
    avgRating: 4.5,
    yearsOfExperience: 8,
    profilePicture: null,
    skills: ["React", "Node"],
};

describe("ReferredByProfileModal Component Suite", () => {
    it("should return null when mentor is not provided", () => {
        const { container } = render(<ReferredByProfileModal mentor={null} onClose={vi.fn()} />);
        expect(container).toBeEmptyDOMElement();
    });

    it("should render the mentor's name, role, company, and email", () => {
        render(<ReferredByProfileModal mentor={baseMentor} onClose={vi.fn()} />);
        expect(screen.getByText("Alex Kim")).toBeInTheDocument();
        expect(screen.getByText("Senior Engineer at Acme")).toBeInTheDocument();
        expect(screen.getByText("alex@example.com")).toBeInTheDocument();
    });

    it("should render initials when no profilePicture is provided", () => {
        render(<ReferredByProfileModal mentor={baseMentor} onClose={vi.fn()} />);
        expect(screen.getByText("AK")).toBeInTheDocument();
    });

    it("should render the profile picture when provided instead of initials", () => {
        render(
            <ReferredByProfileModal
                mentor={{ ...baseMentor, profilePicture: "https://example.com/pic.jpg" }}
                onClose={vi.fn()}
            />,
        );
        expect(screen.getByAltText("Alex Kim")).toHaveAttribute("src", "https://example.com/pic.jpg");
        expect(screen.queryByText("AK")).not.toBeInTheDocument();
    });

    it("should show the hourly rate when provided", () => {
        render(<ReferredByProfileModal mentor={baseMentor} onClose={vi.fn()} />);
        expect(screen.getByText("$50")).toBeInTheDocument();
    });

    it("should show 'Free' when hourlyRate is not provided", () => {
        render(<ReferredByProfileModal mentor={{ ...baseMentor, hourlyRate: null }} onClose={vi.fn()} />);
        expect(screen.getByText("Free")).toBeInTheDocument();
    });

    it("should render the average rating formatted to one decimal", () => {
        render(<ReferredByProfileModal mentor={baseMentor} onClose={vi.fn()} />);
        expect(screen.getByText("4.5")).toBeInTheDocument();
    });

    it("should render 'New' when avgRating is 0 or missing", () => {
        render(<ReferredByProfileModal mentor={{ ...baseMentor, avgRating: 0 }} onClose={vi.fn()} />);
        expect(screen.getByText("New")).toBeInTheDocument();
    });

    it("should render years of experience and fall back to '—' when missing", () => {
        const { rerender } = render(<ReferredByProfileModal mentor={baseMentor} onClose={vi.fn()} />);
        expect(screen.getByText("8 Years")).toBeInTheDocument();

        rerender(
            <ReferredByProfileModal mentor={{ ...baseMentor, yearsOfExperience: null }} onClose={vi.fn()} />,
        );
        expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    });

    it("should render all provided skills", () => {
        render(<ReferredByProfileModal mentor={baseMentor} onClose={vi.fn()} />);
        expect(screen.getByText("React")).toBeInTheDocument();
        expect(screen.getByText("Node")).toBeInTheDocument();
    });

    it("should not render the skills section when skills is empty", () => {
        render(<ReferredByProfileModal mentor={{ ...baseMentor, skills: [] }} onClose={vi.fn()} />);
        expect(screen.queryByText("Skills")).not.toBeInTheDocument();
    });

    it("should call onClose when the header close button or footer Close button is clicked", () => {
        const onClose = vi.fn();
        render(<ReferredByProfileModal mentor={baseMentor} onClose={onClose} />);
        fireEvent.click(screen.getByRole("button", { name: "Close" }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});