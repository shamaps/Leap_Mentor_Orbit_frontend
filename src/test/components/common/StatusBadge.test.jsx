import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import StatusBadge from "../../../shared/components/StatusBadge";

describe("StatusBadge Component Suite", () => {
    it("should render the admin variant (default) with dot and label for a known status", () => {
        render(<StatusBadge status="pending" />);
        expect(screen.getByText("Pending")).toBeInTheDocument();
    });

    it("should render the admin variant explicitly when passed", () => {
        const { container } = render(<StatusBadge status="accepted" variant="admin" />);
        expect(screen.getByText("Accepted")).toBeInTheDocument();
        // dot span should be present in admin variant
        expect(container.querySelector("span > span")).toBeInTheDocument();
    });

    it("should render the history variant without a dot", () => {
        const { container } = render(<StatusBadge status="completed" variant="history" />);
        expect(screen.getByText("Completed")).toBeInTheDocument();
        // history variant renders a single span with no nested dot span
        expect(container.querySelector("span > span")).not.toBeInTheDocument();
    });

    it("should render every known status label correctly", () => {
        const statuses = [
            "pending",
            "accepted",
            "ongoing",
            "completed",
            "rejected",
            "referred",
            "paid",
            "unpaid",
            "refunded",
            "cancelled",
            "in_progress",
        ];
        const labels = [
            "Pending",
            "Accepted",
            "Ongoing",
            "Completed",
            "Rejected",
            "Referred",
            "Paid",
            "Unpaid",
            "Refunded",
            "Cancelled",
            "In Progress",
        ];

        statuses.forEach((status, i) => {
            const { unmount } = render(<StatusBadge status={status} />);
            expect(screen.getByText(labels[i])).toBeInTheDocument();
            unmount();
        });
    });

    it("should fall back to the unknown-status default config when status isn't in STATUS_CONFIG", () => {
        // Bypass propTypes constraint intentionally to exercise the fallback branch
        render(<StatusBadge status={"totally_unknown_status"} />);
        expect(screen.getByText("totally_unknown_status")).toBeInTheDocument();
    });

    it("should render the fallback status label in the history variant too", () => {
        render(<StatusBadge status={"weird_status"} variant="history" />);
        expect(screen.getByText("weird_status")).toBeInTheDocument();
    });
});