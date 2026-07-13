// src/test/pages/Login.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import Login from "../../pages/Login";
import axiosInstance from "../../utils/axiosInstance";
import { ssoFlags } from "../../utils/storage";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

const mockDispatch = vi.fn();
vi.mock("react-redux", () => ({
    useDispatch: () => mockDispatch,
}));

vi.mock("../../store/slices/authSlice", () => ({
    setUser: (payload) => ({ type: "auth/setUser", payload }),
}));

vi.mock("../../utils/axiosInstance", () => ({
    default: { post: vi.fn() },
}));

vi.mock("../../utils/storage", () => ({
    ssoFlags: { set: vi.fn(), clear: vi.fn() },
}));

const mockSignOut = vi.fn();
const mockAuthenticateWithRedirect = vi.fn();
let mockClerkLoaded = true;
vi.mock("@clerk/clerk-react", () => ({
    useSignIn: () => ({
        signIn: { authenticateWithRedirect: mockAuthenticateWithRedirect },
        isLoaded: mockClerkLoaded,
    }),
    useClerk: () => ({ signOut: mockSignOut }),
}));

// Capture the callbacks Login passes into useGoogleAuth so tests can
// trigger onSuccess/onError/onLoadingChange directly, the same way the
// real Google button click flow would.
let googleAuthCallbacks;
vi.mock("../../hooks/useGoogleAuth", () => ({
    default: (opts) => {
        googleAuthCallbacks = opts;
    },
}));

describe("Login", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mockNavigate.mockReset();
        mockDispatch.mockReset();
        mockSignOut.mockReset();
        mockAuthenticateWithRedirect.mockReset();
        ssoFlags.set.mockReset();
        ssoFlags.clear.mockReset();
        axiosInstance.post.mockReset();
        mockClerkLoaded = true;
        googleAuthCallbacks = undefined;
    });

    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it("renders the login form", () => {
        render(<Login />);
        expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
        expect(screen.getByLabelText("Email")).toBeInTheDocument();
        expect(screen.getByLabelText("Password")).toBeInTheDocument();
        expect(screen.getByText("Continue with LinkedIn")).toBeInTheDocument();
        expect(screen.getByText("Continue with Apple")).toBeInTheDocument();
    });

    it("updates form fields on change", () => {
        render(<Login />);
        fireEvent.change(screen.getByLabelText("Email"), {
            target: { name: "email", value: "jane@x.com" },
        });
        fireEvent.change(screen.getByLabelText("Password"), {
            target: { name: "password", value: "secret" },
        });
        expect(screen.getByLabelText("Email")).toHaveValue("jane@x.com");
        expect(screen.getByLabelText("Password")).toHaveValue("secret");
    });

    it("submits, dispatches setUser, shows a success banner, and redirects a mentor+mentee to /dashboard/mentor", async () => {
        axiosInstance.post.mockResolvedValueOnce({
            data: {
                accessToken: "tok123",
                user: { roles: ["mentor", "mentee"] },
            },
        });
        render(<Login />);

        fireEvent.change(screen.getByLabelText("Email"), {
            target: { name: "email", value: "  jane@x.com  " },
        });
        fireEvent.change(screen.getByLabelText("Password"), {
            target: { name: "password", value: "secret" },
        });
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Login" }));
        });

        expect(axiosInstance.post).toHaveBeenCalledWith("/auth/login", {
            email: "jane@x.com",
            password: "secret",
        });
        expect(mockDispatch).toHaveBeenCalledWith({
            type: "auth/setUser",
            payload: { token: "tok123", user: { roles: ["mentor", "mentee"] } },
        });
        expect(screen.getByText("Login successful! Redirecting...")).toBeInTheDocument();
        expect(screen.getByText("Login successful! Redirecting...")).toHaveClass("bg-green-50");

        act(() => {
            vi.advanceTimersByTime(800);
        });
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/mentor");
    });

    it("redirects a mentor-only user to /dashboard/mentor", async () => {
        axiosInstance.post.mockResolvedValueOnce({
            data: { accessToken: "tok", user: { roles: ["mentor"] } },
        });
        render(<Login />);
        fireEvent.change(screen.getByLabelText("Email"), { target: { name: "email", value: "a@b.com" } });
        fireEvent.change(screen.getByLabelText("Password"), { target: { name: "password", value: "pw" } });
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Login" }));
        });
        act(() => vi.advanceTimersByTime(800));
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/mentor");
    });

    it("redirects a mentee-only (or roleless) user to /dashboard/mentee", async () => {
        axiosInstance.post.mockResolvedValueOnce({
            data: { accessToken: "tok", user: { roles: ["mentee"] } },
        });
        render(<Login />);
        fireEvent.change(screen.getByLabelText("Email"), { target: { name: "email", value: "a@b.com" } });
        fireEvent.change(screen.getByLabelText("Password"), { target: { name: "password", value: "pw" } });
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Login" }));
        });
        act(() => vi.advanceTimersByTime(800));
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/mentee");
    });

    it("does not dispatch setUser when the response has no accessToken", async () => {
        axiosInstance.post.mockResolvedValueOnce({ data: { user: { roles: [] } } });
        render(<Login />);
        fireEvent.change(screen.getByLabelText("Email"), { target: { name: "email", value: "a@b.com" } });
        fireEvent.change(screen.getByLabelText("Password"), { target: { name: "password", value: "pw" } });
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Login" }));
        });
        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it("shows the server's error message and a red banner on failed login", async () => {
        axiosInstance.post.mockRejectedValueOnce({
            response: { data: { message: "Invalid credentials" } },
        });
        render(<Login />);
        fireEvent.change(screen.getByLabelText("Email"), { target: { name: "email", value: "a@b.com" } });
        fireEvent.change(screen.getByLabelText("Password"), { target: { name: "password", value: "wrong" } });
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Login" }));
        });

        const banner = screen.getByText("Invalid credentials");
        expect(banner).toBeInTheDocument();
        expect(banner).toHaveClass("bg-red-50");
    });

    it("falls back to err.message, then to the generic 'Invalid credentials' text", async () => {
        axiosInstance.post.mockRejectedValueOnce(new Error("network down"));
        render(<Login />);
        fireEvent.change(screen.getByLabelText("Email"), { target: { name: "email", value: "a@b.com" } });
        fireEvent.change(screen.getByLabelText("Password"), { target: { name: "password", value: "pw" } });
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Login" }));
        });
        expect(screen.getByText("network down")).toBeInTheDocument();

        axiosInstance.post.mockRejectedValueOnce({});
        await act(async () => {
            fireEvent.click(screen.getByRole("button", { name: "Login" }));
        });
        expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });

    it("disables the submit button and shows 'Logging in...' while the request is pending", async () => {
        let resolvePost;
        axiosInstance.post.mockReturnValueOnce(
            new Promise((resolve) => {
                resolvePost = resolve;
            }),
        );
        render(<Login />);
        fireEvent.change(screen.getByLabelText("Email"), { target: { name: "email", value: "a@b.com" } });
        fireEvent.change(screen.getByLabelText("Password"), { target: { name: "password", value: "pw" } });

        act(() => {
            fireEvent.click(screen.getByRole("button", { name: "Login" }));
        });
        expect(screen.getByRole("button", { name: "Logging in..." })).toBeDisabled();

        await act(async () => {
            resolvePost({ data: {} });
        });
        expect(screen.getByRole("button", { name: "Login" })).not.toBeDisabled();
    });

    it("navigates to /register/mentee when the Register link is clicked", () => {
        render(<Login />);
        fireEvent.click(screen.getByText("Register"));
        expect(mockNavigate).toHaveBeenCalledWith("/register/mentee");
    });

    it("Clerk SSO: does nothing when Clerk hasn't loaded yet", async () => {
        mockClerkLoaded = false;
        render(<Login />);
        await act(async () => {
            fireEvent.click(screen.getByText("Continue with LinkedIn"));
        });
        expect(mockSignOut).not.toHaveBeenCalled();
    });

    it("Clerk SSO: LinkedIn flow signs out, sets the SSO flag, and redirects through Clerk", async () => {
        mockSignOut.mockResolvedValueOnce(undefined);
        mockAuthenticateWithRedirect.mockResolvedValueOnce(undefined);
        render(<Login />);

        await act(async () => {
            fireEvent.click(screen.getByText("Continue with LinkedIn"));
        });

        expect(mockSignOut).toHaveBeenCalledWith({ redirectUrl: globalThis.location.href });
        expect(ssoFlags.set).toHaveBeenCalledWith("existing", true);
        expect(mockAuthenticateWithRedirect).toHaveBeenCalledWith(
            expect.objectContaining({ strategy: "oauth_linkedin_oidc" }),
        );
    });

    it("Clerk SSO: Apple flow uses the oauth_apple strategy", async () => {
        mockSignOut.mockResolvedValueOnce(undefined);
        mockAuthenticateWithRedirect.mockResolvedValueOnce(undefined);
        render(<Login />);

        await act(async () => {
            fireEvent.click(screen.getByText("Continue with Apple"));
        });

        expect(mockAuthenticateWithRedirect).toHaveBeenCalledWith(
            expect.objectContaining({ strategy: "oauth_apple" }),
        );
    });

    it("Clerk SSO: clears the SSO flag and shows an error banner on failure", async () => {
        mockSignOut.mockRejectedValueOnce(new Error("Clerk unavailable"));
        render(<Login />);

        await act(async () => {
            fireEvent.click(screen.getByText("Continue with LinkedIn"));
        });

        expect(ssoFlags.clear).toHaveBeenCalled();
        const banner = screen.getByText("Clerk unavailable");
        expect(banner).toBeInTheDocument();
        expect(banner).toHaveClass("bg-red-50");
    });

    it("Clerk SSO: falls back to the generic 'SSO failed. Try again.' message", async () => {
        mockSignOut.mockRejectedValueOnce({});
        render(<Login />);

        await act(async () => {
            fireEvent.click(screen.getByText("Continue with LinkedIn"));
        });

        expect(screen.getByText("SSO failed. Try again.")).toBeInTheDocument();
    });

    it("Google auth onSuccess: shows a success banner and redirects by role after 700ms", async () => {
        render(<Login />);
        expect(googleAuthCallbacks).toBeDefined();

        act(() => {
            googleAuthCallbacks.onSuccess({ user: { roles: ["mentor"] } });
        });
        expect(
            screen.getByText("Google login successful! Redirecting..."),
        ).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(700);
        });
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/mentor");
    });

    it("Google auth onSuccess: defaults to an empty roles array when the payload omits it", async () => {
        render(<Login />);
        act(() => {
            googleAuthCallbacks.onSuccess({});
        });
        act(() => {
            vi.advanceTimersByTime(700);
        });
        expect(mockNavigate).toHaveBeenCalledWith("/dashboard/mentee");
    });

    it("Google auth onError: shows the error banner", () => {
        render(<Login />);
        act(() => {
            googleAuthCallbacks.onError("Google popup closed");
        });
        const banner = screen.getByText("Google popup closed");
        expect(banner).toBeInTheDocument();
        expect(banner).toHaveClass("bg-red-50");
    });

    it("Google auth onLoadingChange: dims the Google button container while loading", () => {
        render(<Login />);
        act(() => {
            googleAuthCallbacks.onLoadingChange(true);
        });
        expect(screen.getByRole("button", { name: "Logging in..." })).toBeInTheDocument();

        act(() => {
            googleAuthCallbacks.onLoadingChange(false);
        });
        expect(screen.getByRole("button", { name: "Login" })).toBeInTheDocument();
    });
});