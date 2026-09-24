// src/test/pages/admin/AdminLogin.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useNavigate } from "react-router-dom";
import adminAxiosInstance from "../../../utils/axiosInstance";
import AdminLogin from "../../../pages/admin/AdminLogin";

vi.mock("react-router-dom", () => ({
    useNavigate: vi.fn(),
}));
vi.mock("../../../utils/axiosInstance");

describe("AdminLogin", () => {
    let navigate;

    beforeEach(() => {
        vi.clearAllMocks();
        navigate = vi.fn();
        useNavigate.mockReturnValue(navigate);
    });

    it("renders the form with email and password fields", () => {
        render(<AdminLogin />);

        expect(screen.getByPlaceholderText("admin@leapmentor.com")).toBeInTheDocument();
        expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    });

    it("shows client-side validation errors when submitted empty", async () => {
        const user = userEvent.setup();
        render(<AdminLogin />);

        await user.click(screen.getByRole("button", { name: /sign in/i }));

        expect(await screen.findByText("Email is required.")).toBeInTheDocument();
        expect(screen.getByText("Password is required.")).toBeInTheDocument();
        expect(adminAxiosInstance.post).not.toHaveBeenCalled();
    });

    it("shows an invalid-email validation error", async () => {
        const user = userEvent.setup();
        render(<AdminLogin />);

        await user.type(screen.getByPlaceholderText("admin@leapmentor.com"), "not-an-email");
        await user.type(screen.getByPlaceholderText("••••••••"), "somepassword");
        await user.click(screen.getByRole("button", { name: /sign in/i }));

        expect(
            await screen.findByText("Please enter a valid email address."),
        ).toBeInTheDocument();
    });

    it("toggles password visibility when the eye icon button is clicked", async () => {
        const user = userEvent.setup();
        render(<AdminLogin />);

        const passwordInput = screen.getByPlaceholderText("••••••••");
        expect(passwordInput).toHaveAttribute("type", "password");

        const toggleButtons = screen.getAllByRole("button");
        const eyeButton = toggleButtons.find((btn) => btn.getAttribute("type") === "button");
        await user.click(eyeButton);

        expect(passwordInput).toHaveAttribute("type", "text");

        await user.click(eyeButton);
        expect(passwordInput).toHaveAttribute("type", "password");
    });

    it("submits successfully and navigates to /admin/users", async () => {
        adminAxiosInstance.post.mockResolvedValue({});
        const user = userEvent.setup();
        render(<AdminLogin />);

        await user.type(screen.getByPlaceholderText("admin@leapmentor.com"), "admin@leapmentor.com");
        await user.type(screen.getByPlaceholderText("••••••••"), "correctpassword");
        await user.click(screen.getByRole("button", { name: /sign in/i }));

        await waitFor(() => {
            expect(adminAxiosInstance.post).toHaveBeenCalledWith("admin/auth/login", {
                email: "admin@leapmentor.com",
                password: "correctpassword",
            });
        });
        expect(navigate).toHaveBeenCalledWith("/admin/users");
    });

    it("shows the loading state while submitting", async () => {
        let resolvePost;
        adminAxiosInstance.post.mockImplementation(
            () => new Promise((resolve) => { resolvePost = resolve; }),
        );
        const user = userEvent.setup();
        render(<AdminLogin />);

        await user.type(screen.getByPlaceholderText("admin@leapmentor.com"), "admin@leapmentor.com");
        await user.type(screen.getByPlaceholderText("••••••••"), "correctpassword");
        await user.click(screen.getByRole("button", { name: /sign in/i }));

        expect(await screen.findByText("Signing in...")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /signing in/i })).toBeDisabled();

        resolvePost({});
        await waitFor(() => expect(navigate).toHaveBeenCalled());
    });

    it("shows the root/banner error message on a generic server failure", async () => {
        adminAxiosInstance.post.mockRejectedValue({
            response: { data: { message: "Invalid email or password." } },
        });
        const user = userEvent.setup();
        render(<AdminLogin />);

        await user.type(screen.getByPlaceholderText("admin@leapmentor.com"), "admin@leapmentor.com");
        await user.type(screen.getByPlaceholderText("••••••••"), "wrongpassword");
        await user.click(screen.getByRole("button", { name: /sign in/i }));

        expect(
            await screen.findByText("Invalid email or password."),
        ).toBeInTheDocument();
        expect(navigate).not.toHaveBeenCalled();
    });

    it("maps field-specific server errors onto the email field", async () => {
        adminAxiosInstance.post.mockRejectedValue({
            response: { data: { errors: { email: "Admin account not found." } } },
        });
        const user = userEvent.setup();
        render(<AdminLogin />);

        await user.type(screen.getByPlaceholderText("admin@leapmentor.com"), "unknown@leapmentor.com");
        await user.type(screen.getByPlaceholderText("••••••••"), "somepassword");
        await user.click(screen.getByRole("button", { name: /sign in/i }));

        expect(await screen.findByText("Admin account not found.")).toBeInTheDocument();
    });

    it("clears the root error on a subsequent submit attempt", async () => {
        adminAxiosInstance.post
            .mockRejectedValueOnce({ response: { data: { message: "Invalid email or password." } } })
            .mockResolvedValueOnce({});
        const user = userEvent.setup();
        render(<AdminLogin />);

        await user.type(screen.getByPlaceholderText("admin@leapmentor.com"), "admin@leapmentor.com");
        await user.type(screen.getByPlaceholderText("••••••••"), "wrongpassword");
        await user.click(screen.getByRole("button", { name: /sign in/i }));
        expect(await screen.findByText("Invalid email or password.")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: /sign in/i }));

        await waitFor(() => expect(navigate).toHaveBeenCalledWith("/admin/users"));
        expect(screen.queryByText("Invalid email or password.")).not.toBeInTheDocument();
    });
});