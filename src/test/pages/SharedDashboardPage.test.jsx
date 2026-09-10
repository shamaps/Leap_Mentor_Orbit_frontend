// src/test/pages/SharedDashboardPage.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import SharedDashboardPage from "../../features/shared-dashboard/view/pages/SharedDashboardPage";
import { fetchSharedConnect } from "../../app/store/slices/sharedConnectSlice";

const mockNavigate = vi.fn();
let mockConnectRequestId = "507f1f77bcf86cd799439011"; // valid 24-char hex ObjectId
let mockSearchParams = new URLSearchParams();
const mockSetSearchParams = vi.fn();

vi.mock("react-router-dom", () => ({
    useParams: () => ({ connectRequestId: mockConnectRequestId }),
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

const mockDispatch = vi.fn();
let mockState;
vi.mock("react-redux", () => ({
    useSelector: (selectorFn) => selectorFn(mockState),
    useDispatch: () => mockDispatch,
}));

vi.mock("../../app/store/slices/sharedConnectSlice", () => {
    const fetchSharedConnect = vi.fn((id) => ({
        type: "sharedConnect/fetchSharedConnect",
        meta: { arg: id },
    }));
    fetchSharedConnect.rejected = { match: vi.fn(() => false) };
    return { fetchSharedConnect };
});

vi.mock("../../shared/marketing/NotFound", () => ({
    default: () => <div>not-found-page</div>,
}));

vi.mock("../../features/shared-dashboard/view/components/SharedDashboardLayout", () => ({
    default: ({ onAllComplete, activeTab, setActiveTab }) => (
        <div>
            <span>layout-active-tab:{activeTab}</span>
            <button onClick={onAllComplete}>trigger-all-complete</button>
            <button onClick={() => setActiveTab("chat")}>trigger-set-tab</button>
        </div>
    ),
}));

const makeState = (overrides = {}) => ({
    auth: { token: "tok123", isBootstrapping: false },
    sharedConnect: { connect: null, loading: false, error: null },
    ...overrides,
});

describe("SharedDashboardPage", () => {
    beforeEach(() => {
        mockConnectRequestId = "507f1f77bcf86cd799439011";
        mockSearchParams = new URLSearchParams();
        mockNavigate.mockReset();
        mockDispatch.mockReset();
        mockSetSearchParams.mockReset();
        fetchSharedConnect.mockClear();
        fetchSharedConnect.rejected.match.mockReset();
        fetchSharedConnect.rejected.match.mockReturnValue(false);
        mockDispatch.mockReturnValue(Promise.resolve({ type: "fulfilled" }));
        mockState = makeState();
    });

    it("renders NotFound when connectRequestId is not a valid 24-char hex ObjectId", () => {
        mockConnectRequestId = "not-a-valid-id";
        render(<SharedDashboardPage />);
        expect(screen.getByText("not-found-page")).toBeInTheDocument();
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it("does not fetch and renders NotFound for an empty connectRequestId", () => {
        mockConnectRequestId = "";
        render(<SharedDashboardPage />);
        expect(screen.getByText("not-found-page")).toBeInTheDocument();
    });

    it("dispatches fetchSharedConnect with the id when a token is present", async () => {
        await act(async () => {
            render(<SharedDashboardPage />);
        });
        expect(fetchSharedConnect).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
        expect(mockDispatch).toHaveBeenCalled();
    });

    it("navigates to /login when the fetch rejects with reason='unauthorized'", async () => {
        fetchSharedConnect.rejected.match.mockReturnValue(true);
        mockDispatch.mockReturnValue(
            Promise.resolve({ payload: { reason: "unauthorized" } }),
        );
        await act(async () => {
            render(<SharedDashboardPage />);
        });
        expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    it("navigates back (-1) when the fetch rejects with reason='forbidden'", async () => {
        fetchSharedConnect.rejected.match.mockReturnValue(true);
        mockDispatch.mockReturnValue(
            Promise.resolve({ payload: { reason: "forbidden" } }),
        );
        await act(async () => {
            render(<SharedDashboardPage />);
        });
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it("does not navigate when the fetch rejects with an unrecognized reason", async () => {
        fetchSharedConnect.rejected.match.mockReturnValue(true);
        mockDispatch.mockReturnValue(
            Promise.resolve({ payload: { reason: "server_error" } }),
        );
        await act(async () => {
            render(<SharedDashboardPage />);
        });
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("does not navigate when the fetch rejects with no payload at all", async () => {
        fetchSharedConnect.rejected.match.mockReturnValue(true);
        mockDispatch.mockReturnValue(Promise.resolve({}));
        await act(async () => {
            render(<SharedDashboardPage />);
        });
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("does not navigate on a fulfilled fetch", async () => {
        fetchSharedConnect.rejected.match.mockReturnValue(false);
        mockDispatch.mockReturnValue(Promise.resolve({ type: "fulfilled" }));
        await act(async () => {
            render(<SharedDashboardPage />);
        });
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("skips fetching and redirects to /login when there is no token and bootstrapping has finished", () => {
        mockState = makeState({ auth: { token: null, isBootstrapping: false } });
        render(<SharedDashboardPage />);
        expect(fetchSharedConnect).not.toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    it("waits (no fetch, no redirect) while there is no token and bootstrapping is still in progress", () => {
        mockState = makeState({ auth: { token: null, isBootstrapping: true } });
        render(<SharedDashboardPage />);
        expect(fetchSharedConnect).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("fetches once a token appears after bootstrapping resolves", async () => {
        mockState = makeState({ auth: { token: null, isBootstrapping: true } });
        const { rerender } = render(<SharedDashboardPage />);
        expect(fetchSharedConnect).not.toHaveBeenCalled();

        mockState = makeState({ auth: { token: "new-token", isBootstrapping: false } });
        await act(async () => {
            rerender(<SharedDashboardPage />);
        });
        expect(fetchSharedConnect).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
    });

    it("shows the loading state and nothing else while sharedConnect.loading is true", () => {
        mockState = makeState({ sharedConnect: { connect: null, loading: true, error: null } });
        render(<SharedDashboardPage />);
        expect(screen.getByText("Loading session…")).toBeInTheDocument();
    });

    it("shows the error banner with a working 'Go back' button when sharedConnect.error is set", () => {
        mockState = makeState({
            sharedConnect: { connect: null, loading: false, error: "Connect not found" },
        });
        render(<SharedDashboardPage />);
        expect(screen.getByText("Connect not found")).toBeInTheDocument();

        act(() => {
            screen.getByText("← Go back").click();
        });
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    it("renders nothing (null) once loading/error have cleared but connect is still falsy", () => {
        mockState = makeState({ sharedConnect: { connect: null, loading: false, error: null } });
        const { container } = render(<SharedDashboardPage />);
        expect(container).toBeEmptyDOMElement();
    });

    it("renders SharedDashboardLayout with activeTab='overview' when the URL has no valid tab", async () => {
        mockState = makeState({ sharedConnect: { connect: { _id: "c1" }, loading: false, error: null } });
        await act(async () => {
            render(<SharedDashboardPage />);
        });
        expect(screen.getByText("layout-active-tab:overview")).toBeInTheDocument();
    });

    it("falls back to 'overview' when the URL has an unrecognized tab value", async () => {
        mockSearchParams = new URLSearchParams({ tab: "billing" });
        mockState = makeState({ sharedConnect: { connect: { _id: "c1" }, loading: false, error: null } });
        await act(async () => {
            render(<SharedDashboardPage />);
        });
        expect(screen.getByText("layout-active-tab:overview")).toBeInTheDocument();
    });

    it("uses the tab from the URL when it is one of the valid tabs", async () => {
        mockSearchParams = new URLSearchParams({ tab: "goals" });
        mockState = makeState({ sharedConnect: { connect: { _id: "c1" }, loading: false, error: null } });
        await act(async () => {
            render(<SharedDashboardPage />);
        });
        expect(screen.getByText("layout-active-tab:goals")).toBeInTheDocument();
    });

    it("setActiveTab (passed to the layout) calls setSearchParams with replace:true", async () => {
        mockState = makeState({ sharedConnect: { connect: { _id: "c1" }, loading: false, error: null } });
        await act(async () => {
            render(<SharedDashboardPage />);
        });

        act(() => {
            screen.getByText("trigger-set-tab").click();
        });
        expect(mockSetSearchParams).toHaveBeenCalledWith({ tab: "chat" }, { replace: true });
    });

    it("onAllComplete (passed to the layout) re-dispatches fetchSharedConnect", async () => {
        mockState = makeState({ sharedConnect: { connect: { _id: "c1" }, loading: false, error: null } });
        await act(async () => {
            render(<SharedDashboardPage />);
        });
        fetchSharedConnect.mockClear();

        await act(async () => {
            screen.getByText("trigger-all-complete").click();
        });
        expect(fetchSharedConnect).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
    });
});