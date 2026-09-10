// src/test/components/shared-dashboard/tabs/SharedHomeTab.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import SharedHomeTab from "../../../../features/shared-dashboard/view/components/tabs/SharedHomeTab";

let mockState;
vi.mock("react-redux", () => ({
    useSelector: (selectorFn) => selectorFn(mockState),
}));

vi.mock("../../../../features/shared-dashboard/view/components/tabs/ReportModal", () => ({
    default: ({ onClose, onSuccess }) => (
        <div>
            <span>report-modal</span>
            <button onClick={onClose}>report-modal-close</button>
            <button onClick={onSuccess}>report-modal-success</button>
        </div>
    ),
}));

vi.mock("../../../../features/shared-dashboard/view/components/tabs/ReportSuccessModal", () => ({
    default: ({ onBack }) => (
        <div>
            <span>report-success-modal</span>
            <button onClick={onBack}>report-success-back</button>
        </div>
    ),
}));

const makeConnect = (overrides = {}) => ({
    mentor: { name: "John Doe" },
    mentee: { name: "Jane Smith" },
    mentorProfile: null,
    menteeProfile: null,
    confirmedSlot: null,
    totalAmount: null,
    paidAt: null,
    status: "active",
    ...overrides,
});

describe("SharedHomeTab", () => {
    beforeEach(() => {
        mockState = { sharedConnect: { connect: null } };
    });

    it("shows a loading state when connect is not available", () => {
        render(<SharedHomeTab />);
        expect(screen.getByText("Loading session details...")).toBeInTheDocument();
    });

    it("renders participant initials when no profile picture is present", () => {
        mockState = { sharedConnect: { connect: makeConnect() } };
        render(<SharedHomeTab />);
        expect(screen.getByText("JD")).toBeInTheDocument();
        expect(screen.getByText("JS")).toBeInTheDocument();
    });

    it("falls back to default names when mentor/mentee are missing", () => {
        mockState = {
            sharedConnect: {
                connect: makeConnect({ mentor: null, mentee: null }),
            },
        };
        render(<SharedHomeTab />);
        expect(screen.getAllByText("Mentor").length).toBeGreaterThan(1);
        expect(screen.getAllByText("Mentee").length).toBeGreaterThan(1);
    });

    it("renders profile picture, title/company, and skills when present", () => {
        mockState = {
            sharedConnect: {
                connect: makeConnect({
                    mentorProfile: {
                        profilePicture: "pic.jpg",
                        currentRole: "Engineer",
                        company: "Acme",
                        skills: ["React", "Node", "SQL", "Extra"],
                    },
                }),
            },
        };
        render(<SharedHomeTab />);
        expect(screen.getByAltText("John Doe")).toBeInTheDocument();
        expect(screen.getByText(/Engineer/)).toBeInTheDocument();
        expect(screen.getByText(/Acme/)).toBeInTheDocument();
        expect(screen.getByText("React")).toBeInTheDocument();
        expect(screen.getByText("Node")).toBeInTheDocument();
        expect(screen.getByText("SQL")).toBeInTheDocument();
        expect(screen.queryByText("Extra")).not.toBeInTheDocument();
    });

    it("renders only currentRole when company is missing", () => {
        mockState = {
            sharedConnect: {
                connect: makeConnect({
                    mentorProfile: { currentRole: "Engineer", company: "" },
                }),
            },
        };
        render(<SharedHomeTab />);
        expect(screen.getByText("Engineer")).toBeInTheDocument();
    });

    it("renders multiple slots with a checkmark for completed sessions", () => {
        mockState = {
            sharedConnect: {
                connect: makeConnect(),
            },
        };
        render(
            <SharedHomeTab
                slots={[
                    { date: "2026-08-01", startTime: "09:00", endTime: "10:00", status: "completed" },
                    { date: "2026-08-02", startTime: "14:30", endTime: "15:30", status: "pending" },
                ]}
            />,
        );
        expect(screen.getByText("Session 1 ✓")).toBeInTheDocument();
        expect(screen.getByText("Session 2")).toBeInTheDocument();
    });

    it("renders confirmedSlot when slots array is empty", () => {
        mockState = {
            sharedConnect: {
                connect: makeConnect({
                    confirmedSlot: { date: "2026-08-01", startTime: "09:00", endTime: "10:00" },
                }),
            },
        };
        render(<SharedHomeTab slots={[]} />);
        expect(screen.getByText("Confirmed Session")).toBeInTheDocument();
    });

    it("renders nothing session-detail-wise when there are no slots and no confirmedSlot", () => {
        mockState = { sharedConnect: { connect: makeConnect() } };
        render(<SharedHomeTab />);
        expect(screen.queryByText("Confirmed Session")).not.toBeInTheDocument();
    });

    it("formats PM times correctly in a slot", () => {
        mockState = { sharedConnect: { connect: makeConnect() } };
        render(
            <SharedHomeTab
                slots={[{ date: "2026-08-01", startTime: "13:00", endTime: "23:00", status: "pending" }]}
            />,
        );
        expect(screen.getByText(/1:00 PM/)).toBeInTheDocument();
        expect(screen.getByText(/11:00 PM/)).toBeInTheDocument();
    });

    it("shows the escrow amount when totalAmount is set", () => {
        mockState = {
            sharedConnect: { connect: makeConnect({ totalAmount: 500 }) },
        };
        render(<SharedHomeTab />);
        expect(screen.getByText("500 tokens secured")).toBeInTheDocument();
    });

    it("does not show the escrow row when totalAmount is null", () => {
        mockState = { sharedConnect: { connect: makeConnect() } };
        render(<SharedHomeTab />);
        expect(screen.queryByText("Tokens in Escrow")).not.toBeInTheDocument();
    });

    it("shows the booked-on date when paidAt is set", () => {
        mockState = {
            sharedConnect: {
                connect: makeConnect({ paidAt: "2026-07-01T00:00:00Z" }),
            },
        };
        render(<SharedHomeTab />);
        expect(screen.getByText("Session Booked On")).toBeInTheDocument();
    });

    it("does not show booked-on date when paidAt is null", () => {
        mockState = { sharedConnect: { connect: makeConnect() } };
        render(<SharedHomeTab />);
        expect(screen.queryByText("Session Booked On")).not.toBeInTheDocument();
    });

    it("shows the Notes quick action when the session is not completed", () => {
        mockState = { sharedConnect: { connect: makeConnect({ status: "active" }) } };
        render(<SharedHomeTab />);
        expect(screen.getByText("Notes")).toBeInTheDocument();
    });

    it("hides the Notes quick action when the session is completed", () => {
        mockState = { sharedConnect: { connect: makeConnect({ status: "completed" }) } };
        render(<SharedHomeTab />);
        expect(screen.queryByText("Notes")).not.toBeInTheDocument();
    });

    it("calls onTabChange with 'chat' when Open Chat is clicked", () => {
        const onTabChange = vi.fn();
        mockState = { sharedConnect: { connect: makeConnect() } };
        render(<SharedHomeTab onTabChange={onTabChange} />);
        act(() => {
            screen.getByText("Open Chat").click();
        });
        expect(onTabChange).toHaveBeenCalledWith("chat");
    });

    it("calls onTabChange with 'goals' when Set Goals is clicked", () => {
        const onTabChange = vi.fn();
        mockState = { sharedConnect: { connect: makeConnect() } };
        render(<SharedHomeTab onTabChange={onTabChange} />);
        act(() => {
            screen.getByText("Set Goals").click();
        });
        expect(onTabChange).toHaveBeenCalledWith("goals");
    });

    it("calls onTabChange with 'notes' when Notes is clicked", () => {
        const onTabChange = vi.fn();
        mockState = { sharedConnect: { connect: makeConnect() } };
        render(<SharedHomeTab onTabChange={onTabChange} />);
        act(() => {
            screen.getByText("Notes").click();
        });
        expect(onTabChange).toHaveBeenCalledWith("notes");
    });

    it("does not throw when onTabChange is not provided (default no-op)", () => {
        mockState = { sharedConnect: { connect: makeConnect() } };
        render(<SharedHomeTab />);
        expect(() => {
            act(() => {
                screen.getByText("Open Chat").click();
            });
        }).not.toThrow();
    });

    it("opens the report modal when 'Report an issue' is clicked, and closes it", () => {
        mockState = { sharedConnect: { connect: makeConnect() } };
        render(<SharedHomeTab />);
        act(() => {
            screen.getByText("Report an issue").click();
        });
        expect(screen.getByText("report-modal")).toBeInTheDocument();
        act(() => {
            screen.getByText("report-modal-close").click();
        });
        expect(screen.queryByText("report-modal")).not.toBeInTheDocument();
    });

    it("shows the success modal after report success, then returns from it", () => {
        mockState = { sharedConnect: { connect: makeConnect() } };
        render(<SharedHomeTab />);
        act(() => {
            screen.getByText("Report an issue").click();
        });
        act(() => {
            screen.getByText("report-modal-success").click();
        });
        expect(screen.queryByText("report-modal")).not.toBeInTheDocument();
        expect(screen.getByText("report-success-modal")).toBeInTheDocument();
        act(() => {
            screen.getByText("report-success-back").click();
        });
        expect(screen.queryByText("report-success-modal")).not.toBeInTheDocument();
    });
});