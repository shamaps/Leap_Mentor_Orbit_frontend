// src/test/pages/MenteeDashboard.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MenteeDashboard from "../../features/mentee/view/pages/MenteeDashboard";

vi.mock("../../features/mentee/view/components/dashboard/DashboardLayout", () => ({
    default: () => <div data-testid="mentee-dashboard-layout" />,
}));

describe("MenteeDashboard", () => {
    it("renders the mentee DashboardLayout", () => {
        render(<MenteeDashboard />);
        expect(screen.getByTestId("mentee-dashboard-layout")).toBeInTheDocument();
    });
});