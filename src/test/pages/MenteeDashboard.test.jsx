// src/test/pages/MenteeDashboard.test.jsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import MenteeDashboard from "../../pages/MenteeDashboard";

vi.mock("../../components/mentee/dashboard/DashboardLayout", () => ({
    default: () => <div data-testid="mentee-dashboard-layout" />,
}));

describe("MenteeDashboard", () => {
    it("renders the mentee DashboardLayout", () => {
        render(<MenteeDashboard />);
        expect(screen.getByTestId("mentee-dashboard-layout")).toBeInTheDocument();
    });
});