// src/test/pages/SSOCallback.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import SSOCallback, { SyncWithBackend } from "../../pages/SSOCallback";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

const mockDispatch = vi.fn();
vi.mock("react-redux", () => ({
    useDispatch: () => mockDispatch,
}));

vi.mock("../../store/slices/authSlice", () => ({
    setUser: vi.fn((payload) => ({ type: "auth/setUser", payload })),
}));

let mockGetToken;
vi.mock("@clerk/clerk-react", () => ({
    useAuth: () => ({ getToken: mockGetToken }),
    AuthenticateWithRedirectCallback: (props) => (
        <div data-testid="clerk-redirect-callback">
            {JSON.stringify({
                signInFallbackRedirectUrl: props.signInFallbackRedirectUrl,
                signUpFallbackRedirectUrl: props.signUpFallbackRedirectUrl,
            })}
        </div>
    ),
}));

let mockPost;
vi.mock("../../utils/axiosInstance", () => ({
    default: { post: (...args) => mockPost(...args) },
    injectStore: vi.fn(),
}));
vi.mock("../../utils/logger", () => ({
    default: { debug: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

const mockSsoGet = vi.fn();
const mockSsoClear = vi.fn();
vi.mock("../../utils/storage", () => ({
    ssoFlags: {
        get: (...args) => mockSsoGet(...args),
        clear: (...args) => mockSsoClear(...args),
    },
}));

describe("SSOCallback", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetToken = vi.fn().mockResolvedValue("clerk-token-123");
        mockSsoGet.mockReturnValue(null);
    });

    it("renders AuthenticateWithRedirectCallback with correct fallback URLs", () => {
        render(<SSOCallback />);
        const el = screen.getByTestId("clerk-redirect-callback");
        expect(el).toHaveTextContent("/sso-callback-sync");
        expect(JSON.parse(el.textContent)).toEqual({
            signInFallbackRedirectUrl: "/sso-callback-sync",
            signUpFallbackRedirectUrl: "/sso-callback-sync",
        });
    });
});

describe("SyncWithBackend", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetToken = vi.fn().mockResolvedValue("clerk-token-123");
        mockSsoGet.mockReturnValue(null);
    });

    it("shows the 'Completing sign in...' message initially", () => {
        mockPost = vi.fn(() => new Promise(() => { })); // never resolves
        render(<SyncWithBackend />);
        expect(screen.getByText("Completing sign in...")).toBeInTheDocument();
    });

    it("syncs with backend using role from ssoFlags when present", async () => {
        mockSsoGet.mockReturnValue({ role: "mentor", termsAccepted: true });
        mockPost = vi.fn().mockResolvedValue({
            data: { isNewUser: false, user: { roles: ["mentor"] }, accessToken: "tok" },
        });
        render(<SyncWithBackend />);

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith("/auth/clerk-sso", {
                clerkToken: "clerk-token-123",
                roles: ["mentor"],
                termsAccepted: true,
            });
        });
    });

    it("sends roles: undefined and termsAccepted: true when flow role is 'existing'", async () => {
        mockSsoGet.mockReturnValue({ role: "existing", termsAccepted: false });
        mockPost = vi.fn().mockResolvedValue({
            data: { isNewUser: false, user: { roles: ["mentee"] }, accessToken: "tok" },
        });
        render(<SyncWithBackend />);

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith("/auth/clerk-sso", {
                clerkToken: "clerk-token-123",
                roles: undefined,
                termsAccepted: true,
            });
        });
    });

    it("defaults role to null and termsAccepted to false when ssoFlags.get() returns null", async () => {
        mockSsoGet.mockReturnValue(null);
        mockPost = vi.fn().mockResolvedValue({
            data: { isNewUser: false, user: { roles: ["mentee"] }, accessToken: "tok" },
        });
        render(<SyncWithBackend />);

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith("/auth/clerk-sso", {
                clerkToken: "clerk-token-123",
                roles: undefined,
                termsAccepted: false,
            });
        });
    });

    it("dispatches setUser when accessToken is present in response", async () => {
        mockPost = vi.fn().mockResolvedValue({
            data: { isNewUser: false, user: { roles: ["mentee"] }, accessToken: "tok-abc" },
        });
        render(<SyncWithBackend />);

        await waitFor(() => {
            expect(mockDispatch).toHaveBeenCalledWith({
                type: "auth/setUser",
                payload: { token: "tok-abc", user: { roles: ["mentee"] } },
            });
        });
    });

    it("dispatches setUser using token field when accessToken is absent", async () => {
        mockPost = vi.fn().mockResolvedValue({
            data: { isNewUser: false, user: { roles: ["mentee"] }, token: "legacy-tok" },
        });
        render(<SyncWithBackend />);

        await waitFor(() => {
            expect(mockDispatch).toHaveBeenCalledWith({
                type: "auth/setUser",
                payload: { token: "legacy-tok", user: { roles: ["mentee"] } },
            });
        });
    });

    it("does not dispatch setUser when neither accessToken nor token is present", async () => {
        mockPost = vi.fn().mockResolvedValue({
            data: { isNewUser: false, user: { roles: ["mentee"] } },
        });
        render(<SyncWithBackend />);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalled();
        });
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it("clears ssoFlags after a successful sync", async () => {
        mockPost = vi.fn().mockResolvedValue({
            data: { isNewUser: false, user: { roles: ["mentee"] }, accessToken: "tok" },
        });
        render(<SyncWithBackend />);

        await waitFor(() => {
            expect(mockSsoClear).toHaveBeenCalled();
        });
    });

    it("navigates to onboarding with flow role when isNewUser is true and role is set", async () => {
        mockSsoGet.mockReturnValue({ role: "mentor", termsAccepted: true });
        mockPost = vi.fn().mockResolvedValue({
            data: { isNewUser: true, user: { roles: ["mentor"] }, accessToken: "tok" },
        });
        render(<SyncWithBackend />);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/onboarding/mentor");
        });
    });

    it("navigates to onboarding using user.roles[0] when isNewUser is true and flow role is 'existing'", async () => {
        mockSsoGet.mockReturnValue({ role: "existing", termsAccepted: true });
        mockPost = vi.fn().mockResolvedValue({
            data: { isNewUser: true, user: { roles: ["mentee"] }, accessToken: "tok" },
        });
        render(<SyncWithBackend />);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/onboarding/mentee");
        });
    });

    it("navigates to onboarding using user.roles[0] when isNewUser is true and flow role is null", async () => {
        mockSsoGet.mockReturnValue(null);
        mockPost = vi.fn().mockResolvedValue({
            data: { isNewUser: true, user: { roles: ["mentor"] }, accessToken: "tok" },
        });
        render(<SyncWithBackend />);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/onboarding/mentor");
        });
    });

    it("redirects to mentor dashboard when isNewUser is false and role includes mentor", async () => {
        mockPost = vi.fn().mockResolvedValue({
            data: { isNewUser: false, user: { roles: ["mentor"] }, accessToken: "tok" },
        });
        render(<SyncWithBackend />);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/dashboard/mentor");
        });
    });

    it("redirects to mentee dashboard when isNewUser is false and role does not include mentor", async () => {
        mockPost = vi.fn().mockResolvedValue({
            data: { isNewUser: false, user: { roles: ["mentee"] }, accessToken: "tok" },
        });
        render(<SyncWithBackend />);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/dashboard/mentee");
        });
    });

    it("redirects to mentee dashboard when isNewUser is false and user.roles is missing", async () => {
        mockPost = vi.fn().mockResolvedValue({
            data: { isNewUser: false, user: null, accessToken: "tok" },
        });
        render(<SyncWithBackend />);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/dashboard/mentee");
        });
    });

    it("shows the error message and clears ssoFlags when backend sync fails with a response message", async () => {
        mockPost = vi.fn().mockRejectedValue({
            response: { status: 400, data: { message: "Sync failed on server." } },
        });
        render(<SyncWithBackend />);

        await waitFor(() => {
            expect(screen.getByText("Sync failed on server.")).toBeInTheDocument();
        });
        expect(mockSsoClear).toHaveBeenCalled();
        expect(screen.getByText("Back to login")).toBeInTheDocument();
    });

    it("falls back to err.message when response has no message", async () => {
        mockPost = vi.fn().mockRejectedValue(new Error("Network Error"));
        render(<SyncWithBackend />);

        await waitFor(() => {
            expect(screen.getByText("Network Error")).toBeInTheDocument();
        });
    });

    it("falls back to generic 'SSO failed' message when error has no message at all", async () => {
        mockPost = vi.fn().mockRejectedValue({});
        render(<SyncWithBackend />);

        await waitFor(() => {
            expect(screen.getByText("SSO failed")).toBeInTheDocument();
        });
    });

    it("navigates to /login when 'Back to login' is clicked after an error", async () => {
        mockPost = vi.fn().mockRejectedValue(new Error("Boom"));
        render(<SyncWithBackend />);

        await waitFor(() => {
            expect(screen.getByText("Back to login")).toBeInTheDocument();
        });

        await act(async () => {
            fireEvent.click(screen.getByText("Back to login"));
        });
        expect(mockNavigate).toHaveBeenCalledWith("/login");
    });

    it("logs debug info with token presence and resolved role during sync", async () => {
        const loggerModule = await import("../../utils/logger");
        mockSsoGet.mockReturnValue({ role: "mentee", termsAccepted: true });
        mockPost = vi.fn().mockResolvedValue({
            data: { isNewUser: false, user: { roles: ["mentee"] }, accessToken: "tok" },
        });
        render(<SyncWithBackend />);

        await waitFor(() => {
            expect(loggerModule.default.debug).toHaveBeenCalledWith(
                "Clerk token retrieved",
                { hasToken: true },
            );
            expect(loggerModule.default.debug).toHaveBeenCalledWith(
                "SSO role resolved",
                { role: "mentee" },
            );
        });
    });
});