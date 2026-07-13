// src/test/pages/MentorDashboard.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MentorDashboard from "../../pages/MentorDashboard";

vi.mock("../../components/mentor/dashboard/DashboardLayout", () => ({
    default: () => <div data-testid="mentor-dashboard-layout" />,
}));

describe("MentorDashboard", () => {
    it("renders the mentor DashboardLayout", () => {
        render(<MentorDashboard />);
        expect(screen.getByTestId("mentor-dashboard-layout")).toBeInTheDocument();
    });
});