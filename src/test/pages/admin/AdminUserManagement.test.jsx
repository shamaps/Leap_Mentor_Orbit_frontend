// src/test/pages/admin/AdminUserManagement.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import adminAxiosInstance from "../../../utils/axiosInstance";
import AdminUserManagement from "../../../pages/admin/AdminUserManagement";

vi.mock("../../../utils/axiosInstance");
vi.mock("../../../utils/logger", () => ({
    default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("../../../components/admin/common/UserGrowthChart", () => ({
    default: () => <div data-testid="user-growth-chart" />,
}));
vi.mock("../../../components/admin/common/MentorIndustryChart", () => ({
    default: () => <div data-testid="mentor-industry-chart" />,
}));

const statsPayload = {
    totalUsers: 100,
    newUsersThisMonth: 10,
    totalMentors: 40,
    newMentorsThisMonth: 4,
    totalMentees: 60,
    newMenteesThisMonth: 6,
};

const baseUser = {
    _id: "u1",
    name: "Alice Mentor",
    email: "alice@test.com",
    roles: ["mentor"],
    isEmailVerified: true,
    createdAt: "2026-01-15T00:00:00.000Z",
    profile: {},
};

const usersPagination = { total: 1, page: 1, totalPages: 1 };

const mockAllGets = ({ users = [baseUser], pagination = usersPagination } = {}) => {
    adminAxiosInstance.get.mockImplementation((url) => {
        if (url === "/admin/stats") return Promise.resolve({ data: statsPayload });
        if (url === "/admin/user-growth") return Promise.resolve({ data: [] });
        if (url === "/admin/stats/mentor-industries") return Promise.resolve({ data: [] });
        if (url === "/admin/users") return Promise.resolve({ data: { users, pagination } });
        return Promise.reject(new Error(`Unhandled GET ${url}`));
    });
};

const getRow = (name) => screen.getByText(name).closest("tr");

describe("AdminUserManagement", () => {
    let user;

    beforeEach(() => {
        vi.clearAllMocks();
        user = userEvent.setup();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("renders stats, charts, and the fetched user row", async () => {
        mockAllGets();
        render(<AdminUserManagement />);

        expect(document.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);

        expect(await screen.findByText("Alice Mentor")).toBeInTheDocument();
        expect(screen.getByText("alice@test.com")).toBeInTheDocument();
        expect(screen.getByText("100")).toBeInTheDocument();
        expect(screen.getByText("+10 this month")).toBeInTheDocument();
        expect(screen.getByTestId("user-growth-chart")).toBeInTheDocument();
        expect(screen.getByTestId("mentor-industry-chart")).toBeInTheDocument();

        const row = getRow("Alice Mentor");
        expect(within(row).getByText("Mentor")).toBeInTheDocument();
        expect(within(row).getByText("Verified")).toBeInTheDocument();
        expect(within(row).getByText("Jan 15, 2026")).toBeInTheDocument();
    });

    it("shows 'No users found.' for an empty list", async () => {
        mockAllGets({ users: [] });
        render(<AdminUserManagement />);

        expect(await screen.findByText("No users found.")).toBeInTheDocument();
    });

    it("shows 'Pending' verification status and a Mentee badge appropriately", async () => {
        mockAllGets({
            users: [{ ...baseUser, roles: ["mentee"], isEmailVerified: false }],
        });
        render(<AdminUserManagement />);

        await screen.findByText("Alice Mentor");
        const row = getRow("Alice Mentor");
        expect(within(row).getByText("Pending")).toBeInTheDocument();
        expect(within(row).getByText("Mentee")).toBeInTheDocument();
    });

    it("renders an avatar image when a profile picture exists", async () => {
        mockAllGets({
            users: [{ ...baseUser, profile: { profilePicture: "https://img/pic.png" } }],
        });
        render(<AdminUserManagement />);

        const img = await screen.findByAltText("Alice Mentor");
        expect(img).toHaveAttribute("src", "https://img/pic.png");
    });

    it("renders initials avatar with '?' fallback when name is missing", async () => {
        mockAllGets({ users: [{ ...baseUser, name: "" }] });
        render(<AdminUserManagement />);

        expect(await screen.findByText("?")).toBeInTheDocument();
    });

    it("toasts an error and stops loading when fetching users fails", async () => {
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/stats") return Promise.resolve({ data: statsPayload });
            if (url === "/admin/user-growth") return Promise.resolve({ data: [] });
            if (url === "/admin/stats/mentor-industries") return Promise.resolve({ data: [] });
            if (url === "/admin/users") return Promise.reject(new Error("users down"));
            return Promise.reject(new Error("unhandled"));
        });
        render(<AdminUserManagement />);

        expect(await screen.findByText("Failed to load users.")).toBeInTheDocument();
    });

    it("logs errors (without crashing) when stats/growth/industry fetches fail", async () => {
        const logger = (await import("../../../utils/logger")).default;
        adminAxiosInstance.get.mockImplementation((url) => {
            if (url === "/admin/stats") return Promise.reject(new Error("stats fail"));
            if (url === "/admin/user-growth") return Promise.reject(new Error("growth fail"));
            if (url === "/admin/stats/mentor-industries") return Promise.reject(new Error("industry fail"));
            if (url === "/admin/users") return Promise.resolve({ data: { users: [baseUser], pagination: usersPagination } });
            return Promise.reject(new Error("unhandled"));
        });
        render(<AdminUserManagement />);

        await screen.findByText("Alice Mentor");
        expect(logger.error).toHaveBeenCalledWith("Error fetching stats", expect.any(Object));
        expect(logger.error).toHaveBeenCalledWith("Failed to fetch growth data", expect.any(Object));
        expect(logger.error).toHaveBeenCalledWith("Failed to fetch industry data", expect.any(Object));
    });

    it("filters by role using the role chips", async () => {
        mockAllGets();
        render(<AdminUserManagement />);
        await screen.findByText("Alice Mentor");

        adminAxiosInstance.get.mockClear();
        await user.click(screen.getByRole("button", { name: "Mentor" }));

        expect(adminAxiosInstance.get).toHaveBeenCalledWith(
            "/admin/users",
            expect.objectContaining({ params: expect.objectContaining({ role: "mentor", page: 1 }) }),
        );
    });

    it("resets to All Roles", async () => {
        mockAllGets();
        render(<AdminUserManagement />);
        await screen.findByText("Alice Mentor");

        adminAxiosInstance.get.mockClear();
        await user.click(screen.getByRole("button", { name: "All Roles" }));

        expect(adminAxiosInstance.get).toHaveBeenCalledWith(
            "/admin/users",
            expect.objectContaining({ params: expect.not.objectContaining({ role: expect.anything() }) }),
        );
    });

    it("debounces the search input and refetches with the query", async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        mockAllGets();
        render(<AdminUserManagement />);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(0);
        });

        const searchInput = screen.getByPlaceholderText("Search by name or email...");
        adminAxiosInstance.get.mockClear();

        await act(async () => {
            fireEvent.change(searchInput, { target: { value: "bob" } });
        });
        await act(async () => {
            await vi.advanceTimersByTimeAsync(400);
        });

        expect(adminAxiosInstance.get).toHaveBeenCalledWith(
            "/admin/users",
            expect.objectContaining({ params: expect.objectContaining({ search: "bob" }) }),
        );
    });

    it("toggles to Blocked Users and shows the Blocked badge, sending deleted:true", async () => {
        // Initial load must return Alice so the page mounts normally...
        mockAllGets();
        render(<AdminUserManagement />);
        await screen.findByText("Alice Mentor");

        // ...then re-mock for the toggled ("blocked") fetch.
        adminAxiosInstance.get.mockClear();
        mockAllGets({ users: [{ ...baseUser, name: "Blocked Bob" }] });
        await user.click(screen.getByRole("button", { name: "Blocked Users" }));

        expect(adminAxiosInstance.get).toHaveBeenCalledWith(
            "/admin/users",
            expect.objectContaining({ params: expect.objectContaining({ deleted: true, page: 1 }) }),
        );
        expect(await screen.findByText("Blocked Bob")).toBeInTheDocument();
        expect(screen.getByText("Blocked")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Unblock/ })).toBeInTheDocument();
    });

    it("paginates when there is more than one page", async () => {
        mockAllGets({ pagination: { total: 40, page: 1, totalPages: 3 } });
        render(<AdminUserManagement />);
        await screen.findByText("Alice Mentor");

        const prevBtn = screen.getByRole("button", { name: /Prev/ });
        const nextBtn = screen.getByRole("button", { name: /Next/ });
        expect(prevBtn).toBeDisabled();
        expect(nextBtn).not.toBeDisabled();

        adminAxiosInstance.get.mockClear();
        await user.click(nextBtn);

        expect(adminAxiosInstance.get).toHaveBeenCalledWith(
            "/admin/users",
            expect.objectContaining({ params: expect.objectContaining({ page: 2 }) }),
        );
    });

    it("hides pagination controls when there's only one page", async () => {
        mockAllGets({ pagination: { total: 1, page: 1, totalPages: 1 } });
        render(<AdminUserManagement />);
        await screen.findByText("Alice Mentor");

        expect(screen.queryByRole("button", { name: /Prev/ })).not.toBeInTheDocument();
    });

    describe("actions (block/unblock/delete)", () => {
        it("blocks a user successfully and shows a success toast", async () => {
            mockAllGets();
            adminAxiosInstance.patch.mockResolvedValue({});
            render(<AdminUserManagement />);
            await screen.findByText("Alice Mentor");

            await user.click(screen.getByRole("button", { name: "Block" }));
            expect(await screen.findByText("Block User Account")).toBeInTheDocument();

            await user.click(screen.getByRole("button", { name: "Yes, Block" }));

            expect(adminAxiosInstance.patch).toHaveBeenCalledWith("/admin/users/u1/block", {});
            expect(await screen.findByText("Alice Mentor has been blocked.")).toBeInTheDocument();
            expect(screen.queryByText("Block User Account")).not.toBeInTheDocument();
        });

        it("shows an error toast when blocking fails, with server message", async () => {
            mockAllGets();
            adminAxiosInstance.patch.mockRejectedValue({ response: { data: { message: "Cannot block admin" } } });
            render(<AdminUserManagement />);
            await screen.findByText("Alice Mentor");

            await user.click(screen.getByRole("button", { name: "Block" }));
            await user.click(screen.getByRole("button", { name: "Yes, Block" }));

            expect(await screen.findByText("Cannot block admin")).toBeInTheDocument();
        });

        it("falls back to a generic error message when the action fails without server details", async () => {
            mockAllGets();
            adminAxiosInstance.patch.mockRejectedValue(new Error("network"));
            render(<AdminUserManagement />);
            await screen.findByText("Alice Mentor");

            await user.click(screen.getByRole("button", { name: "Block" }));
            await user.click(screen.getByRole("button", { name: "Yes, Block" }));

            expect(await screen.findByText("Action failed.")).toBeInTheDocument();
        });

        it("unblocks a user from the Blocked Users tab", async () => {
            mockAllGets();
            render(<AdminUserManagement />);
            await screen.findByText("Alice Mentor");

            adminAxiosInstance.get.mockClear();
            mockAllGets({ users: [{ ...baseUser, name: "Blocked Bob" }] });
            await user.click(screen.getByRole("button", { name: "Blocked Users" }));
            await screen.findByText("Blocked Bob");

            adminAxiosInstance.patch.mockResolvedValue({});
            await user.click(screen.getByRole("button", { name: /Unblock/ }));
            expect(await screen.findByText("Restore User Account")).toBeInTheDocument();

            await user.click(screen.getByRole("button", { name: "Yes, Unblock" }));

            expect(adminAxiosInstance.patch).toHaveBeenCalledWith("/admin/users/u1/unblock", {});
            expect(await screen.findByText("Blocked Bob has been restored.")).toBeInTheDocument();
        });

        it("deletes a user and refreshes industry data", async () => {
            mockAllGets();
            adminAxiosInstance.delete.mockResolvedValue({});
            render(<AdminUserManagement />);
            await screen.findByText("Alice Mentor");

            adminAxiosInstance.get.mockClear();
            await user.click(screen.getByRole("button", { name: "Delete" }));
            expect(await screen.findByText("Delete User Account")).toBeInTheDocument();

            await user.click(screen.getByRole("button", { name: "Yes, Delete" }));

            expect(adminAxiosInstance.delete).toHaveBeenCalledWith("/admin/users/u1");
            expect(await screen.findByText("Alice Mentor has been permanently deleted.")).toBeInTheDocument();
            expect(adminAxiosInstance.get).toHaveBeenCalledWith("/admin/stats/mentor-industries");
        });

        it("cancels the action modal without calling the API", async () => {
            mockAllGets();
            render(<AdminUserManagement />);
            await screen.findByText("Alice Mentor");

            await user.click(screen.getByRole("button", { name: "Delete" }));
            await screen.findByText("Delete User Account");
            await user.click(screen.getByRole("button", { name: "Cancel" }));

            expect(screen.queryByText("Delete User Account")).not.toBeInTheDocument();
            expect(adminAxiosInstance.delete).not.toHaveBeenCalled();
        });

        it("shows a loading state while the action is in flight", async () => {
            mockAllGets();
            let resolvePatch;
            adminAxiosInstance.patch.mockReturnValue(
                new Promise((resolve) => {
                    resolvePatch = resolve;
                }),
            );
            render(<AdminUserManagement />);
            await screen.findByText("Alice Mentor");

            await user.click(screen.getByRole("button", { name: "Block" }));
            const confirmBtn = screen.getByRole("button", { name: "Yes, Block" });
            await user.click(confirmBtn);

            expect(await screen.findByText("Blocking...")).toBeInTheDocument();

            await act(async () => {
                resolvePatch({});
            });
        });
    });
});