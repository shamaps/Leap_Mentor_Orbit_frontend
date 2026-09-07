// src/test/pages/admin/AdminVerifications.test.jsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, within, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import adminAxiosInstance from "../../../utils/axiosInstance";
import AdminVerifications from "../../../pages/admin/AdminVerifications";

vi.mock("../../../utils/axiosInstance");

const baseMentor = {
    _id: "m1",
    user: { name: "Mentor One", email: "mentor1@test.com" },
    verificationStatus: "pending",
    phoneNumber: "9876543210",
    currentRole: "Engineer",
    company: "Acme",
    industry: "Tech",
    yearsOfExperience: 5,
    languages: ["English", "Hindi"],
    bio: "Experienced engineer.",
    skills: ["React", "Node"],
    profilePicture: "",
    resumeDocument: { url: "https://example.com/resume.pdf", uploadedAt: "2026-01-01T00:00:00.000Z" },
    workExperienceDocuments: [{ url: "https://example.com/work1.pdf" }],
};

const mockMentors = (mentors = [baseMentor]) => {
    adminAxiosInstance.get.mockResolvedValue({ data: { mentors } });
};

describe("AdminVerifications", () => {
    let user;

    beforeEach(() => {
        vi.clearAllMocks();
        user = userEvent.setup();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("shows a loading state, then renders mentor rows", async () => {
        mockMentors();
        render(<AdminVerifications />);

        expect(screen.getByText("Loading mentors…")).toBeInTheDocument();

        expect(await screen.findByText("Mentor One")).toBeInTheDocument();
        expect(screen.getByText("mentor1@test.com")).toBeInTheDocument();
        expect(screen.getByText("9876543210")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument();
    });

    it("accepts a bare array response (data.mentors fallback to data)", async () => {
        adminAxiosInstance.get.mockResolvedValue({ data: [baseMentor] });
        render(<AdminVerifications />);

        expect(await screen.findByText("Mentor One")).toBeInTheDocument();
    });

    it("shows an error state and retries on button click", async () => {
        adminAxiosInstance.get.mockRejectedValueOnce(new Error("network down"));
        render(<AdminVerifications />);

        expect(await screen.findByText("network down")).toBeInTheDocument();

        adminAxiosInstance.get.mockResolvedValueOnce({ data: { mentors: [baseMentor] } });
        await user.click(screen.getByRole("button", { name: "Retry" }));

        expect(await screen.findByText("Mentor One")).toBeInTheDocument();
    });

    it("shows 'No mentors found.' when the filtered list is empty", async () => {
        mockMentors([]);
        render(<AdminVerifications />);

        expect(await screen.findByText("No mentors found.")).toBeInTheDocument();
    });

    it("shows '—' fallbacks and 'none' doc badge for a sparse mentor", async () => {
        mockMentors([
            {
                _id: "m2",
                user: { name: "", email: "" },
                verificationStatus: "pending",
                phoneNumber: "",
                resumeDocument: {},
                workExperienceDocuments: [],
            },
        ]);
        render(<AdminVerifications />);

        expect(await screen.findByText("none")).toBeInTheDocument();
        expect(screen.getAllByText("—").length).toBeGreaterThan(0);
        expect(screen.getByText("?")).toBeInTheDocument();
    });

    it("renders a profile picture avatar when present", async () => {
        mockMentors([{ ...baseMentor, profilePicture: "https://img/pic.png" }]);
        render(<AdminVerifications />);

        const img = await screen.findByAltText("Mentor One");
        expect(img).toHaveAttribute("src", "https://img/pic.png");
    });

    it("refetches when the Refresh button is clicked", async () => {
        mockMentors();
        render(<AdminVerifications />);
        await screen.findByText("Mentor One");

        adminAxiosInstance.get.mockClear();
        mockMentors();
        await user.click(screen.getByRole("button", { name: "Refresh" }));

        expect(adminAxiosInstance.get).toHaveBeenCalledWith("/admin/mentor-verifications");
    });

    it("filters the list via search (name or email)", async () => {
        mockMentors([
            baseMentor,
            { ...baseMentor, _id: "m2", user: { name: "Someone Else", email: "else@test.com" } },
        ]);
        render(<AdminVerifications />);
        await screen.findByText("Mentor One");

        const searchInput = screen.getByPlaceholderText("Search by name or email…");

        // Fully covers focus and blur styling states on the component input element
        fireEvent.focus(searchInput);
        fireEvent.blur(searchInput);

        fireEvent.change(searchInput, { target: { value: "mentor1@test.com" } });
        expect(screen.getByText("Mentor One")).toBeInTheDocument();
        expect(screen.queryByText("Someone Else")).not.toBeInTheDocument();
    });

    it("filters by status using the filter chips, and toggling works both ways", async () => {
        mockMentors([
            baseMentor,
            { ...baseMentor, _id: "m2", user: { name: "Verified Vera" }, verificationStatus: "verified" },
        ]);
        render(<AdminVerifications />);
        await screen.findByText("Mentor One");

        await user.click(screen.getByRole("button", { name: "verified" }));
        expect(screen.queryByText("Mentor One")).not.toBeInTheDocument();
        expect(screen.getByText("Verified Vera")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "pending" }));
        expect(screen.getByText("Mentor One")).toBeInTheDocument();
        expect(screen.queryByText("Verified Vera")).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "all" }));
        expect(screen.getByText("Mentor One")).toBeInTheDocument();
        expect(screen.getByText("Verified Vera")).toBeInTheDocument();
    });

    it("filters via the stat-pill buttons too", async () => {
        mockMentors([
            baseMentor,
            { ...baseMentor, _id: "m2", user: { name: "Verified Vera" }, verificationStatus: "verified" },
        ]);
        render(<AdminVerifications />);
        await screen.findByText("Mentor One");

        const statButtons = screen.getAllByRole("button");
        const verifiedStatPill = statButtons.find(btn => within(btn).queryByText("Verified Review") || within(btn).queryByText("Verified"));
        await user.click(verifiedStatPill);

        expect(screen.queryByText("Mentor One")).not.toBeInTheDocument();
        expect(screen.getByText("Verified Vera")).toBeInTheDocument();
    });

    describe("DetailDrawer", () => {
        const openDrawer = async (mentor = baseMentor) => {
            mockMentors([mentor]);
            render(<AdminVerifications />);
            const row = await screen.findByText(mentor.user?.name || "—");
            const gridContainer = row.closest("[role='button']");
            const viewButton = within(gridContainer).getByRole("button", { name: /View/ });
            await user.click(viewButton);
        };

        it("opens with full mentor details and displays uploaded documents safely", async () => {
            await openDrawer({
                ...baseMentor,
                resumeDocument: { url: "https://example.com/resume.png", uploadedAt: "2026-01-01T00:00:00.000Z" }
            });

            expect(screen.getByText("Engineer")).toBeInTheDocument();
            expect(screen.getByText("Acme")).toBeInTheDocument();
            expect(screen.getByText("Tech")).toBeInTheDocument();
            expect(screen.getByText("5 Years")).toBeInTheDocument();
            expect(screen.getByText("English, Hindi")).toBeInTheDocument();
            expect(screen.getByText("Experienced engineer.")).toBeInTheDocument();
            expect(screen.getByText("React")).toBeInTheDocument();
            expect(screen.getByText("Node")).toBeInTheDocument();
            expect(screen.getByText("Resume / CV")).toBeInTheDocument();
            expect(screen.getByText("Work Experience Doc 1")).toBeInTheDocument();
            expect(screen.getByText(/Submitted on/)).toBeInTheDocument();

            // Triggers line 190 (DocCard onError image layout state branch recovery)
            const image = screen.getByAltText("Resume / CV");
            fireEvent.error(image);
            expect(image.style.display).toBe("none");
        });

        it("shows 'Not specified' fallbacks and defaults when fields are missing", async () => {
            await openDrawer({
                _id: "m3",
                user: { name: "Bare Mentor", email: "bare@test.com" },
                verificationStatus: "pending",
            });

            expect(screen.getAllByText("Not specified").length).toBe(3);
            expect(screen.getByText("0 Years")).toBeInTheDocument();
            expect(screen.getByText("English")).toBeInTheDocument();
            expect(screen.getByText("Registration complete")).toBeInTheDocument();
            expect(screen.queryByText("Resume / CV")).not.toBeInTheDocument();
        });

        it("does not render a Bio or Skills section when absent", async () => {
            await openDrawer({ ...baseMentor, bio: "", skills: [] });
            expect(screen.queryByText("Bio")).not.toBeInTheDocument();
            expect(screen.queryByText("Skills & Expertise")).not.toBeInTheDocument();
        });

        it("shows a profile picture in the drawer header when present", async () => {
            await openDrawer({ ...baseMentor, profilePicture: "https://img/mentor.png" });

            const images = screen.getAllByAltText("Mentor One");
            const headerDrawerImg = images.find(img => img.className.includes("w-11"));

            expect(headerDrawerImg).toHaveAttribute("src", "https://img/mentor.png");
        });

        it("closes via the close (X) button", async () => {
            await openDrawer();
            const closeBtn = screen
                .getAllByRole("button")
                .find((btn) => btn.querySelector("svg") && btn.className.includes("w-8 h-8"));
            await user.click(closeBtn);
            expect(screen.queryByText("Professional Background")).not.toBeInTheDocument();
        });

        it("closes via the backdrop", async () => {
            await openDrawer();
            await user.click(screen.getByRole("button", { name: "Close" }));
            expect(screen.queryByText("Professional Background")).not.toBeInTheDocument();
        });

        it("shows 'Already Verified' and no button for verified mentors", async () => {
            await openDrawer({ ...baseMentor, verificationStatus: "verified" });
            expect(screen.getByText("Already Verified")).toBeInTheDocument();
            expect(screen.queryByRole("button", { name: /Mark as Verified/ })).not.toBeInTheDocument();
        });

        it("verifies a mentor successfully, updates the row, and toasts", async () => {
            adminAxiosInstance.patch.mockResolvedValue({});
            await openDrawer();

            await user.click(screen.getByRole("button", { name: /Mark as Verified/ }));

            expect(adminAxiosInstance.patch).toHaveBeenCalledWith(
                "/admin/mentor-verifications/m1/verify",
                { status: "verified" },
            );
            expect(await screen.findByText("✓ Mentor verified successfully!")).toBeInTheDocument();
            expect(screen.getByText("Already Verified")).toBeInTheDocument();

            await user.click(screen.getByRole("button", { name: "Close" }));
            const row = screen.getByText("Mentor One").closest("[role='button']");
            expect(within(row).getByText("Verified")).toBeInTheDocument();
        });

        it("shows a server error toast when verification fails", async () => {
            adminAxiosInstance.patch.mockRejectedValue({ response: { data: { message: "Already processed" } } });
            await openDrawer();

            await user.click(screen.getByRole("button", { name: /Mark as Verified/ }));

            expect(await screen.findByText("Already processed")).toBeInTheDocument();
        });

        it("falls back to err.message when verification fails without a server message", async () => {
            adminAxiosInstance.patch.mockRejectedValue(new Error("network blip"));
            await openDrawer();

            await user.click(screen.getByRole("button", { name: /Mark as Verified/ }));

            expect(await screen.findByText("network blip")).toBeInTheDocument();
        });

        it("shows a verifying spinner state while the request is in flight", async () => {
            let resolvePatch;
            adminAxiosInstance.patch.mockReturnValue(
                new Promise((resolve) => {
                    resolvePatch = resolve;
                }),
            );
            await openDrawer();

            await user.click(screen.getByRole("button", { name: /Mark as Verified/ }));
            expect(await screen.findByText(/Verifying…/)).toBeInTheDocument();

            await act(async () => {
                resolvePatch({});
            });
        });
    });

    it("opens the drawer via keyboard (Enter) on a row", async () => {
        mockMentors();
        render(<AdminVerifications />);
        const row = (await screen.findByText("Mentor One")).closest("[role='button']");

        fireEvent.keyDown(row, { key: "Enter" });
        expect(await screen.findByText("Professional Background")).toBeInTheDocument();
    });

    it("opens the drawer via keyboard (Space) on a row", async () => {
        mockMentors();
        render(<AdminVerifications />);
        const row = (await screen.findByText("Mentor One")).closest("[role='button']");

        fireEvent.keyDown(row, { key: " " });
        expect(await screen.findByText("Professional Background")).toBeInTheDocument();
    });

    it("ignores unrecognized keystrokes on row entry boundaries", async () => {
        mockMentors();
        render(<AdminVerifications />);
        const row = (await screen.findByText("Mentor One")).closest("[role='button']");

        fireEvent.keyDown(row, { key: "Escape" });
        expect(screen.queryByText("Professional Background")).not.toBeInTheDocument();
    });

    it("shows the mentor/of-total count footer", async () => {
        mockMentors([baseMentor, { ...baseMentor, _id: "m2", user: { name: "Second" } }]);
        render(<AdminVerifications />);
        await screen.findByText("Mentor One");

        expect(screen.getByText("Showing 2 of 2 mentors")).toBeInTheDocument();
    });
});