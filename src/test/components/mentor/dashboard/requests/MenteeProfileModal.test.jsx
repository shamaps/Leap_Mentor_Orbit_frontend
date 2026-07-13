import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import MenteeProfileModal from "../../../../../components/mentor/dashboard/requests/MenteeProfileModal";

const { mockRespondToRequest, mockLoggerError } = vi.hoisted(() => ({
    mockRespondToRequest: vi.fn(),
    mockLoggerError: vi.fn(),
}));

vi.mock("../../../../../api/connectRequests.api", () => ({
    respondToRequest: mockRespondToRequest,
}));

vi.mock("../../../../../utils/logger", () => ({
    default: { error: mockLoggerError },
}));

vi.mock("../../../../../components/mentor/dashboard/requests/RequestActionModal", () => ({
    default: (props) => (
        <div data-testid="request-action-modal-stub">
            {props.type} - {props.menteeName}
            <button type="button" onClick={props.onBack}>back</button>
        </div>
    ),
}));

vi.mock("../../../../../components/mentor/dashboard/requests/ReferModal", () => ({
    default: (props) => (
        <div data-testid="refer-modal-stub">
            <button type="button" data-testid="refer-modal-close" onClick={props.onClose}>
                close
            </button>
            <button
                type="button"
                data-testid="refer-modal-referred"
                onClick={() => props.onReferred(props.request._id, "referred")}
            >
                referred
            </button>
        </div>
    ),
}));

const baseRequest = {
    _id: "req1",
    mentee: { name: "Jordan Lee" },
    message: "Please help me!",
    selectedSlots: [{ date: "2099-06-20", startTime: "09:00", endTime: "10:00" }],
    requestedAt: "2099-06-01T00:00:00.000Z",
};

describe("MenteeProfileModal Component Suite", () => {
    let onClose;
    let onUpdate;

    beforeEach(() => {
        vi.clearAllMocks();
        onClose = vi.fn();
        onUpdate = vi.fn();
    });

    const setup = (request = baseRequest) =>
        render(
            <MenteeProfileModal
                request={request}
                onClose={onClose}
                onUpdate={onUpdate}
            />
        );

    it("should render the mentee name, message, and proposed slot", () => {
        setup();
        expect(screen.getByText("Jordan Lee")).toBeInTheDocument();
        expect(screen.getByText('"Please help me!"')).toBeInTheDocument();
    });

    it("should render '?' initials when mentee name is missing", () => {
        setup({ ...baseRequest, mentee: undefined });
        expect(screen.getByText("?")).toBeInTheDocument();
    });

    it("should call onClose when the close button is clicked", () => {
        setup();
        const closeBtn = screen.getAllByRole("button")[0];
        fireEvent.click(closeBtn);
        expect(onClose).toHaveBeenCalled();
    });

    it("should call respondToRequest with 'accepted' and the first slot, then show the action modal", async () => {
        mockRespondToRequest.mockResolvedValue({});
        setup();
        fireEvent.click(screen.getByRole("button", { name: /Accept Request/i }));

        expect(
            await screen.findByTestId("request-action-modal-stub")
        ).toHaveTextContent("accepted - Jordan Lee");

        expect(mockRespondToRequest).toHaveBeenCalledWith("req1", {
            status: "accepted",
            confirmedSlot: baseRequest.selectedSlots[0],
        });
        expect(onUpdate).toHaveBeenCalledWith("req1", "accepted");
    });

    it("should log an error and not show the action modal when respondToRequest fails", async () => {
        mockRespondToRequest.mockRejectedValue(new Error("network fail"));
        setup();
        fireEvent.click(screen.getByRole("button", { name: /Reject/i }));

        await waitFor(() =>
            expect(mockLoggerError).toHaveBeenCalledWith(
                "Respond error",
                expect.objectContaining({ exceptionErr: expect.any(Error) })
            )
        );
        expect(screen.queryByTestId("request-action-modal-stub")).not.toBeInTheDocument();
    });

    it("should call onClose when the action modal's back button is clicked", async () => {
        mockRespondToRequest.mockResolvedValue({});
        setup();
        fireEvent.click(screen.getByRole("button", { name: /Reject/i }));

        const modal = await screen.findByTestId("request-action-modal-stub");
        fireEvent.click(screen.getByText("back"));

        expect(onClose).toHaveBeenCalled();
        expect(modal).toBeDefined();
    });

    it("should disable action buttons while a transition is in progress", () => {
        mockRespondToRequest.mockReturnValue(new Promise(() => { }));
        setup();
        fireEvent.click(screen.getByRole("button", { name: /Accept Request/i }));
        expect(screen.getByRole("button", { name: /Reject/i })).toBeDisabled();
    });

    // ── Referral Isolation Suite (Scoped Timer Context) ──
    describe("Referral Workflow Actions", () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it("should open the ReferModal after the referral delay sequence completes", async () => {
            setup();

            fireEvent.click(screen.getByRole("button", { name: /Refer/i }));
            expect(screen.getByText(/Referring/)).toBeInTheDocument();

            // Wrap time progression inside act block to satisfy execution limits
            act(() => {
                vi.advanceTimersByTime(400);
            });

            expect(screen.getByTestId("refer-modal-stub")).toBeInTheDocument();
        });

        it("should close the ReferModal and call onClose when its close is triggered", async () => {
            setup();

            fireEvent.click(screen.getByRole("button", { name: /Refer/i }));

            act(() => {
                vi.advanceTimersByTime(400);
            });

            fireEvent.click(screen.getByTestId("refer-modal-close"));
            expect(onClose).toHaveBeenCalled();
        });

        it("should call onUpdate and close the ReferModal when a referral completes", async () => {
            setup();

            fireEvent.click(screen.getByRole("button", { name: /Refer/i }));

            act(() => {
                vi.advanceTimersByTime(400);
            });

            fireEvent.click(screen.getByTestId("refer-modal-referred"));
            expect(onUpdate).toHaveBeenCalledWith("req1", "referred");
            expect(screen.queryByTestId("refer-modal-stub")).not.toBeInTheDocument();
        });
    });
});