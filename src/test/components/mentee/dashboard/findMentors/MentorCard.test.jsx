// src/test/components/mentee/dashboard/findMentors/MentorCard.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import MentorCard from "../../../../../components/mentee/dashboard/findMentors/MentorCard";

describe("MentorCard Component Suite", () => {
    const mockViewProfile = vi.fn();

    const baseMentor = {
        id: "m1",
        name: "Jordan Lee",
        currentRole: "Staff Engineer",
        company: "Nimbus Inc",
        industry: "Technology",
        skills: ["React", "Node.js", "GraphQL", "AWS"],
        hourlyRate: 40,
        avgRating: 4.6,
        profilePicture: "",
        verificationStatus: "verified",
        yearsOfExperience: 6,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should render initials avatar fallback when no profile picture is set", () => {
        render(<MentorCard mentor={baseMentor} onViewProfile={mockViewProfile} />);
        expect(screen.getByText("JL")).toBeInTheDocument();
    });

    it("should display name, role, company, and years of experience", () => {
        render(<MentorCard mentor={baseMentor} onViewProfile={mockViewProfile} />);
        expect(screen.getByText("Jordan Lee")).toBeInTheDocument();
        expect(screen.getByText(/Staff Engineer.*Nimbus Inc/)).toBeInTheDocument();
        expect(screen.getByText(/6 yrs experience/i)).toBeInTheDocument();
    });

    it("should cap visible skills and show a '+N more' badge beyond the limit", () => {
        render(<MentorCard mentor={baseMentor} onViewProfile={mockViewProfile} />);
        expect(screen.getByText("React")).toBeInTheDocument();
        expect(screen.getByText("Node.js")).toBeInTheDocument();
        expect(screen.getByText("GraphQL")).toBeInTheDocument();
        expect(screen.queryByText("AWS")).not.toBeInTheDocument();
        expect(screen.getByText("+1 more")).toBeInTheDocument();
    });

    it("should show the Verified badge when verificationStatus is verified", () => {
        render(<MentorCard mentor={baseMentor} onViewProfile={mockViewProfile} />);
        expect(screen.getByText("Verified")).toBeInTheDocument();
    });

    it("should show the Unverified badge for any other verification status", () => {
        render(<MentorCard mentor={{ ...baseMentor, verificationStatus: "pending" }} onViewProfile={mockViewProfile} />);
        expect(screen.getByText("Unverified")).toBeInTheDocument();
    });

    it("should render 'Free' when hourlyRate is falsy", () => {
        render(<MentorCard mentor={{ ...baseMentor, hourlyRate: 0 }} onViewProfile={mockViewProfile} />);
        expect(screen.getByText("Free")).toBeInTheDocument();
    });

    it("should render the hourly rate with LP/hr suffix when set", () => {
        render(<MentorCard mentor={baseMentor} onViewProfile={mockViewProfile} />);
        expect(screen.getByText("40")).toBeInTheDocument();
        expect(screen.getByText("LP")).toBeInTheDocument();
    });

    it("should show 'New' when avgRating is absent", () => {
        render(<MentorCard mentor={{ ...baseMentor, avgRating: undefined }} onViewProfile={mockViewProfile} />);
        expect(screen.getByText("New")).toBeInTheDocument();
    });

    it("should invoke onViewProfile with the full mentor object on button click", () => {
        render(<MentorCard mentor={baseMentor} onViewProfile={mockViewProfile} />);
        fireEvent.click(screen.getByRole("button", { name: /View Profile/i }));
        expect(mockViewProfile).toHaveBeenCalledWith(baseMentor);
    });

    it("should fall back to '?' initials and '—' fields when name/role are missing", () => {
        render(<MentorCard mentor={{ ...baseMentor, name: "", currentRole: "", company: "" }} onViewProfile={mockViewProfile} />);
        expect(screen.getByText("?")).toBeInTheDocument();
        expect(screen.getAllByText("—")).toHaveLength(2); // name field + role/company field
    });
});