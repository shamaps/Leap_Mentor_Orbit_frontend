import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterForm from "../../../components/auth/RegisterForm";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
    useNavigate: () => mockNavigate,
}));

const mockDispatch = vi.fn((x) => x);
let mockSelectAuthState = { loading: false, error: null };
vi.mock("react-redux", () => ({
    useDispatch: () => mockDispatch,
    useSelector: (selector) => selector({ auth: mockSelectAuthState }),
}));

vi.mock("../../../store/selectors", () => ({
    selectAuth: (state) => state.auth,
}));

let mockRegisterUserImpl;
vi.mock("../../../store/slices/authSlice", () => ({
    registerUser: Object.assign((...args) => mockRegisterUserImpl(...args), {
        fulfilled: { match: (res) => res?.__type === "fulfilled" },
    }),
    clearMessages: vi.fn(() => ({ type: "auth/clearMessages" })),
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

vi.mock("../../../ui/TermsAndConditionsModal", () => ({
    default: ({ isOpen, onClose, onAccept }) =>
        isOpen ? (
            <div data-testid="terms-modal">
                <button onClick={onAccept}>Accept Terms</button>
                <button onClick={onClose}>Close Terms</button>
            </div>
        ) : null,
}));

const fillRequiredFields = (password = "Password1!") => {
    fireEvent.change(screen.getByPlaceholderText("John Doe"), { target: { value: "Jane Doe" } });
    fireEvent.change(screen.getByPlaceholderText("name@company.com"), { target: { value: "jane@x.com" } });
    if (password) {
        fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: password } });
    }
};

describe("RegisterForm", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockClerkLoaded = true;
        mockSelectAuthState = { loading: false, error: null };
        mockRegisterUserImpl = vi.fn(() => ({
            __type: "fulfilled",
            payload: { isNewUser: true },
        }));
        mockSignOut.mockImplementation(() => Promise.resolve());
        mockAuthenticateWithRedirect.mockImplementation(() => Promise.resolve());
    });

    it("renders mentor heading and description", () => {
        render(<RegisterForm role="mentor" />);
        expect(screen.getByText("Register as Mentor")).toBeInTheDocument();
        expect(
            screen.getByText(/Create your LeapMentor mentor account/),
        ).toBeInTheDocument();
    });

    it("renders mentee heading and description", () => {
        render(<RegisterForm role="mentee" />);
        expect(screen.getByText("Register as Mentee")).toBeInTheDocument();
        expect(
            screen.getByText(/Create your LeapMentor mentee account/),
        ).toBeInTheDocument();
    });

    it("shows root error banner when redux error state is set", () => {
        mockSelectAuthState = { loading: false, error: "Something bad happened" };
        render(<RegisterForm role="mentee" />);
        expect(screen.getByText("Something bad happened")).toBeInTheDocument();
    });

    it("shows validation errors on empty submit", async () => {
        render(<RegisterForm role="mentee" />);
        fireEvent.click(screen.getByText("Create Account"));
        await waitFor(() => {
            expect(screen.getByText("Name is required.")).toBeInTheDocument();
        });
    });

    it("toggles password visibility", async () => {
        const user = userEvent.setup();
        render(<RegisterForm role="mentee" />);
        const pwInput = screen.getByPlaceholderText("••••••••");
        expect(pwInput).toHaveAttribute("type", "password");
        await user.click(screen.getByLabelText("Show password"));
        expect(pwInput).toHaveAttribute("type", "text");
        await user.click(screen.getByLabelText("Hide password"));
        expect(pwInput).toHaveAttribute("type", "password");
    });

    it("shows password strength meter once field touched with content, weak password", async () => {
        const user = userEvent.setup();
        render(<RegisterForm role="mentee" />);
        const pwInput = screen.getByPlaceholderText("••••••••");
        await user.type(pwInput, "a");
        fireEvent.blur(pwInput);
        await waitFor(() => {
            expect(screen.getByText("Weak")).toBeInTheDocument();
            expect(screen.getByText("At least 8 characters")).toBeInTheDocument();
        });
    });

    it("shows Strong strength label when all password rules match", async () => {
        const user = userEvent.setup();
        render(<RegisterForm role="mentee" />);
        const pwInput = screen.getByPlaceholderText("••••••••");
        await user.type(pwInput, "Password1!");
        fireEvent.blur(pwInput);
        await waitFor(() => {
            expect(screen.getByText("Strong")).toBeInTheDocument();
        });
    });

    it("shows Fair strength label for 2 matched rules", async () => {
        const user = userEvent.setup();
        render(<RegisterForm role="mentee" />);
        const pwInput = screen.getByPlaceholderText("••••••••");
        await user.type(pwInput, "aaaaaaaaA");
        fireEvent.blur(pwInput);
        await waitFor(() => {
            expect(screen.getByText("Fair")).toBeInTheDocument();
        });
    });

    it("shows Good strength label for 3 matched rules", async () => {
        const user = userEvent.setup();
        render(<RegisterForm role="mentee" />);
        const pwInput = screen.getByPlaceholderText("••••••••");
        await user.type(pwInput, "aaaaaaaaA1");
        fireEvent.blur(pwInput);
        await waitFor(() => {
            expect(screen.getByText("Good")).toBeInTheDocument();
        });
    });

    it("does not show strength meter before field is touched", () => {
        render(<RegisterForm role="mentee" />);
        expect(screen.queryByText("Weak")).not.toBeInTheDocument();
    });

    it("opens and accepts terms modal, marking checkbox accepted", async () => {
        const user = userEvent.setup();
        render(<RegisterForm role="mentee" />);
        await user.click(screen.getByText("Terms"));
        expect(screen.getByTestId("terms-modal")).toBeInTheDocument();
        await user.click(screen.getByText("Accept Terms"));
        await waitFor(() => {
            expect(screen.queryByTestId("terms-modal")).not.toBeInTheDocument();
        });
    });

    it("opens Privacy Policy link and closes modal via onClose", async () => {
        const user = userEvent.setup();
        render(<RegisterForm role="mentee" />);
        await user.click(screen.getByText("Privacy Policy"));
        expect(screen.getByTestId("terms-modal")).toBeInTheDocument();
        await user.click(screen.getByText("Close Terms"));
        await waitFor(() => {
            expect(screen.queryByTestId("terms-modal")).not.toBeInTheDocument();
        });
    });

    it("shows terms validation error when submitting without accepting terms", async () => {
        render(<RegisterForm role="mentee" />);
        fillRequiredFields();
        fireEvent.click(screen.getByText("Create Account"));
        await waitFor(() => {
            expect(
                screen.getByText("Please accept the terms to continue."),
            ).toBeInTheDocument();
        });
    });

    it("submits successfully for a new user and redirects to verify-email", async () => {
        render(<RegisterForm role="mentee" />);

        fillRequiredFields();
        fireEvent.click(screen.getByText("Terms"));
        fireEvent.click(screen.getByText("Accept Terms"));
        fireEvent.click(screen.getByText("Create Account"));

        await waitFor(() => {
            expect(screen.getByText("Setting up your account...")).toBeInTheDocument();
        });

        await waitFor(
            () => {
                expect(mockNavigate).toHaveBeenCalledWith("/verify-email", {
                    state: { email: "jane@x.com", role: "mentee" },
                });
            },
            { timeout: 2000 },
        );
    });

    it("shows email-already-registered error when user is not new", async () => {
        mockRegisterUserImpl = vi.fn(() => ({
            __type: "fulfilled",
            payload: { isNewUser: false },
        }));
        render(<RegisterForm role="mentee" />);

        fillRequiredFields();
        fireEvent.click(screen.getByText("Terms"));
        fireEvent.click(screen.getByText("Accept Terms"));
        fireEvent.click(screen.getByText("Create Account"));

        await waitFor(() => {
            expect(
                screen.getByText("This email is already registered. Please login instead."),
            ).toBeInTheDocument();
        });
    });

    it("does not redirect when registerUser is rejected", async () => {
        mockRegisterUserImpl = vi.fn(() => ({ __type: "rejected", payload: "fail" }));
        render(<RegisterForm role="mentee" />);

        fillRequiredFields();
        fireEvent.click(screen.getByText("Terms"));
        fireEvent.click(screen.getByText("Accept Terms"));
        fireEvent.click(screen.getByText("Create Account"));

        await waitFor(() => {
            expect(mockRegisterUserImpl).toHaveBeenCalled();
        });
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("shows loading state on submit button", () => {
        mockSelectAuthState = { loading: true, error: null };
        render(<RegisterForm role="mentee" />);
        expect(screen.getByText("Creating account…")).toBeInTheDocument();
    });

    it("navigates to /login when Login link clicked", async () => {
        render(<RegisterForm role="mentee" />);
        fireEvent.click(screen.getByText("Login"));
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith("/login");
        });
    });

    it("calls handleClerkSSO for linkedin and navigates on success", async () => {
        render(<RegisterForm role="mentor" />);
        fireEvent.click(screen.getByText("LinkedIn"));

        await waitFor(() => {
            expect(mockSignOut).toHaveBeenCalled();
            expect(mockSsoSet).toHaveBeenCalledWith("mentor", true);
            expect(mockAuthenticateWithRedirect).toHaveBeenCalled();
        });
    });

    it("does nothing for linkedin SSO when clerk not loaded", async () => {
        mockClerkLoaded = false;
        render(<RegisterForm role="mentee" />);
        fireEvent.click(screen.getByText("LinkedIn"));
        await waitFor(() => {
            expect(mockSignOut).not.toHaveBeenCalled();
        });
    });

    it("shows error and clears sso flags when clerk SSO throws with message", async () => {
        mockSignOut.mockImplementationOnce(() => {
            throw new Error("SSO broke");
        });
        render(<RegisterForm role="mentee" />);
        fireEvent.click(screen.getByText("LinkedIn"));

        await waitFor(() => {
            expect(mockSsoClear).toHaveBeenCalled();
            expect(screen.getByText("SSO broke")).toBeInTheDocument();
        });
    });

    it("shows fallback SSO error message when thrown error has no message", async () => {
        mockSignOut.mockImplementationOnce(() => {
            throw {};
        });
        render(<RegisterForm role="mentee" />);
        fireEvent.click(screen.getByText("LinkedIn"));

        await waitFor(() => {
            expect(screen.getByText("SSO failed. Try again.")).toBeInTheDocument();
        });
    });
});