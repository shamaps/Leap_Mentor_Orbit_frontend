// src/test/pages/admin/AdminSettings.test.jsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import adminAxiosInstance from "../../../utils/adminAxiosInstance";
import { useToast } from "../../../context/ToastContext";
import AdminSettings from "../../../pages/admin/AdminSettings";

vi.mock("../../../utils/adminAxiosInstance");
vi.mock("../../../context/ToastContext");

describe("AdminSettings", () => {
    let showToast;

    beforeEach(() => {
        vi.clearAllMocks();
        showToast = vi.fn();
        useToast.mockReturnValue({ showToast });
        adminAxiosInstance.get.mockResolvedValue({ data: { commissionRate: 10 } });
    });

    it("fetches and populates the current commission rate on mount", async () => {
        render(<AdminSettings />);

        await waitFor(() => {
            expect(screen.getByLabelText("Commission Rate (%)")).toHaveValue(10);
        });
        expect(adminAxiosInstance.get).toHaveBeenCalledWith("/admin/settings/commission");
    });

    it("shows a toast error when fetching the commission rate fails", async () => {
        adminAxiosInstance.get.mockRejectedValue(new Error("fail"));

        render(<AdminSettings />);

        await waitFor(() => {
            expect(showToast).toHaveBeenCalledWith({
                message: "Failed to load settings.",
                type: "error",
            });
        });
    });

    it("shows a validation error when saving an empty commission rate", async () => {
        const user = userEvent.setup();
        render(<AdminSettings />);
        await waitFor(() => expect(screen.getByLabelText("Commission Rate (%)")).toHaveValue(10));

        await user.clear(screen.getByLabelText("Commission Rate (%)"));
        await user.click(screen.getByRole("button", { name: /save rate/i }));

        expect(
            await screen.findByText("Commission rate is required."),
        ).toBeInTheDocument();
        expect(adminAxiosInstance.patch).not.toHaveBeenCalled();
    });

    it("shows a validation error when commission rate is out of range", async () => {
        const user = userEvent.setup();
        render(<AdminSettings />);
        await waitFor(() => expect(screen.getByLabelText("Commission Rate (%)")).toHaveValue(10));

        await user.clear(screen.getByLabelText("Commission Rate (%)"));
        await user.type(screen.getByLabelText("Commission Rate (%)"), "150");
        await user.click(screen.getByRole("button", { name: /save rate/i }));

        expect(
            await screen.findByText("Commission must be between 0 and 100."),
        ).toBeInTheDocument();
    });

    it("saves a valid commission rate and shows a success toast", async () => {
        adminAxiosInstance.patch.mockResolvedValue({});
        const user = userEvent.setup();
        render(<AdminSettings />);
        await waitFor(() => expect(screen.getByLabelText("Commission Rate (%)")).toHaveValue(10));

        await user.clear(screen.getByLabelText("Commission Rate (%)"));
        await user.type(screen.getByLabelText("Commission Rate (%)"), "25");
        await user.click(screen.getByRole("button", { name: /save rate/i }));

        await waitFor(() => {
            expect(adminAxiosInstance.patch).toHaveBeenCalledWith("/admin/settings/commission", {
                commissionRate: 25,
            });
        });
        expect(showToast).toHaveBeenCalledWith({ message: "Commission rate set to 25%" });
    });

    it("shows a toast error with the fallback message when saving commission fails", async () => {
        adminAxiosInstance.patch.mockRejectedValue({});
        const user = userEvent.setup();
        render(<AdminSettings />);
        await waitFor(() => expect(screen.getByLabelText("Commission Rate (%)")).toHaveValue(10));

        await user.clear(screen.getByLabelText("Commission Rate (%)"));
        await user.type(screen.getByLabelText("Commission Rate (%)"), "25");
        await user.click(screen.getByRole("button", { name: /save rate/i }));

        await waitFor(() => {
            expect(showToast).toHaveBeenCalledWith({
                message: "Failed to update commission.",
                type: "error",
            });
        });
    });

    it("shows the server-provided error message when saving commission fails", async () => {
        adminAxiosInstance.patch.mockRejectedValue({
            response: { data: { message: "Rate locked by policy." } },
        });
        const user = userEvent.setup();
        render(<AdminSettings />);
        await waitFor(() => expect(screen.getByLabelText("Commission Rate (%)")).toHaveValue(10));

        await user.clear(screen.getByLabelText("Commission Rate (%)"));
        await user.type(screen.getByLabelText("Commission Rate (%)"), "25");
        await user.click(screen.getByRole("button", { name: /save rate/i }));

        await waitFor(() => {
            expect(showToast).toHaveBeenCalledWith({
                message: "Rate locked by policy.",
                type: "error",
            });
        });
    });

    it("shows the saving state on the commission button while submitting", async () => {
        let resolvePatch;
        adminAxiosInstance.patch.mockImplementation(
            () => new Promise((resolve) => { resolvePatch = resolve; }),
        );
        const user = userEvent.setup();
        render(<AdminSettings />);
        await waitFor(() => expect(screen.getByLabelText("Commission Rate (%)")).toHaveValue(10));

        await user.clear(screen.getByLabelText("Commission Rate (%)"));
        await user.type(screen.getByLabelText("Commission Rate (%)"), "25");
        await user.click(screen.getByRole("button", { name: /save rate/i }));

        expect(await screen.findByText("Saving...")).toBeInTheDocument();

        resolvePatch({});
        await waitFor(() => expect(showToast).toHaveBeenCalled());
    });

    it("shows validation errors for empty admin name and invalid email", async () => {
        const user = userEvent.setup();
        render(<AdminSettings />);
        await waitFor(() => expect(screen.getByLabelText("Commission Rate (%)")).toHaveValue(10));

        await user.type(screen.getByLabelText("Email Address"), "not-an-email");
        await user.click(screen.getByRole("button", { name: /create admin account/i }));

        expect(await screen.findByText("Name is required.")).toBeInTheDocument();
        expect(
            screen.getByText("Please enter a valid email address."),
        ).toBeInTheDocument();
        expect(adminAxiosInstance.post).not.toHaveBeenCalled();
    });

    it("creates a new admin, shows a success toast, resets the form, and reveals the temp password", async () => {
        adminAxiosInstance.post.mockResolvedValue({ data: { tempPassword: "TempPass123!" } });
        const user = userEvent.setup();
        render(<AdminSettings />);
        await waitFor(() => expect(screen.getByLabelText("Commission Rate (%)")).toHaveValue(10));

        await user.type(screen.getByLabelText("Full Name"), "  Sarah Admin  ");
        await user.type(screen.getByLabelText("Email Address"), "  sarah@leapmentor.com  ");
        await user.click(screen.getByRole("button", { name: /create admin account/i }));

        await waitFor(() => {
            expect(adminAxiosInstance.post).toHaveBeenCalledWith("/admin/settings/admins", {
                name: "Sarah Admin",
                email: "sarah@leapmentor.com",
            });
        });
        expect(showToast).toHaveBeenCalledWith({
            message: "Admin account created for sarah@leapmentor.com",
        });
        expect(await screen.findByText("TempPass123!")).toBeInTheDocument();
        expect(screen.getByLabelText("Full Name")).toHaveValue("");
    });

    it("shows a toast error with the fallback message when creating an admin fails", async () => {
        adminAxiosInstance.post.mockRejectedValue({});
        const user = userEvent.setup();
        render(<AdminSettings />);
        await waitFor(() => expect(screen.getByLabelText("Commission Rate (%)")).toHaveValue(10));

        await user.type(screen.getByLabelText("Full Name"), "Sarah Admin");
        await user.type(screen.getByLabelText("Email Address"), "sarah@leapmentor.com");
        await user.click(screen.getByRole("button", { name: /create admin account/i }));

        await waitFor(() => {
            expect(showToast).toHaveBeenCalledWith({
                message: "Failed to create admin.",
                type: "error",
            });
        });
    });

    it("shows the server-provided error message when creating an admin fails", async () => {
        adminAxiosInstance.post.mockRejectedValue({
            response: { data: { message: "Email already an admin." } },
        });
        const user = userEvent.setup();
        render(<AdminSettings />);
        await waitFor(() => expect(screen.getByLabelText("Commission Rate (%)")).toHaveValue(10));

        await user.type(screen.getByLabelText("Full Name"), "Sarah Admin");
        await user.type(screen.getByLabelText("Email Address"), "sarah@leapmentor.com");
        await user.click(screen.getByRole("button", { name: /create admin account/i }));

        await waitFor(() => {
            expect(showToast).toHaveBeenCalledWith({
                message: "Email already an admin.",
                type: "error",
            });
        });
    });

    it("shows the adding state on the admin button while submitting, and resets tempPw for a new attempt", async () => {
        let resolvePost;
        adminAxiosInstance.post
            .mockResolvedValueOnce({ data: { tempPassword: "FirstPass1!" } })
            .mockImplementationOnce(
                () => new Promise((resolve) => { resolvePost = resolve; }),
            );
        const user = userEvent.setup();
        render(<AdminSettings />);
        await waitFor(() => expect(screen.getByLabelText("Commission Rate (%)")).toHaveValue(10));

        await user.type(screen.getByLabelText("Full Name"), "Sarah Admin");
        await user.type(screen.getByLabelText("Email Address"), "sarah@leapmentor.com");
        await user.click(screen.getByRole("button", { name: /create admin account/i }));
        expect(await screen.findByText("FirstPass1!")).toBeInTheDocument();

        await user.type(screen.getByLabelText("Full Name"), "Second Admin");
        await user.type(screen.getByLabelText("Email Address"), "second@leapmentor.com");
        await user.click(screen.getByRole("button", { name: /create admin account/i }));

        expect(await screen.findByText("Saving...")).toBeInTheDocument();
        expect(screen.queryByText("FirstPass1!")).not.toBeInTheDocument();

        resolvePost({ data: { tempPassword: "SecondPass2!" } });
        await waitFor(() => expect(screen.getByText("SecondPass2!")).toBeInTheDocument());
    });
});