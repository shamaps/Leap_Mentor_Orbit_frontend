// src/test/pages/SSOSync.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useDispatch, useSelector } from "react-redux";
import SSOSync from "../../pages/SSOSync";
import axiosInstance from "../../utils/axiosInstance";
import { ssoFlags } from "../../utils/storage";

vi.mock("react-router-dom", () => ({
    useNavigate: vi.fn(),
}));

vi.mock("@clerk/clerk-react", () => ({
    useAuth: vi.fn(),
}));

vi.mock("react-redux", () => ({
    useDispatch: vi.fn(),
    useSelector: vi.fn(),
}));

vi.mock("../../store/slices/authSlice", () => ({
    setUser: vi.fn((payload) => ({ type: "auth/setUser", payload })),
}));

vi.mock("../../utils/axiosInstance", () => ({
    default: { post: vi.fn() },
}));

vi.mock("../../utils/storage", () => ({
    ssoFlags: { get: vi.fn(), clear: vi.fn() },
}));

describe("SSOSync", () => {
    let mockNavigate;
    let mockDispatch;
    let mockGetToken;

    const setSelectorState = ({ token = null, user = null } = {}) => {
        useSelector.mockImplementation((selector) =>
            selector({ auth: { token, user } }),
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockNavigate = vi.fn();
        mockDispatch = vi.fn();
        mockGetToken = vi.fn();

        useNavigate.mockReturnValue(mockNavigate);
        useDispatch.mockReturnValue(mockDispatch);
        setSelectorState();
        ssoFlags.get.mockReturnValue(null);

        useAuth.mockReturnValue({
            getToken: mockGetToken,
            isLoaded: true,
            isSignedIn: true,
        });
    });

    it("renders the 'Completing sign in...' state by default", () => {
        useAuth.mockReturnValue({ getToken: mockGetToken, isLoaded: false, isSignedIn: false });
        render(<SSOSync />);
        expect(screen.getByText("Completing sign in...")).toBeInTheDocument();
    });

    it("does nothing while Clerk has not loaded yet", async () => {
        useAuth.mockReturnValue({ getToken: mockGetToken, isLoaded: false, isSignedIn: false });
        render(<SSOSync />);
        expect(mockNavigate).not.toHaveBeenCalled();
        expect(axiosInstance.post).not.toHaveBeenCalled();
    });

    it("redirects mentor via Redux state when Clerk says the user isn't signed in", async () => {
        setSelectorState({ token: "tok", user: { roles: ["mentor"] } });
        useAuth.mockReturnValue({ getToken: mockGetToken, isLoaded: true, isSignedIn: false });
        render(<SSOSync />);
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/dashboard/mentor", { replace: true });
        });
    });

    it("redirects mentee via Redux state when Clerk says the user isn't signed in and has no mentor role", async () => {
        setSelectorState({ token: "tok", user: { roles: ["mentee"] } });
        useAuth.mockReturnValue({ getToken: mockGetToken, isLoaded: true, isSignedIn: false });
        render(<SSOSync />);
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/dashboard/mentee", { replace: true });
        });
    });

    it("redirects to /login?error=sso_failed when there is no Redux token and Clerk isn't signed in", async () => {
        useAuth.mockReturnValue({ getToken: mockGetToken, isLoaded: true, isSignedIn: false });
        render(<SSOSync />);
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/login?error=sso_failed", { replace: true });
        });
    });

    it("shows an auth-failed error when getToken resolves to a falsy value", async () => {
        mockGetToken.mockResolvedValueOnce(null);
        render(<SSOSync />);
        await waitFor(() => {
            expect(
                screen.getByText("Authentication failed. Please try logging in again."),
            ).toBeInTheDocument();
        });
        expect(axiosInstance.post).not.toHaveBeenCalled();
    });

    it("syncs with the backend, dispatches setUser, clears sso flags, and redirects a new user to onboarding using the flow role", async () => {
        mockGetToken.mockResolvedValueOnce("clerk-token");
        ssoFlags.get.mockReturnValue({ role: "mentee", termsAccepted: true });
        axiosInstance.post.mockResolvedValueOnce({
            data: {
                accessToken: "tok123",
                user: { roles: ["mentee"] },
                isNewUser: true,
            },
        });

        render(<SSOSync />);

        await waitFor(() => {
            expect(axiosInstance.post).toHaveBeenCalledWith("/auth/clerk-sso", {
                clerkToken: "clerk-token",
                roles: ["mentee"],
                termsAccepted: true,
            });
        });

        expect(mockDispatch).toHaveBeenCalledWith({
            type: "auth/setUser",
            payload: { token: "tok123", user: { roles: ["mentee"] } },
        });
        expect(ssoFlags.clear).toHaveBeenCalled();
        expect(mockNavigate).toHaveBeenCalledWith("/onboarding/mentee", { replace: true });
    });

    it("redirects a new user to onboarding using the returned user's first role when flow role is 'existing'", async () => {
        mockGetToken.mockResolvedValueOnce("clerk-token");
        ssoFlags.get.mockReturnValue({ role: "existing", termsAccepted: true });
        axiosInstance.post.mockResolvedValueOnce({
            data: {
                accessToken: "tok123",
                user: { roles: ["mentor"] },
                isNewUser: true,
            },
        });

        render(<SSOSync />);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/onboarding/mentor", { replace: true });
        });
        expect(axiosInstance.post).toHaveBeenCalledWith("/auth/clerk-sso", {
            clerkToken: "clerk-token",
            roles: undefined,
            termsAccepted: true,
        });
    });

    it("redirects an existing mentee user directly to their dashboard via the intended role", async () => {
        mockGetToken.mockResolvedValueOnce("clerk-token");
        ssoFlags.get.mockReturnValue({ role: "mentee", termsAccepted: false });
        axiosInstance.post.mockResolvedValueOnce({
            data: { accessToken: "tok", user: { roles: ["mentee", "mentor"] }, isNewUser: false },
        });

        render(<SSOSync />);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/dashboard/mentee", { replace: true });
        });
    });

    it("redirects an existing mentor user directly to their dashboard via the intended role", async () => {
        mockGetToken.mockResolvedValueOnce("clerk-token");
        ssoFlags.get.mockReturnValue({ role: "mentor", termsAccepted: false });
        axiosInstance.post.mockResolvedValueOnce({
            data: { accessToken: "tok", user: { roles: ["mentor"] }, isNewUser: false },
        });

        render(<SSOSync />);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/dashboard/mentor", { replace: true });
        });
    });

    it("falls back to redirectByRole (mentor) for an existing user with no intended role and mentor in their roles", async () => {
        mockGetToken.mockResolvedValueOnce("clerk-token");
        ssoFlags.get.mockReturnValue(null);
        axiosInstance.post.mockResolvedValueOnce({
            data: { accessToken: "tok", user: { roles: ["mentor", "mentee"] }, isNewUser: false },
        });

        render(<SSOSync />);

        // redirectByRole() (the final fallback branch) calls navigate() with no options.
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/dashboard/mentor");
        });
        expect(axiosInstance.post).toHaveBeenCalledWith("/auth/clerk-sso", {
            clerkToken: "clerk-token",
            roles: undefined,
            termsAccepted: false,
        });
    });

    it("falls back to redirectByRole (mentee) for an existing user with no intended role and no mentor role", async () => {
        mockGetToken.mockResolvedValueOnce("clerk-token");
        ssoFlags.get.mockReturnValue(null);
        axiosInstance.post.mockResolvedValueOnce({
            data: { accessToken: "tok", user: { roles: [] }, isNewUser: false },
        });

        render(<SSOSync />);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/dashboard/mentee");
        });
    });

    it("falls back to redirectByRole with an empty roles array when resData.user is missing", async () => {
        mockGetToken.mockResolvedValueOnce("clerk-token");
        ssoFlags.get.mockReturnValue(null);
        axiosInstance.post.mockResolvedValueOnce({
            data: { isNewUser: false },
        });

        render(<SSOSync />);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/dashboard/mentee");
        });
        // No accessToken/token in the response, so setUser must not be dispatched.
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it("does not dispatch setUser when neither accessToken nor token is returned", async () => {
        mockGetToken.mockResolvedValueOnce("clerk-token");
        ssoFlags.get.mockReturnValue(null);
        axiosInstance.post.mockResolvedValueOnce({
            data: { user: { roles: ["mentee"] }, isNewUser: false },
        });

        render(<SSOSync />);

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalled();
        });
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it("dispatches setUser using the legacy `token` field when accessToken is absent", async () => {
        mockGetToken.mockResolvedValueOnce("clerk-token");
        ssoFlags.get.mockReturnValue(null);
        axiosInstance.post.mockResolvedValueOnce({
            data: { token: "legacy-tok", user: { roles: ["mentee"] }, isNewUser: false },
        });

        render(<SSOSync />);

        await waitFor(() => {
            expect(mockDispatch).toHaveBeenCalledWith({
                type: "auth/setUser",
                payload: { token: "legacy-tok", user: { roles: ["mentee"] } },
            });
        });
    });

    it("dispatches setUser with user: null when the response has an accessToken but no user", async () => {
        mockGetToken.mockResolvedValueOnce("clerk-token");
        ssoFlags.get.mockReturnValue(null);
        axiosInstance.post.mockResolvedValueOnce({
            data: { accessToken: "tok-no-user", isNewUser: false },
        });

        render(<SSOSync />);

        await waitFor(() => {
            expect(mockDispatch).toHaveBeenCalledWith({
                type: "auth/setUser",
                payload: { token: "tok-no-user", user: null },
            });
        });
    });

    it("shows the server error message and clears sso flags when the sync request fails", async () => {
        mockGetToken.mockResolvedValueOnce("clerk-token");
        ssoFlags.get.mockReturnValue(null);
        axiosInstance.post.mockRejectedValueOnce({
            response: { data: { message: "Backend rejected SSO" } },
        });

        render(<SSOSync />);

        await waitFor(() => {
            expect(screen.getByText("Backend rejected SSO")).toBeInTheDocument();
        });
        expect(ssoFlags.clear).toHaveBeenCalled();
    });

    it("falls back to err.message, then the generic 'SSO failed' message on failure", async () => {
        mockGetToken.mockResolvedValueOnce("clerk-token");
        ssoFlags.get.mockReturnValue(null);
        axiosInstance.post.mockRejectedValueOnce(new Error("network down"));

        render(<SSOSync />);

        await waitFor(() => {
            expect(screen.getByText("network down")).toBeInTheDocument();
        });
    });

    it("falls back to the generic 'SSO failed' message when the error carries no message at all", async () => {
        mockGetToken.mockResolvedValueOnce("clerk-token");
        ssoFlags.get.mockReturnValue(null);
        axiosInstance.post.mockRejectedValueOnce({});

        render(<SSOSync />);

        await waitFor(() => {
            expect(screen.getByText("SSO failed")).toBeInTheDocument();
        });
    });

    it("navigates back to /login when 'Back to login' is clicked after an error", async () => {
        mockGetToken.mockResolvedValueOnce(null);
        render(<SSOSync />);

        await waitFor(() => {
            expect(
                screen.getByText("Authentication failed. Please try logging in again."),
            ).toBeInTheDocument();
        });

        await act(async () => {
            fireEvent.click(screen.getByText("Back to login"));
        });
        expect(mockNavigate).toHaveBeenCalledWith("/login");
    });
});