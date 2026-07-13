import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "../../../components/auth/LoginForm";
import { HTTP_STATUS } from "../../../constants/httpStatus";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

const mockDispatch = vi.fn();
vi.mock("react-redux", () => ({
    useDispatch: () => mockDispatch,
}));

let mockLoginUserImpl;
vi.mock("../../../store/slices/authSlice", () => ({
    loginUser: Object.assign((...args) => mockLoginUserImpl(...args), {
        fulfilled: { match: (res) => res?.__type === "fulfilled" },
    }),
    setUser: vi.fn((payload) => ({ type: "auth/setUser", payload })),
}));

const mockSignOut = vi.fn(() => Promise.resolve());
const mockAuthenticateWithRedirect = vi.fn(() => Promise.resolve());
let mockClerkLoaded = true;
vi.mock("@clerk/clerk-react", () => ({
    useSignIn: () => ({
        signIn: { authenticateWithRedirect: mockAuthenticateWithRedirect },
        isLoaded: mockClerkLoaded,
    }),
    useClerk: () => ({ signOut: mockSignOut }),
}));

vi.mock("../../../hooks/useGoogleAuth", () => ({
    default: vi.fn(),
}));

const mockSsoSet = vi.fn();
const mockSsoClear = vi.fn();
vi.mock("../../../utils/storage", () => ({
    ssoFlags: {
        set: (...args) => mockSsoSet(...args),
        clear: (...args) => mockSsoClear(...args),
    },
}));

describe("LoginForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockClerkLoaded = true;
        mockLoginUserImpl = vi.fn(() => ({ __type: "fulfilled", payload: { accessToken: "tok", user: { roles: ["mentee"] } } }));
        mockDispatch.mockImplementation((thunk) => {
            if (typeof thunk === "function") return thunk;
            return thunk;
        });
        mockSignOut.mockImplementation(() => Promise.resolve());
        mockAuthenticateWithRedirect.mockImplementation(() => Promise.resolve());
    });

    it("renders login form fields", () => {
        render(<LoginForm />);
        expect(screen.getByText("Login")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
    });

    it("uses default placeholder when none provided", () => {
        render(<LoginForm />);
        expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    });

    it("uses custom placeholder when provided", () => {
        render(<LoginForm placeholder="custom@x.com" />);
        expect(screen.getByPlaceholderText("custom@x.com")).toBeInTheDocument();
    });

    it("shows validation errors when submitting empty form", async () => {
        render(<LoginForm />);
        fireEvent.click(screen.getByText("Login to Dashboard"));
        await waitFor(() => {
            expect(screen.getByText("Email is required.")).toBeInTheDocument();
        });
    });

    it("toggles password visibility", async () => {
        const user = userEvent.setup();
        render(<LoginForm />);
        const pwInput = screen.getByPlaceholderText("••••••••");
        expect(pwInput).toHaveAttribute("type", "password");
        await user.click(screen.getByLabelText("Show password"));
        expect(pwInput).toHaveAttribute("type", "text");
        await user.click(screen.getByLabelText("Hide password"));
        expect(pwInput).toHaveAttribute("type", "password");
    });

    it("navigates to forgot-password page", async () => {
        const user = userEvent.setup();
        render(<LoginForm />);
        await user.click(screen.getByText("Forgot password? Click here"));
        expect(mockNavigate).toHaveBeenCalledWith("/forgot-password");
    });

    it("navigates to default register path when link clicked", async () => {
        const user = userEvent.setup();
        render(<LoginForm />);
        await user.click(screen.getByText("Register here"));
        expect(mockNavigate).toHaveBeenCalledWith("/register/mentee");
    });

    it("navigates to custom register path when provided", async () => {
        const user = userEvent.setup();
        render(<LoginForm registerPath="/register/mentor" />);
        await user.click(screen.getByText("Register here"));
        expect(mockNavigate).toHaveBeenCalledWith("/register/mentor");
    });

    it("submits successfully and redirects to mentee dashboard", async () => {
        render(<LoginForm />);

        fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
        fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "password123" } });
        fireEvent.click(screen.getByText("Login to Dashboard"));

        await waitFor(() => {
            expect(screen.getByText("Redirecting to dashboard...")).toBeInTheDocument();
        });

        await waitFor(
            () => {
                expect(mockNavigate).toHaveBeenCalledWith("/dashboard/mentee");
            },
            { timeout: 2000 },
        );
    });

    it("submits successfully and redirects to mentor dashboard when role is mentor", async () => {
        mockLoginUserImpl = vi.fn(() => ({ __type: "fulfilled", payload: { accessToken: "tok", user: { roles: ["mentor"] } } }));
        render(<LoginForm />);

        fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
        fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "password123" } });
        fireEvent.click(screen.getByText("Login to Dashboard"));

        await waitFor(() => {
            expect(screen.getByText("Redirecting to dashboard...")).toBeInTheDocument();
        });

        await waitFor(
            () => {
                expect(mockNavigate).toHaveBeenCalledWith("/dashboard/mentor");
            },
            { timeout: 2000 },
        );
    });

    it("shows root error when login succeeds but user has no matching role", async () => {
        mockLoginUserImpl = vi.fn(() => ({ __type: "fulfilled", payload: { accessToken: "tok", user: { roles: [] } } }));
        const user = userEvent.setup();
        render(<LoginForm />);

        await user.type(screen.getByPlaceholderText("you@example.com"), "a@b.com");
        await user.type(screen.getByPlaceholderText("••••••••"), "password123");
        await user.click(screen.getByText("Login to Dashboard"));

        await waitFor(() => {
            expect(screen.getByText("No role found. Please register first.")).toBeInTheDocument();
        });
    });

    it("shows password error when loginUser is rejected", async () => {
        mockLoginUserImpl = vi.fn(() => ({ __type: "rejected", payload: "Invalid email or password." }));
        const user = userEvent.setup();
        render(<LoginForm />);

        await user.type(screen.getByPlaceholderText("you@example.com"), "a@b.com");
        await user.type(screen.getByPlaceholderText("••••••••"), "password123");
        await user.click(screen.getByText("Login to Dashboard"));

        await waitFor(() => {
            expect(screen.getByText("Invalid email or password.")).toBeInTheDocument();
        });
    });

    it("shows fallback password error message when rejected with no payload", async () => {
        mockLoginUserImpl = vi.fn(() => ({ __type: "rejected", payload: null }));
        const user = userEvent.setup();
        render(<LoginForm />);

        await user.type(screen.getByPlaceholderText("you@example.com"), "a@b.com");
        await user.type(screen.getByPlaceholderText("••••••••"), "password123");
        await user.click(screen.getByText("Login to Dashboard"));

        await waitFor(() => {
            expect(screen.getByText("Invalid email or password.")).toBeInTheDocument();
        });
    });

    it("handles thrown error with 403 forbidden + unverified email", async () => {
        const err = {
            response: {
                status: HTTP_STATUS.FORBIDDEN,
                data: { isEmailVerified: false, email: "a@b.com" },
            },
        };
        mockLoginUserImpl = vi.fn(() => {
            throw err;
        });
        render(<LoginForm />);

        fireEvent.change(screen.getByPlaceholderText("you@example.com"), { target: { value: "a@b.com" } });
        fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "password123" } });
        fireEvent.click(screen.getByText("Login to Dashboard"));

        await waitFor(() => {
            expect(
                screen.getByText("Please verify your email first. Redirecting..."),
            ).toBeInTheDocument();
        });

        await waitFor(
            () => {
                expect(mockNavigate).toHaveBeenCalledWith(
                    `/verify-email?email=${encodeURIComponent("a@b.com")}`,
                );
            },
            { timeout: 2000 },
        );
    });

    it("handles thrown error with 401 unauthorized", async () => {
        mockLoginUserImpl = vi.fn(() => {
            throw { response: { status: HTTP_STATUS.UNAUTHORIZED } };
        });
        const user = userEvent.setup();
        render(<LoginForm />);

        await user.type(screen.getByPlaceholderText("you@example.com"), "a@b.com");
        await user.type(screen.getByPlaceholderText("••••••••"), "password123");
        await user.click(screen.getByText("Login to Dashboard"));

        await waitFor(() => {
            expect(screen.getByText("Invalid email or password.")).toBeInTheDocument();
        });
    });

    it("falls back to mapServerErrorsToForm for generic/500 errors", async () => {
        mockLoginUserImpl = vi.fn(() => {
            throw { response: { status: 500, data: { message: "Server exploded" } } };
        });
        const user = userEvent.setup();
        render(<LoginForm />);

        await user.type(screen.getByPlaceholderText("you@example.com"), "a@b.com");
        await user.type(screen.getByPlaceholderText("••••••••"), "password123");
        await user.click(screen.getByText("Login to Dashboard"));

        await waitFor(() => {
            expect(screen.getByText("Server exploded")).toBeInTheDocument();
        });
    });

    it("calls handleClerkSSO for linkedin and navigates on success", async () => {
        const user = userEvent.setup();
        render(<LoginForm />);
        await user.click(screen.getByText("LinkedIn"));

        await waitFor(() => {
            expect(mockSignOut).toHaveBeenCalled();
            expect(mockSsoSet).toHaveBeenCalledWith("existing", true);
            expect(mockAuthenticateWithRedirect).toHaveBeenCalled();
        });
    });

    it("does nothing for linkedin SSO when clerk not loaded", async () => {
        mockClerkLoaded = false;
        const user = userEvent.setup();
        render(<LoginForm />);
        await user.click(screen.getByText("LinkedIn"));
        expect(mockSignOut).not.toHaveBeenCalled();
    });

    it("shows error and clears sso flags when clerk SSO throws", async () => {
        mockSignOut.mockImplementationOnce(() => {
            throw new Error("SSO broke");
        });
        const user = userEvent.setup();
        render(<LoginForm />);
        await user.click(screen.getByText("LinkedIn"));

        await waitFor(() => {
            expect(mockSsoClear).toHaveBeenCalled();
            expect(screen.getByText("SSO broke")).toBeInTheDocument();
        });
    });
});