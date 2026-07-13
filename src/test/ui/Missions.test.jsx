// src/test/ui/Missions.test.jsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Missions from "../../ui/Missions";

describe("Missions", () => {
    it("renders the section heading and all three feature cards", () => {
        render(<Missions />);

        expect(screen.getByText("Designed for your career success")).toBeInTheDocument();
        expect(screen.getByText("Verified Mentors")).toBeInTheDocument();
        expect(screen.getByText("Flexible Scheduling")).toBeInTheDocument();
        expect(screen.getByText("Structured Growth")).toBeInTheDocument();
    });
});