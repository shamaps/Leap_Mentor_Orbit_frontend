// components/mentee/dashboard/__tests__/HomeTab.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useMenteeHomeData } from "../../../../hooks/useMenteeHomeData";
import { useLeapPointsRequest } from "../../../../hooks/useLeapPointsRequest";
import HomeTab from "../../../../components/mentee/dashboard/HomeTab";

vi.mock("react-redux", () => ({
    useSelector: vi.fn(),
}));
vi.mock("react-router-dom", () => ({
    useNavigate: vi.fn(),
}));
vi.mock("../../../../store/selectors", () => ({
    selectMenteeProfile: vi.fn((state) => state),
}));
vi.mock("../../../../hooks/useMenteeHomeData", () => ({
    useMenteeHomeData: vi.fn(),
}));
vi.mock("../../../../hooks/useLeapPointsRequest", () => ({
    useLeapPointsRequest: vi.fn(),
}));
vi.mock("../../../../components/mentee/dashboard/findMentors/MentorProfileModal", () => ({
    default: ({ mentor, onClose }) => (
        <div data-testid="mentor-modal">
            <p>{mentor.user?.name}</p>
            <button onClick={onClose}>close-modal</button>
        </div>
    ),
}));
vi.mock("../../../../components/LeapBuddy", () => ({
    default: () => <div data-testid="leap-buddy">LeapBuddy</div>,
}));
vi.mock("@/components/common/MentorCardSkeleton", () => ({
    default: () => <div data-testid="mentor-skeleton" />,
}));
vi.mock("@/components/common/StatusBadge", () => ({
    default: ({ status }) => <span data-testid="status-badge">{status}</span>,
}));

const baseHomeData = {
    mentors: [],
    loadingMentors: false,
    sessions: [],
    loadingSessions: false,
    balance: 1000,
    loadingWallet: false,
};

const baseLeapPointsRequest = {
    requestStatus: "idle",
    checking: false,
    handleUpgradeRequest: vi.fn(),
};

describe("HomeTab", () => {
    const navigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        useNavigate.mockReturnValue(navigate);
        useMenteeHomeData.mockReturnValue({ ...baseHomeData });
        useLeapPointsRequest.mockReturnValue({ ...baseLeapPointsRequest });
    });

    const setSelector = (overrides = {}) => {
        useSelector.mockReturnValue({
            user: { name: "Shama Kausar", isFirstLogin: false },
            profile: {},
            ...overrides,
        });
    };

    it("greets a returning user and falls back to 'there' when no name exists", () => {
        setSelector({ user: undefined });
        render(<HomeTab />);
        expect(screen.getByText("Welcome , there! 👋")).toBeInTheDocument();
    });

    it("shows the first-login welcome variant for first-time users", () => {
        setSelector({ user: { name: "Shama Kausar", isFirstLogin: true } });
        render(<HomeTab />);
        expect(screen.getByText("Welcome, Shama! 👋")).toBeInTheDocument();
    });

    it("shows the returning-user welcome variant", () => {
        setSelector({ user: { name: "Shama Kausar", isFirstLogin: false } });
        render(<HomeTab />);
        expect(screen.getByText("Welcome , Shama! 👋")).toBeInTheDocument();
    });

    it("shows the no-sessions summary copy when there are no active sessions", () => {
        setSelector();
        render(<HomeTab />);
        expect(
            screen.getByText("No active sessions yet. Find a mentor to get started!"),
        ).toBeInTheDocument();
    });

    it("shows singular session summary copy for exactly one session", () => {
        setSelector();
        useMenteeHomeData.mockReturnValue({
            ...baseHomeData,
            sessions: [{ _id: "s1", status: "accepted", mentor: { name: "Mentor A" } }],
        });
        render(<HomeTab />);
        expect(screen.getByText("You have 1 active session.")).toBeInTheDocument();
    });

    it("shows plural session summary copy for multiple sessions", () => {
        setSelector();
        useMenteeHomeData.mockReturnValue({
            ...baseHomeData,
            sessions: [
                { _id: "s1", status: "accepted", mentor: { name: "Mentor A" } },
                { _id: "s2", status: "ongoing", mentor: { name: "Mentor B" } },
            ],
        });
        render(<HomeTab />);
        expect(screen.getByText("You have 2 active sessions.")).toBeInTheDocument();
    });

    it("renders the profile completion ring when completion is below 100%", () => {
        setSelector({ profile: { bio: "hi" } });
        render(<HomeTab />);
        expect(screen.getByText("Profile")).toBeInTheDocument();
    });

    it("hides the profile completion ring when the profile is 100% complete", () => {
        setSelector({
            profile: {
                profilePicture: "p.jpg",
                bio: "bio",
                currentRole: "SDE",
                company: "Nineleaps",
                industry: "Tech",
                yearsOfExperience: 2,
                communicationPreferences: ["email"],
                languages: ["English"],
                linkedInUrl: "https://linkedin.com/in/x",
                portfolioUrl: "https://x.dev",
            },
        });
        render(<HomeTab />);
        expect(screen.queryByText("Profile")).not.toBeInTheDocument();
    });

    it("navigates to the findMentors tab when the completion ring is clicked", () => {
        setSelector({ profile: {} });
        const dispatchSpy = vi.spyOn(globalThis, "dispatchEvent");
        render(<HomeTab />);

        fireEvent.click(screen.getByText("Profile").closest("button"));

        expect(dispatchSpy).toHaveBeenCalled();
        const event = dispatchSpy.mock.calls.at(-1)[0];
        expect(event.type).toBe("setDashboardTab");
        expect(event.detail).toBe("profile");
    });

    it("shows the skill-based recommendation subtitle when profile has skills", () => {
        setSelector({ profile: { skills: ["React", "Node"] } });
        render(<HomeTab />);
        expect(screen.getByText("React")).toBeInTheDocument();
        expect(screen.getByText(/Based on your skill/)).toBeInTheDocument();
    });

    it("omits the skill-based subtitle when the profile has no skills", () => {
        setSelector({ profile: {} });
        render(<HomeTab />);
        expect(screen.queryByText(/Based on your skill/)).not.toBeInTheDocument();
    });

    it("renders mentor skeletons while mentors are loading", () => {
        setSelector();
        useMenteeHomeData.mockReturnValue({ ...baseHomeData, loadingMentors: true });
        render(<HomeTab />);
        expect(screen.getAllByTestId("mentor-skeleton")).toHaveLength(4);
    });

    it("renders an empty-mentors message and browses to findMentors on click", () => {
        setSelector();
        const dispatchSpy = vi.spyOn(globalThis, "dispatchEvent");
        render(<HomeTab />);

        expect(screen.getByText("No mentor recommendations yet.")).toBeInTheDocument();
        fireEvent.click(screen.getByText("Browse all mentors →"));

        const event = dispatchSpy.mock.calls.at(-1)[0];
        expect(event.type).toBe("setDashboardTab");
        expect(event.detail).toBe("findMentors");
    });

    it("renders mentor cards and opens the mentor modal on click", () => {
        setSelector();
        useMenteeHomeData.mockReturnValue({
            ...baseHomeData,
            mentors: [
                {
                    id: "m1",
                    user: { name: "Alex Ray" },
                    currentRole: "Senior Engineer",
                    company: "Acme",
                    skills: ["React", "Node", "SQL"],
                    avgRating: 4.567,
                },
            ],
        });
        render(<HomeTab />);

        expect(screen.getByText("Alex Ray")).toBeInTheDocument();
        expect(screen.getByText("REACT")).toBeInTheDocument();
        expect(screen.getByText("⭐ 4.6")).toBeInTheDocument();

        fireEvent.click(screen.getByText("Alex Ray").closest("button"));
        expect(screen.getByTestId("mentor-modal")).toBeInTheDocument();

        fireEvent.click(screen.getByText("close-modal"));
        expect(screen.queryByTestId("mentor-modal")).not.toBeInTheDocument();
    });

    it("renders a mentor card without a picture, company, or skills gracefully", () => {
        setSelector();
        useMenteeHomeData.mockReturnValue({
            ...baseHomeData,
            mentors: [{ userId: "m2", currentRole: "Designer" }],
        });
        render(<HomeTab />);
        expect(screen.getByText("Mentor")).toBeInTheDocument();
    });

    it("renders session skeletons while sessions are loading", () => {
        setSelector();
        useMenteeHomeData.mockReturnValue({ ...baseHomeData, loadingSessions: true });
        const { container } = render(<HomeTab />);
        expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    });

    it("renders an empty-sessions message when there are no sessions", () => {
        setSelector();
        render(<HomeTab />);
        expect(screen.getByText("No active sessions yet.")).toBeInTheDocument();
    });

    it("renders an ongoing session card with a working Open Dashboard button", () => {
        setSelector();
        useMenteeHomeData.mockReturnValue({
            ...baseHomeData,
            sessions: [
                {
                    _id: "sess1",
                    status: "ongoing",
                    mentor: { name: "Mentor Ongoing" },
                    confirmedSlot: {
                        date: "2026-08-01",
                        startTime: "09:00",
                        endTime: "10:00",
                    },
                },
            ],
        });
        render(<HomeTab />);

        expect(screen.getByText("Mentor Ongoing")).toBeInTheDocument();
        fireEvent.click(screen.getByText("Open Dashboard →"));
        expect(navigate).toHaveBeenCalledWith("/shared-dashboard/sess1");
    });

    it("renders a non-ongoing session card without a join button", () => {
        setSelector();
        useMenteeHomeData.mockReturnValue({
            ...baseHomeData,
            sessions: [
                {
                    _id: "sess2",
                    status: "accepted",
                    mentor: { name: "Mentor Accepted" },
                    selectedSlots: [{ date: "2026-08-02", startTime: "14:00", endTime: "15:00" }],
                },
            ],
        });
        render(<HomeTab />);

        expect(screen.getByText("Mentor Accepted")).toBeInTheDocument();
        expect(screen.queryByText("Open Dashboard →")).not.toBeInTheDocument();
    });

    it("renders a session card with no slot data using fallback date/time text", () => {
        setSelector();
        useMenteeHomeData.mockReturnValue({
            ...baseHomeData,
            sessions: [{ _id: "sess3", status: "accepted", mentor: {} }],
        });
        render(<HomeTab />);
        expect(screen.getByText("Mentor")).toBeInTheDocument();
        expect(screen.getByText("Time TBD")).toBeInTheDocument();
    });

    it("shows a loading skeleton for the leap points balance", () => {
        setSelector();
        useMenteeHomeData.mockReturnValue({ ...baseHomeData, loadingWallet: true });
        const { container } = render(<HomeTab />);
        expect(container.querySelector(".animate-pulse")).toBeTruthy();
    });

    it("shows the numeric balance once the wallet has loaded", () => {
        setSelector();
        useMenteeHomeData.mockReturnValue({ ...baseHomeData, balance: 1200 });
        render(<HomeTab />);
        expect(screen.getByText("1,200")).toBeInTheDocument();
    });

    it("does not show the refill button when the balance is healthy", () => {
        setSelector();
        useMenteeHomeData.mockReturnValue({ ...baseHomeData, balance: 800 });
        render(<HomeTab />);
        expect(
            screen.queryByText("Request Leap Points Refill"),
        ).not.toBeInTheDocument();
    });

    it("shows a refill request button when balance is low and no request is in flight", () => {
        setSelector();
        useMenteeHomeData.mockReturnValue({ ...baseHomeData, balance: 100 });
        const handleUpgradeRequest = vi.fn();
        useLeapPointsRequest.mockReturnValue({
            ...baseLeapPointsRequest,
            handleUpgradeRequest,
        });
        render(<HomeTab />);

        const button = screen.getByText("Request Leap Points Refill");
        fireEvent.click(button);
        expect(handleUpgradeRequest).toHaveBeenCalled();
    });

    it("disables and relabels the refill button while a request is sending", () => {
        setSelector();
        useMenteeHomeData.mockReturnValue({ ...baseHomeData, balance: 100 });
        useLeapPointsRequest.mockReturnValue({
            ...baseLeapPointsRequest,
            requestStatus: "sending",
        });
        render(<HomeTab />);

        expect(screen.getByText("Sending request…")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /sending request/i })).toBeDisabled();
    });

    it("shows a pending-review message when a refill request is already pending", () => {
        setSelector();
        useMenteeHomeData.mockReturnValue({ ...baseHomeData, balance: 100 });
        useLeapPointsRequest.mockReturnValue({
            ...baseLeapPointsRequest,
            requestStatus: "pending",
        });
        render(<HomeTab />);

        expect(
            screen.getByText("Request sent — pending admin review"),
        ).toBeInTheDocument();
    });

    it("shows a pending-review message when the refill request status is 'sent'", () => {
        setSelector();
        useMenteeHomeData.mockReturnValue({ ...baseHomeData, balance: 100 });
        useLeapPointsRequest.mockReturnValue({
            ...baseLeapPointsRequest,
            requestStatus: "sent",
        });
        render(<HomeTab />);

        expect(
            screen.getByText("Request sent — pending admin review"),
        ).toBeInTheDocument();
    });

    it("shows an error message when the refill request failed", () => {
        setSelector();
        useMenteeHomeData.mockReturnValue({ ...baseHomeData, balance: 100 });
        useLeapPointsRequest.mockReturnValue({
            ...baseLeapPointsRequest,
            requestStatus: "error",
        });
        render(<HomeTab />);

        expect(
            screen.getByText("Something went wrong. Try again."),
        ).toBeInTheDocument();
    });

    it("shows the disabled 'refill available when balance runs out' state at a healthy balance", () => {
        setSelector();
        useMenteeHomeData.mockReturnValue({ ...baseHomeData, balance: 900 });
        render(<HomeTab />);

        const button = screen.getByText(/Refill available when balance runs out/);
        expect(button.closest("button")).toBeDisabled();
    });

    it("hides the wallet action row while checking request status", () => {
        setSelector();
        useMenteeHomeData.mockReturnValue({ ...baseHomeData, balance: 100 });
        useLeapPointsRequest.mockReturnValue({
            ...baseLeapPointsRequest,
            checking: true,
        });
        render(<HomeTab />);

        expect(
            screen.queryByText("Request Leap Points Refill"),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByText(/Refill available when balance runs out/),
        ).not.toBeInTheDocument();
    });

    it("always renders the LeapBuddy widget", () => {
        setSelector();
        render(<HomeTab />);
        expect(screen.getByTestId("leap-buddy")).toBeInTheDocument();
    });
});