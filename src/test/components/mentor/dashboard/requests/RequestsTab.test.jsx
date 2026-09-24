// src/test/components/mentor/dashboard/requests/RequestsTab.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import RequestsTab from "../../../../../features/mentor/view/components/dashboard/requests/RequestsTab";

const { mockDispatch, mockUseSelector, mockFetchIncomingRequests, mockUpdateRequestStatus } = vi.hoisted(
    () => ({
        mockDispatch: vi.fn(),
        mockUseSelector: vi.fn(),
        mockFetchIncomingRequests: vi.fn((...args) => ({ type: "fetchIncomingRequests", args })),
        mockUpdateRequestStatus: vi.fn((...args) => ({ type: "updateRequestStatus", args })),
    }),
);

vi.mock("react-redux", () => ({
    useDispatch: () => mockDispatch,
    useSelector: mockUseSelector,
}));

vi.mock("../../../../../app/store/slices/connectRequestsSlice", () => ({
    fetchIncomingRequests: mockFetchIncomingRequests,
    updateRequestStatus: mockUpdateRequestStatus,
}));

vi.mock("../../../../../app/store/selectors", () => ({
    selectIncomingRequests: (s) => s.requests,
    selectConnectRequestsLoading: (s) => s.loading,
    selectConnectRequestsInitialLoad: (s) => s.initialLoad,
    selectConnectRequestsError: (s) => s.error,
}));

vi.mock("../../../../../features/mentor/view/components/dashboard/requests/RequestCard", () => ({
    default: (props) => (
        <div data-testid={`request-card-${props.request._id}`}>
            <button type="button" onClick={() => props.onViewProfile(props.request)}>
                view {props.request._id}
            </button>
        </div>
    ),
}));

vi.mock("../../../../../features/mentor/view/components/dashboard/requests/MenteeProfileModal", () => ({
    default: (props) => (
        <div data-testid="mentee-profile-modal-stub">
            <button type="button" data-testid="modal-close" onClick={props.onClose}>
                close
            </button>
            <button
                type="button"
                data-testid="modal-update"
                onClick={() => props.onUpdate(props.request._id, "accepted")}
            >
                update
            </button>
        </div>
    ),
}));

const makeRequest = (id, status) => ({ _id: id, status, mentee: { name: `Mentee ${id}` } });

describe("RequestsTab Component Suite", () => {
    let state;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        state = {
            requests: [
                makeRequest("r1", "pending"),
                makeRequest("r2", "accepted"),
                makeRequest("r3", "pending"),
            ],
            loading: false,
            initialLoad: false,
            error: null,
        };
        mockUseSelector.mockImplementation((selector) => selector(state));
        globalThis.__leapSocket = undefined;
    });

    afterEach(() => {
        vi.useRealTimers();
        globalThis.__leapSocket = undefined;
    });

    it("should show a loading state on initial load", () => {
        state.loading = true;
        state.initialLoad = true;
        render(<RequestsTab />);
        expect(screen.getByText("Loading requests...")).toBeInTheDocument();
    });

    it("should dispatch fetchIncomingRequests on mount when initialLoad is true", () => {
        state.initialLoad = true;
        render(<RequestsTab />);
        expect(mockFetchIncomingRequests).toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalled();
    });

    it("should not dispatch fetchIncomingRequests on mount when initialLoad is false", () => {
        state.initialLoad = false;
        render(<RequestsTab />);
        expect(mockFetchIncomingRequests).not.toHaveBeenCalled();
    });

    it("should render the total request count badge", () => {
        render(<RequestsTab />);
        expect(screen.getByText("3 total")).toBeInTheDocument();
    });

    it("should render an ErrorState when error is present", () => {
        state.error = "Something went wrong";
        render(<RequestsTab />);
        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    it("should render all request cards under the 'All Requests' tab by default", () => {
        render(<RequestsTab />);
        expect(screen.getByTestId("request-card-r1")).toBeInTheDocument();
        expect(screen.getByTestId("request-card-r2")).toBeInTheDocument();
        expect(screen.getByTestId("request-card-r3")).toBeInTheDocument();
    });

    it("should filter request cards when a tab other than 'All Requests' is selected", () => {
        render(<RequestsTab />);
        fireEvent.click(screen.getByRole("button", { name: /Pending/ }));
        expect(screen.getByTestId("request-card-r1")).toBeInTheDocument();
        expect(screen.getByTestId("request-card-r3")).toBeInTheDocument();
        expect(screen.queryByTestId("request-card-r2")).not.toBeInTheDocument();
    });

    it("should show tab counts for statuses with at least one request", () => {
        render(<RequestsTab />);
        const pendingTab = screen.getByRole("button", { name: /Pending/ });
        expect(pendingTab).toHaveTextContent("2");
    });

    it("should show an empty state with a tab-specific submessage when a filtered tab has no requests", () => {
        render(<RequestsTab />);
        fireEvent.click(screen.getByRole("button", { name: /Rejected/ }));
        expect(screen.getByText("No rejected requests")).toBeInTheDocument();
    });

    it("should show the pending-specific empty submessage", () => {
        state.requests = [];
        render(<RequestsTab />);
        fireEvent.click(screen.getByRole("button", { name: /Pending/ }));
        expect(
            screen.getByText("You'll see new requests here when mentees reach out."),
        ).toBeInTheDocument();
    });

    it("should open the MenteeProfileModal when a request card's view profile is triggered", () => {
        render(<RequestsTab />);
        fireEvent.click(screen.getByText("view r1"));
        expect(screen.getByTestId("mentee-profile-modal-stub")).toBeInTheDocument();
    });

    it("should close the MenteeProfileModal when its onClose fires", () => {
        render(<RequestsTab />);
        fireEvent.click(screen.getByText("view r1"));
        fireEvent.click(screen.getByTestId("modal-close"));
        expect(screen.queryByTestId("mentee-profile-modal-stub")).not.toBeInTheDocument();
    });

    it("should dispatch updateRequestStatus and close the modal when onUpdate fires", () => {
        render(<RequestsTab />);
        fireEvent.click(screen.getByText("view r1"));
        fireEvent.click(screen.getByTestId("modal-update"));

        expect(mockUpdateRequestStatus).toHaveBeenCalledWith({ id: "r1", newStatus: "accepted" });
        expect(screen.queryByTestId("mentee-profile-modal-stub")).not.toBeInTheDocument();
    });

    it("should attach a socket listener once globalThis.__leapSocket becomes connected and dispatch fetchIncomingRequests on the event", async () => {
        const on = vi.fn();
        const off = vi.fn();
        render(<RequestsTab />);

        // socket not yet connected — nothing attached
        expect(on).not.toHaveBeenCalled();

        globalThis.__leapSocket = { connected: true, on, off };
        await vi.advanceTimersByTimeAsync(200);

        expect(on).toHaveBeenCalledWith("request_status_changed", expect.any(Function));
        const handler = on.mock.calls[0][1];
        mockFetchIncomingRequests.mockClear();
        handler();
        expect(mockFetchIncomingRequests).toHaveBeenCalled();
    });

    it("should remove the socket listener on unmount", async () => {
        const on = vi.fn();
        const off = vi.fn();
        globalThis.__leapSocket = { connected: true, on, off };
        const { unmount } = render(<RequestsTab />);
        await vi.advanceTimersByTimeAsync(200);

        unmount();
        expect(off).toHaveBeenCalledWith("request_status_changed", expect.any(Function));
    });
});