import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock all lazy-loaded route components as lightweight stubs ──
vi.mock("../features/auth/view/pages/RegisterMentee", () => ({ default: () => <div>RegisterMentee</div> }));
vi.mock("../features/auth/view/pages/RegisterMentor", () => ({ default: () => <div>RegisterMentor</div> }));
vi.mock("../features/auth/view/pages/LoginMentor", () => ({ default: () => <div>LoginMentor</div> }));
vi.mock("../features/auth/view/pages/LoginMentee", () => ({ default: () => <div>LoginMentee</div> }));
vi.mock("../features/auth/view/pages/VerifyEmail", () => ({ default: () => <div>VerifyEmail</div> }));
vi.mock("../features/auth/view/pages/ForgotPassword", () => ({ default: () => <div>ForgotPassword</div> }));
vi.mock("../features/auth/view/pages/SSOCallback", () => ({ default: () => <div>SSOCallback</div> }));
vi.mock("../features/auth/view/pages/SSOSync", () => ({ default: () => <div>SSOSync</div> }));
vi.mock("../features/mentor/view/pages/MentorOnboarding", () => ({ default: () => <div>MentorOnboarding</div> }));
vi.mock("../features/mentor/view/pages/MentorVerification", () => ({ default: () => <div>MentorVerification</div> }));
vi.mock("../features/mentee/view/pages/MenteeOnboarding", () => ({ default: () => <div>MenteeOnboarding</div> }));
vi.mock("../features/mentee/view/components/profile/MenteeEditProfileShell", () => ({
    default: () => <div>MenteeEditProfileShell</div>,
}));
vi.mock("../features/mentor/view/components/profile/MentorEditProfileShell", () => ({
    default: () => <div>MentorEditProfileShell</div>,
}));
vi.mock("../features/mentor/view/pages/MentorDashboard", () => ({ default: () => <div>MentorDashboard</div> }));
vi.mock("../features/mentee/view/pages/MenteeDashboard", () => ({ default: () => <div>MenteeDashboard</div> }));
vi.mock("../features/shared-dashboard/view/pages/SharedDashboardPage", () => ({ default: () => <div>SharedDashboardPage</div> }));
vi.mock("../features/admin/view/pages/AdminLogin", () => ({ default: () => <div>AdminLogin</div> }));
vi.mock("../features/admin/view/pages/AdminUserManagement", () => ({ default: () => <div>AdminUserManagement</div> }));
vi.mock("../features/admin/view/pages/AdminEngagements", () => ({ default: () => <div>AdminEngagements</div> }));
vi.mock("../features/admin/view/pages/AdminReports", () => ({ default: () => <div>AdminReports</div> }));
vi.mock("../features/admin/view/pages/AdminPayments", () => ({ default: () => <div>AdminPayments</div> }));
vi.mock("../features/admin/view/pages/AdminSettings", () => ({ default: () => <div>AdminSettings</div> }));
vi.mock("../features/admin/view/components/AdminSupportMessages", () => ({
    default: () => <div>AdminSupportMessages</div>,
}));
vi.mock("../features/admin/view/components/AdminLayout", () => ({ default: () => <div>AdminLayout</div> }));
vi.mock("../features/admin/view/pages/AdminWalletRequests", () => ({ default: () => <div>AdminWalletRequests</div> }));
vi.mock("../features/admin/view/pages/AdminVerifications", () => ({ default: () => <div>AdminVerifications</div> }));

vi.mock("../shared/marketing/Home", () => ({ default: () => <div>Home</div> }));
vi.mock("../shared/marketing/NotFound", () => ({ default: () => <div>NotFound</div> }));
vi.mock("../shared/components/GlobalErrorBanner", () => ({
    default: () => <div data-testid="global-error-banner" />,
}));
vi.mock("../features/admin/view/components/AdminRoute", () => ({
    default: ({ children }) => <div data-testid="admin-route">{children}</div>,
}));
vi.mock("../features/auth/view/components/ProtectedRoute", () => ({
    default: ({ children }) => <div data-testid="protected-route">{children}</div>,
}));

vi.mock("@sentry/react", () => ({
    setUser: vi.fn(),
    ErrorBoundary: ({ children }) => children,
}));

const mockDispatch = vi.fn();
let mockToken;

vi.mock("react-redux", () => ({
    useDispatch: () => mockDispatch,
    useSelector: (selectorFn) => selectorFn({ auth: { token: mockToken } }),
}));

vi.mock("../app/store/selectors", () => ({
    selectAuthToken: (state) => state.auth.token,
}));

vi.mock("../app/store/slices/authSlice", () => ({
    setToken: (payload) => ({ type: "auth/setToken", payload }),
    setUser: (payload) => ({ type: "auth/setUser", payload }),
    setBootstrapped: () => ({ type: "auth/setBootstrapped" }),
}));

const mockPost = vi.fn();
vi.mock("../shared/utils/axiosInstance", () => ({
    default: { post: (...args) => mockPost(...args) },
}));

import App from "../app/App";

describe("App", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockToken = null;
        window.history.pushState({}, "", "/");
    });

    it("renders the GlobalErrorBanner", async () => {
        mockToken = "existing-token";
        render(<App />);

        await waitFor(() => {
            expect(screen.getByTestId("global-error-banner")).toBeInTheDocument();
        });
    });

    it("dispatches setBootstrapped immediately when a token already exists in Redux, without calling refresh", async () => {
        mockToken = "existing-token";
        render(<App />);

        await waitFor(() => {
            expect(mockDispatch).toHaveBeenCalledWith({ type: "auth/setBootstrapped" });
        });
        expect(mockPost).not.toHaveBeenCalled();
    });

    it("attempts to refresh the session via cookie when no token is present, then dispatches user/token on success", async () => {
        mockToken = null;
        mockPost.mockResolvedValueOnce({
            data: {
                accessToken: "new-token",
                user: { _id: "u1", roles: ["mentor"] },
            },
        });

        render(<App />);

        await waitFor(() => {
            expect(mockPost).toHaveBeenCalledWith("/auth/refresh");
        });

        await waitFor(() => {
            expect(mockDispatch).toHaveBeenCalledWith({
                type: "auth/setToken",
                payload: "new-token",
            });
            expect(mockDispatch).toHaveBeenCalledWith({
                type: "auth/setUser",
                payload: { user: { _id: "u1", roles: ["mentor"] }, token: "new-token" },
            });
            expect(mockDispatch).toHaveBeenCalledWith({ type: "auth/setBootstrapped" });
        });
    });

    it("still dispatches setBootstrapped when the refresh call fails", async () => {
        mockToken = null;
        mockPost.mockRejectedValueOnce(new Error("No refresh cookie"));

        render(<App />);

        await waitFor(() => {
            expect(mockDispatch).toHaveBeenCalledWith({ type: "auth/setBootstrapped" });
        });
    });

    it("renders the Home page at the root path", async () => {
        mockToken = "token";
        window.history.pushState({}, "", "/");
        render(<App />);

        await waitFor(() => {
            expect(screen.getByText("Home")).toBeInTheDocument();
        });
    });

    it("renders NotFound for an unmatched route", async () => {
        mockToken = "token";
        window.history.pushState({}, "", "/this-route-does-not-exist");
        render(<App />);

        await waitFor(() => {
            expect(screen.getByText("NotFound")).toBeInTheDocument();
        });
    });

    it("renders the shared dashboard route without wrapping it in ProtectedRoute", async () => {
        mockToken = "token";
        window.history.pushState({}, "", "/shared-dashboard/req-123");
        render(<App />);

        await waitFor(() => {
            expect(screen.getByText("SharedDashboardPage")).toBeInTheDocument();
        });
        expect(screen.queryByTestId("protected-route")).not.toBeInTheDocument();
    });

    it("wraps the mentor dashboard route in ProtectedRoute", async () => {
        mockToken = "token";
        window.history.pushState({}, "", "/dashboard/mentor");
        render(<App />);

        await waitFor(() => {
            expect(screen.getByTestId("protected-route")).toBeInTheDocument();
            expect(screen.getByText("MentorDashboard")).toBeInTheDocument();
        });
    });

    it("wraps admin routes in AdminRoute and AdminLayout", async () => {
        mockToken = "token";
        window.history.pushState({}, "", "/admin/users");
        render(<App />);

        await waitFor(() => {
            expect(screen.getByTestId("admin-route")).toBeInTheDocument();
            expect(screen.getByText("AdminLayout")).toBeInTheDocument();
        });
    });
});