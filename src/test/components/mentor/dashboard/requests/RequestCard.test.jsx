// src/test/components/mentor/dashboard/requests/RequestCard.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RequestCard from "../../../../../components/mentor/dashboard/requests/RequestCard";

const baseRequest = {
    mentee: { name: "Jordan Lee", email: "jordan@example.com" },
    message: "Would love your guidance!",
    selectedSlots: [
        { day: "Mon", date: "2099-06-20", startTime: "09:00", endTime: "10:00" },
        { day: "Tue", date: "2099-06-21", startTime: "11:00", endTime: "12:00" },
    ],
    confirmedSlot: null,
    status: "pending",
    requestedAt: "2099-06-01",
};

describe("RequestCard Component Suite", () => {
    it("should render the mentee name and initials", () => {
        render(<RequestCard request={baseRequest} onViewProfile={vi.fn()} />);
        expect(screen.getByText("Jordan Lee")).toBeInTheDocument();
        expect(screen.getByText("JL")).toBeInTheDocument();
    });

    it("should render the status badge label for the request status", () => {
        render(<RequestCard request={{ ...baseRequest, status: "accepted" }} onViewProfile={vi.fn()} />);
        expect(screen.getByText("Accepted")).toBeInTheDocument();
    });

    it("should default to the pending badge config for an unrecognized status", () => {
        render(<RequestCard request={{ ...baseRequest, status: "unknown" }} onViewProfile={vi.fn()} />);
        expect(screen.getByText("Pending")).toBeInTheDocument();
    });

    it("should show the '+N more' button when there is more than one slot and the request is pending", () => {
        render(<RequestCard request={baseRequest} onViewProfile={vi.fn()} />);
        expect(screen.getByText("+1")).toBeInTheDocument();
    });

    it("should not show the '+N more' button when the request is not pending", () => {
        render(<RequestCard request={{ ...baseRequest, status: "accepted" }} onViewProfile={vi.fn()} />);
        expect(screen.queryByText("+1")).not.toBeInTheDocument();
    });

    it("should display the confirmedSlot instead of the first selectedSlot when not pending", () => {
        const request = {
            ...baseRequest,
            status: "accepted",
            confirmedSlot: { day: "Wed", date: "2099-06-22", startTime: "14:00", endTime: "15:00" },
        };
        render(<RequestCard request={request} onViewProfile={vi.fn()} />);
        expect(screen.getByText(/Wed, Jun 22, 2099/)).toBeInTheDocument();
    });

    it("should show the 'Respond' button only when the request is pending", () => {
        const { rerender } = render(<RequestCard request={baseRequest} onViewProfile={vi.fn()} />);
        expect(screen.getByRole("button", { name: "Respond" })).toBeInTheDocument();

        rerender(<RequestCard request={{ ...baseRequest, status: "accepted" }} onViewProfile={vi.fn()} />);
        expect(screen.queryByRole("button", { name: "Respond" })).not.toBeInTheDocument();
    });

    it("should call onViewProfile with the request when Respond is clicked", () => {
        const onViewProfile = vi.fn();
        render(<RequestCard request={baseRequest} onViewProfile={onViewProfile} />);
        fireEvent.click(screen.getByRole("button", { name: "Respond" }));
        expect(onViewProfile).toHaveBeenCalledWith(baseRequest);
    });

    it("should show 'Referred to another mentor' banner when status is referred", () => {
        render(<RequestCard request={{ ...baseRequest, status: "referred" }} onViewProfile={vi.fn()} />);
        expect(screen.getByText("Referred to another mentor")).toBeInTheDocument();
    });

    it("should show the referred-by banner when referredBy is present", () => {
        render(
            <RequestCard
                request={{ ...baseRequest, referredBy: { name: "Sam Patel", email: "sam@example.com" } }}
                onViewProfile={vi.fn()}
            />,
        );
        expect(screen.getByText("Sam Patel")).toBeInTheDocument();
    });

    it("should open the ReferredByProfileModal when the referred-by banner is clicked", () => {
        render(
            <RequestCard
                request={{
                    ...baseRequest,
                    referredBy: { name: "Sam Patel", email: "sam@example.com" },
                    referredByProfile: { currentRole: "Coach", company: "Acme" },
                }}
                onViewProfile={vi.fn()}
            />,
        );
        fireEvent.click(screen.getByText(/Referred by/));
        expect(screen.getByText("This mentor referred this request to you")).toBeInTheDocument();
    });

    it("should render the truncated message preview", () => {
        render(<RequestCard request={baseRequest} onViewProfile={vi.fn()} />);
        expect(screen.getByText('"Would love your guidance!"')).toBeInTheDocument();
    });

    it("should open the SlotsModal when 'View Details' is clicked and close it via its Close button", () => {
        render(<RequestCard request={baseRequest} onViewProfile={vi.fn()} />);
        fireEvent.click(screen.getByRole("button", { name: "View Details" }));
        expect(screen.getByText(/Proposed Slots/)).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: "Close" }));
        expect(screen.queryByText(/Proposed Slots/)).not.toBeInTheDocument();
    });

    it("should render '—' for the mentee name and '?' initials when mentee is missing", () => {
        render(<RequestCard request={{ ...baseRequest, mentee: undefined }} onViewProfile={vi.fn()} />);
        expect(screen.getByText("—")).toBeInTheDocument();
        expect(screen.getByText("?")).toBeInTheDocument();
    });
});