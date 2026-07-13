import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import MentorHomeTab from "../../../../components/mentor/dashboard/MentorHomeTab";
import axiosInstance from "../../../../utils/axiosInstance";

// ── 1. DIRECTLY MOCK SELECTORS FILE FOR TOTAL STATE CONTROL ──
let mockSelectorsData;

const resetMockSelectors = () => {
    mockSelectorsData = {
        mentorProfile: {
            user: { name: "Alex Code" },
            profile: {
                currentRole: "Engineer",
                bio: "Mentoring line",
                avgRating: 4.8,
                totalSessions: 12,
            },
        },
        activeSessions: [
            {
                _id: "session-1",
                status: "ongoing",
                mentee: { name: "Jane Doe" },
                confirmedSlot: { date: "2026-08-15", startTime: "10:00", endTime: "11:00" },
            },
            {
                _id: "session-2",
                status: "accepted",
                mentee: { name: "Mark Smith" },
                selectedSlots: [{ date: "2026-08-16", startTime: "14:00", endTime: "15:00" }],
            }
        ],
        pendingCount: 2,
        completedCount: 5,
        loadingSessions: false,
        initialLoad: false,
    };
};

vi.mock("../../../../store/selectors", () => ({
    selectMentorProfile: () => mockSelectorsData.mentorProfile,
    selectActiveSessions: () => mockSelectorsData.activeSessions,
    selectPendingCount: () => mockSelectorsData.pendingCount,
    selectCompletedCount: () => mockSelectorsData.completedCount,
    selectConnectRequestsLoading: () => mockSelectorsData.loadingSessions,
    selectConnectRequestsInitialLoad: () => mockSelectorsData.initialLoad,
}));

// Mock standard react-redux hooks basics safely
vi.mock("react-redux", () => ({
    useDispatch: () => vi.fn(),
    useSelector: (selectorFn) => selectorFn(),
}));

// Mock dependent UI child layouts
vi.mock("../../../../components/LeapBuddy", () => ({ default: () => <div data-testid="leap-buddy" /> }));
vi.mock("@/components/common/StatCard", () => ({ default: ({ label, value }) => <div data-testid="stat-card">{label}: {value}</div> }));

// Mock Axios Network Framework Instantiations
vi.mock("../../../../utils/axiosInstance", () => ({
    default: { get: vi.fn() },
}));

describe("MentorHomeTab Component Suite", () => {
    let mockSetActiveTab;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSetActiveTab = vi.fn();
        resetMockSelectors();

        axiosInstance.get.mockResolvedValue({
            data: { totalEarnings: 500, sessionsThisMonth: 3, pendingPayout: 100, walletBalance: 250 },
        });
    });

    const renderWithContexts = async (ui) => {
        let result;
        await act(async () => {
            result = render(<BrowserRouter>{ui}</BrowserRouter>);
        });
        return result;
    };

    it("should render welcome headings and process dynamic metric calculations correctly", async () => {
        await renderWithContexts(<MentorHomeTab setActiveTab={mockSetActiveTab} />);

        expect(screen.getByText("Welcome, Alex! 👋")).toBeInTheDocument();
        expect(screen.getByText("You have 2 active sessions.")).toBeInTheDocument();
        expect(screen.getByTestId("leap-buddy")).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText("Avg Rating: 4.8")).toBeInTheDocument();
        });
    });

    it("should display a collection of session cards and link into shared layout paths cleanly", async () => {
        await renderWithContexts(<MentorHomeTab setActiveTab={mockSetActiveTab} />);

        expect(screen.getByText("Jane Doe")).toBeInTheDocument();
        expect(screen.getByText("Mark Smith")).toBeInTheDocument();
        expect(screen.getByText("Awaiting Payment")).toBeInTheDocument();

        const openDashboardBtn = screen.getByRole("button", { name: "Open Dashboard" });
        await act(async () => {
            fireEvent.click(openDashboardBtn);
        });

        expect(window.location.pathname).toContain("/shared-dashboard/session-1");
    });

    it("should present fallbacks gracefully when session histories evaluate completely dry", async () => {
        mockSelectorsData.activeSessions = [];
        await renderWithContexts(<MentorHomeTab setActiveTab={mockSetActiveTab} />);

        expect(screen.getByText("No active sessions")).toBeInTheDocument();
    });

    it("should unlock badge allocations relative to specific structural metric benchmarks", async () => {
        await renderWithContexts(<MentorHomeTab setActiveTab={mockSetActiveTab} />);

        const topRatedBadge = screen.getByText("Top Rated").closest(".relative");
        expect(topRatedBadge).not.toHaveClass("grayscale");

        const expertBadge = screen.getByText("Expert Guide").closest(".relative");
        expect(expertBadge).toHaveClass("grayscale");

        await waitFor(() => expect(axiosInstance.get).toHaveBeenCalled());
    });

    it("should display empty placeholders safely when reporting endpoint failures", async () => {
        axiosInstance.get.mockRejectedValueOnce(new Error("API Timeout Exception"));
        await renderWithContexts(<MentorHomeTab setActiveTab={mockSetActiveTab} />);

        await waitFor(() => {
            const targetLabel = screen.getByText("Total Earnings");
            expect(targetLabel).toBeInTheDocument();
            const earningsRow = targetLabel.closest("div").parentElement;
            expect(earningsRow).toHaveTextContent("0.00");
        });
    });

    it("should trigger shell navigation transfers if the incomplete radial circle wrapper is triggered", async () => {
        mockSelectorsData.mentorProfile.profile.currentRole = "";
        await renderWithContexts(<MentorHomeTab setActiveTab={mockSetActiveTab} />);

        const profileRedirectBtn = screen.getByRole("button", { name: /Profile/i });
        await act(async () => {
            fireEvent.click(profileRedirectBtn);
        });

        expect(mockSetActiveTab).toHaveBeenCalledWith("profile");
        await waitFor(() => expect(axiosInstance.get).toHaveBeenCalled());
    });
});