import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ConnectCard from "../../../../features/connects/view/ConnectCard";

describe("ConnectCard Component Suite", () => {
    const mockOnDashboardClick = vi.fn();

    const basePerson = {
        currentRole: "Software Engineer",
        company: "LeapMentor",
        skills: ["React", "Node.js", "Vitest", "GraphQL"], // more than 3 to test slicing
        profilePicture: "https://example.com/avatar.jpg",
    };

    const baseSlot = {
        day: "Wednesday",
        date: "2026-07-15",
        startTime: "09:00",
        endTime: "10:30",
    };

    const baseSession = {
        confirmedSlot: baseSlot,
        paidAt: "2026-07-12T08:00:00.000Z",
        completedAt: "2026-07-15T11:00:00.000Z",
        totalAmount: 500,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Rendering Active States (isCompleted = false)", () => {
        it("should render active badge, token details, name, and role constraints cleanly", () => {
            render(
                <ConnectCard
                    name="Alice Dev"
                    person={basePerson}
                    session={baseSession}
                    tokenLabel="500 Tokens Locked"
                    onDashboardClick={mockOnDashboardClick}
                    isCompleted={false}
                />
            );

            // Verify name, badge, and role string construction
            expect(screen.getByText("Alice Dev")).toBeInTheDocument();
            expect(screen.getByText("Software Engineer @ LeapMentor")).toBeInTheDocument();
            expect(screen.getByText("Active")).toBeInTheDocument();
            expect(screen.getByText("500 Tokens Locked")).toBeInTheDocument();

            // Skills map testing (limited to maximum slice length of 3)
            expect(screen.getByText("React")).toBeInTheDocument();
            expect(screen.getByText("Node.js")).toBeInTheDocument();
            expect(screen.getByText("Vitest")).toBeInTheDocument();
            expect(screen.queryByText("GraphQL")).not.toBeInTheDocument();

            // Check slot string formatting with matching AM/PM compression logic
            // start: 9:00 AM, end: 10:30 AM -> start AM string omitted
            expect(
                screen.getByText("Wednesday, Jul 15, 2026 · 9:00 – 10:30 AM")
            ).toBeInTheDocument();

            // Verify started date rendering
            expect(screen.getByText("Started Jul 12, 2026")).toBeInTheDocument();

            // Button configuration test
            const ctaButton = screen.getByRole("button", { name: /Go to Shared Dashboard/i });
            expect(ctaButton).toBeInTheDocument();
        });

        it("should trigger click callback handlers when active action layout is clicked", () => {
            render(
                <ConnectCard
                    name="Alice Dev"
                    person={basePerson}
                    onDashboardClick={mockOnDashboardClick}
                />
            );

            const ctaButton = screen.getByRole("button", { name: /Go to Shared Dashboard/i });
            fireEvent.click(ctaButton);
            expect(mockOnDashboardClick).toHaveBeenCalledTimes(1);
        });

        it("should compile cross-period AM/PM indicators without compression if time bounds differ", () => {
            const crossPeriodSlot = {
                ...baseSlot,
                startTime: "11:00", // AM
                endTime: "13:30",   // PM
            };
            const sessionWithCrossSlot = { ...baseSession, confirmedSlot: crossPeriodSlot };

            render(
                <ConnectCard
                    name="Alice Dev"
                    person={basePerson}
                    session={sessionWithCrossSlot}
                    onDashboardClick={mockOnDashboardClick}
                />
            );

            // Verify both AM and PM parts are explicit
            expect(
                screen.getByText("Wednesday, Jul 15, 2026 · 11:00 AM – 1:30 PM")
            ).toBeInTheDocument();
        });

        it("should handle boundary values for hours like midnight and noon correctly", () => {
            const borderSlot = {
                ...baseSlot,
                startTime: "00:30", // Midnight hour fallback
                endTime: "12:00",   // Noon hour transition
            };

            render(
                <ConnectCard
                    name="Alice Dev"
                    person={basePerson}
                    session={{ ...baseSession, confirmedSlot: borderSlot }}
                    onDashboardClick={mockOnDashboardClick}
                />
            );

            expect(
                screen.getByText("Wednesday, Jul 15, 2026 · 12:30 AM – 12:00 PM")
            ).toBeInTheDocument();
        });
    });

    describe("Rendering Completed States (isCompleted = true)", () => {
        it("should swap badges, call-to-actions, and tokens release configurations structurally", () => {
            render(
                <ConnectCard
                    name="Bob Builder"
                    person={basePerson}
                    session={baseSession}
                    onDashboardClick={mockOnDashboardClick}
                    isCompleted={true}
                />
            );

            expect(screen.getByText("Bob Builder")).toBeInTheDocument();
            expect(screen.getByText("Completed")).toBeInTheDocument();
            expect(screen.getByText("500 tokens released")).toBeInTheDocument();
            expect(screen.getByText("Completed Jul 15, 2026")).toBeInTheDocument();

            const ctaButton = screen.getByRole("button", { name: /View Session & Notes/i });
            expect(ctaButton).toBeInTheDocument();
        });
    });

    describe("Avatar Branch & Gradient Logic Coverage", () => {
        it("should render profile image markup when photo string parameters exist", () => {
            render(
                <ConnectCard
                    name="Alice Dev"
                    person={basePerson}
                    onDashboardClick={mockOnDashboardClick}
                />
            );

            const avatarImg = screen.getByAltText("Alice Dev");
            expect(avatarImg).toBeInTheDocument();
            expect(avatarImg).toHaveAttribute("src", "https://example.com/avatar.jpg");
        });

        it("should fall back deterministically to text-based initials and gradient classes if picture is missing", () => {
            const personWithNoPic = { ...basePerson, profilePicture: null };

            // Test with first fallback name matching code point modulo paths
            const { rerender } = render(
                <ConnectCard
                    name="Charlie Dev" // 'C'.codePointAt(0) = 67 % 5 = 2 -> violet/emerald index bounds
                    person={personWithNoPic}
                    onDashboardClick={mockOnDashboardClick}
                />
            );

            expect(screen.queryByAltText("Charlie Dev")).not.toBeInTheDocument();
            expect(screen.getByText("CD")).toBeInTheDocument();

            // Retest with an altered name structure to hit a different deterministic gradient modulo map branch
            rerender(
                <ConnectCard
                    name="Zoe Dev"
                    person={personWithNoPic}
                    onDashboardClick={mockOnDashboardClick}
                />
            );
            expect(screen.getByText("ZD")).toBeInTheDocument();
        });
    });

    describe("Edge Cases & Missing Payload Fallbacks", () => {
        it("should pass coverage elegantly when structural parameters are completely absent or undefined", () => {
            render(
                <ConnectCard
                    name="Unknown User"
                    person={undefined}
                    session={undefined}
                    onDashboardClick={mockOnDashboardClick}
                />
            );

            expect(screen.getByText("Unknown User")).toBeInTheDocument();
            // Verify no subtitle role elements render
            expect(screen.queryByText("@")).not.toBeInTheDocument();
            // Ensure time-dependent nodes and tags match null fallbacks safely
            expect(screen.queryByText(/tokens/i)).not.toBeInTheDocument();
            expect(screen.queryByText(/started/i)).not.toBeInTheDocument();
        });

        it("should manage empty string parameters and partially missing person parameters cleanly", () => {
            const barePerson = {
                currentRole: "",
                company: "",
                skills: undefined,
                profilePicture: "",
            };

            const bareSession = {
                confirmedSlot: null,
                paidAt: null,
                completedAt: null,
                totalAmount: null,
            };

            render(
                <ConnectCard
                    name=""
                    person={barePerson}
                    session={bareSession}
                    onDashboardClick={mockOnDashboardClick}
                />
            );

            // Initials mapping for empty name string defaults safely
            expect(screen.queryByText("@")).not.toBeInTheDocument();
        });

        it("should construct role sub-strings accurately when currentRole is supplied without a company context", () => {
            const independentRolePerson = {
                ...basePerson,
                company: "",
            };

            render(
                <ConnectCard
                    name="Freelancer"
                    person={independentRolePerson}
                    onDashboardClick={mockOnDashboardClick}
                />
            );

            expect(screen.getByText("Software Engineer")).toBeInTheDocument();
            expect(screen.queryByText(/@/i)).not.toBeInTheDocument();
        });

        it("should construct company sub-strings accurately when company context is supplied without a structural role", () => {
            const positionlessPerson = {
                ...basePerson,
                currentRole: "",
            };

            render(
                <ConnectCard
                    name="Investor"
                    person={positionlessPerson}
                    onDashboardClick={mockOnDashboardClick}
                />
            );

            expect(screen.getByText("LeapMentor")).toBeInTheDocument();
            expect(screen.queryByText(/@/i)).not.toBeInTheDocument();
        });
    });
});