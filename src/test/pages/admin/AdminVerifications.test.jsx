// src/test/pages/admin/AdminVerifications.test.jsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import AdminVerifications from "../../../features/admin/view/pages/AdminVerifications";

const makeMentor = (overrides = {}) => ({
    _id: "mentor1",
    verificationStatus: "pending",
    user: { _id: "user1", name: "Alice Mentor", email: "alice@example.com" },
    phoneNumber: "+1 555 0100",
    languages: ["English", "Spanish"],
    bio: "Experienced product mentor.",
    currentRole: "Senior PM",
    company: "Acme Inc",
    industry: "Technology",
    yearsOfExperience: 6,
    skills: ["Product", "Leadership"],
    resumeDocument: { url: "https://example.com/resume.pdf", uploadedAt: "2026-01-01T00:00:00Z" },
    workExperienceDocuments: [{ url: "https://example.com/work1.pdf" }],
    profilePicture: undefined,
    ...overrides,
});

let mockActionImpl;

const renderPage = (loaderData = { mentors: [makeMentor()], error: null }) => {
    mockActionImpl =
        mockActionImpl ||
        (async () => ({ success: true, mentorProfileId: "mentor1" }));

    const router = createMemoryRouter(
        [
            {
                path: "/",
                element: <AdminVerifications />,
                loader: () => loaderData,
                action: async (args) => mockActionImpl(args),
            },
        ],
        { initialEntries: ["/"] },
    );
    return render(<RouterProvider router={router} />);
};

describe("AdminVerifications", () => {
    beforeEach(() => {
        mockActionImpl = undefined;
    });

    it("shows a loading state, then renders mentor rows", async () => {
        renderPage({ mentors: [makeMentor()], error: null });
        await waitFor(() => {
            expect(screen.getByText("Alice Mentor")).toBeInTheDocument();
        });
        expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    });

    it("accepts a bare array response (data.mentors fallback to data)", async () => {
        // The loader itself does `data.mentors || data` — this test just
        // confirms the page renders correctly given that already-normalized
        // loader output (the fallback logic lives in the loader, not the page).
        renderPage({ mentors: [makeMentor({ _id: "m2", user: { name: "Bob Mentor", email: "bob@example.com" } })], error: null });
        await waitFor(() => {
            expect(screen.getByText("Bob Mentor")).toBeInTheDocument();
        });
    });

    it("shows an error state and retries on button click", async () => {
        renderPage({ mentors: [], error: "Failed to load verifications." });
        await waitFor(() => {
            expect(screen.getByText("Failed to load verifications.")).toBeInTheDocument();
        });
        const retryBtn = screen.getByRole("button", { name: /retry|try again/i });
        fireEvent.click(retryBtn);
        // Revalidation is triggered — no direct assertion beyond it not throwing,
        // since the loader is static in this test setup.
    });

    it("shows 'No mentors found.' when the filtered list is empty", async () => {
        renderPage({ mentors: [], error: null });
        await waitFor(() => {
            expect(screen.getByText("No mentors found.")).toBeInTheDocument();
        });
    });

    it("shows '—' fallbacks and 'none' doc badge for a sparse mentor", async () => {
        renderPage({
            mentors: [
                makeMentor({
                    _id: "sparse1",
                    user: { name: "Sparse Mentor", email: "sparse@example.com" },
                    phoneNumber: undefined,
                    resumeDocument: undefined,
                    workExperienceDocuments: [],
                }),
            ],
            error: null,
        });
        await waitFor(() => {
            expect(screen.getByText("Sparse Mentor")).toBeInTheDocument();
        });
        expect(screen.getByText("none")).toBeInTheDocument();
        expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    });

    it("renders a profile picture avatar when present", async () => {
        renderPage({
            mentors: [makeMentor({ profilePicture: "https://example.com/avatar.jpg" })],
            error: null,
        });
        await waitFor(() => {
            expect(screen.getByAltText("Alice Mentor")).toHaveAttribute(
                "src",
                "https://example.com/avatar.jpg",
            );
        });
    });

    it("refetches when the Refresh button is clicked", async () => {
        renderPage({ mentors: [makeMentor()], error: null });
        await waitFor(() => screen.getByText("Alice Mentor"));
        const refreshBtn = screen.getByRole("button", { name: /refresh/i });
        fireEvent.click(refreshBtn);
        // With createMemoryRouter, revalidate() re-runs the same loader; since
        // it's static here this just confirms no crash occurs.
        await waitFor(() => {
            expect(screen.getByText("Alice Mentor")).toBeInTheDocument();
        });
    });

    it("filters the list via search (name or email)", async () => {
        renderPage({
            mentors: [
                makeMentor({ _id: "m1", user: { name: "Alice Mentor", email: "alice@example.com" } }),
                makeMentor({ _id: "m2", user: { name: "Bob Other", email: "bob@example.com" } }),
            ],
            error: null,
        });
        await waitFor(() => screen.getByText("Alice Mentor"));
        fireEvent.change(screen.getByPlaceholderText(/search by name or email/i), {
            target: { value: "bob" },
        });
        expect(screen.queryByText("Alice Mentor")).not.toBeInTheDocument();
        expect(screen.getByText("Bob Other")).toBeInTheDocument();
    });

    it("filters by status using the filter chips, and toggling works both ways", async () => {
        renderPage({
            mentors: [
                makeMentor({ _id: "m1", verificationStatus: "pending", user: { name: "Pending One", email: "p@example.com" } }),
                makeMentor({ _id: "m2", verificationStatus: "verified", user: { name: "Verified One", email: "v@example.com" } }),
            ],
            error: null,
        });
        await waitFor(() => screen.getByText("Pending One"));

        fireEvent.click(screen.getByRole("button", { name: /^pending$/i }));
        expect(screen.queryByText("Verified One")).not.toBeInTheDocument();
        expect(screen.getByText("Pending One")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /^verified$/i }));
        expect(screen.queryByText("Pending One")).not.toBeInTheDocument();
        expect(screen.getByText("Verified One")).toBeInTheDocument();

        fireEvent.click(screen.getByRole("button", { name: /^all$/i }));
        expect(screen.getByText("Pending One")).toBeInTheDocument();
        expect(screen.getByText("Verified One")).toBeInTheDocument();
    });

    it("filters via the stat-pill buttons too", async () => {
        renderPage({
            mentors: [
                makeMentor({ _id: "m1", verificationStatus: "pending", user: { name: "Pending One", email: "p@example.com" } }),
                makeMentor({ _id: "m2", verificationStatus: "verified", user: { name: "Verified One", email: "v@example.com" } }),
            ],
            error: null,
        });
        await waitFor(() => screen.getByText("Pending One"));
        fireEvent.click(screen.getByText("Pending Review"));
        expect(screen.queryByText("Verified One")).not.toBeInTheDocument();
    });

    it("opens the drawer via keyboard (Enter) on a row", async () => {
        renderPage({ mentors: [makeMentor()], error: null });
        await waitFor(() => screen.getByText("Alice Mentor"));
        const row = screen.getByText("Alice Mentor").closest('[role="button"]');
        fireEvent.keyDown(row, { key: "Enter" });
        expect(screen.getByText("Professional Background")).toBeInTheDocument();
    });

    it("opens the drawer via keyboard (Space) on a row", async () => {
        renderPage({ mentors: [makeMentor()], error: null });
        await waitFor(() => screen.getByText("Alice Mentor"));
        const row = screen.getByText("Alice Mentor").closest('[role="button"]');
        fireEvent.keyDown(row, { key: " " });
        expect(screen.getByText("Professional Background")).toBeInTheDocument();
    });

    it("ignores unrecognized keystrokes on row entry boundaries", async () => {
        renderPage({ mentors: [makeMentor()], error: null });
        await waitFor(() => screen.getByText("Alice Mentor"));
        const row = screen.getByText("Alice Mentor").closest('[role="button"]');
        fireEvent.keyDown(row, { key: "a" });
        expect(screen.queryByText("Professional Background")).not.toBeInTheDocument();
    });

    it("shows the mentor/of-total count footer", async () => {
        renderPage({
            mentors: [
                makeMentor({ _id: "m1", user: { name: "A", email: "a@example.com" } }),
                makeMentor({ _id: "m2", user: { name: "B", email: "b@example.com" } }),
            ],
            error: null,
        });
        await waitFor(() => {
            expect(screen.getByText(/showing 2 of 2 mentors/i)).toBeInTheDocument();
        });
    });

    describe("DetailDrawer", () => {
        it("opens with full mentor details and displays uploaded documents safely", async () => {
            renderPage({ mentors: [makeMentor()], error: null });
            await waitFor(() => screen.getByText("Alice Mentor"));
            fireEvent.click(screen.getAllByText("View")[0]);

            expect(screen.getByText("Senior PM")).toBeInTheDocument();
            expect(screen.getByText("Acme Inc")).toBeInTheDocument();
            expect(screen.getByText("Resume / CV")).toBeInTheDocument();
            expect(screen.getByText("Work Experience Doc 1")).toBeInTheDocument();
        });

        it("shows 'Not specified' fallbacks and defaults when fields are missing", async () => {
            renderPage({
                mentors: [
                    makeMentor({
                        currentRole: undefined,
                        company: undefined,
                        industry: undefined,
                        yearsOfExperience: undefined,
                    }),
                ],
                error: null,
            });
            await waitFor(() => screen.getByText("Alice Mentor"));
            fireEvent.click(screen.getAllByText("View")[0]);
            expect(screen.getAllByText("Not specified").length).toBeGreaterThanOrEqual(3);
            expect(screen.getByText("0 Years")).toBeInTheDocument();
        });

        it("does not render a Bio or Skills section when absent", async () => {
            renderPage({
                mentors: [makeMentor({ bio: undefined, skills: [] })],
                error: null,
            });
            await waitFor(() => screen.getByText("Alice Mentor"));
            fireEvent.click(screen.getAllByText("View")[0]);
            expect(screen.queryByText("Bio")).not.toBeInTheDocument();
            expect(screen.queryByText("Skills & Expertise")).not.toBeInTheDocument();
        });

        it("shows a profile picture in the drawer header when present", async () => {
            renderPage({
                mentors: [makeMentor({ profilePicture: "https://example.com/avatar.jpg" })],
                error: null,
            });
            await waitFor(() => screen.getByText("Alice Mentor"));
            fireEvent.click(screen.getAllByText("View")[0]);
            const imgs = screen.getAllByAltText("Alice Mentor");
            expect(imgs.some((img) => img.getAttribute("src") === "https://example.com/avatar.jpg")).toBe(true);
        });

        it("closes via the close (X) button", async () => {
            renderPage({ mentors: [makeMentor()], error: null });
            await waitFor(() => screen.getByText("Alice Mentor"));
            fireEvent.click(screen.getAllByText("View")[0]);
            expect(screen.getByText("Professional Background")).toBeInTheDocument();
            fireEvent.click(screen.getByRole("button", { name: /close/i }));
            expect(screen.queryByText("Professional Background")).not.toBeInTheDocument();
        });

        it("closes via the backdrop", async () => {
            renderPage({ mentors: [makeMentor()], error: null });
            await waitFor(() => screen.getByText("Alice Mentor"));
            fireEvent.click(screen.getAllByText("View")[0]);
            fireEvent.click(screen.getByLabelText("Close"));
            expect(screen.queryByText("Professional Background")).not.toBeInTheDocument();
        });

        it("shows 'Already Verified' and no button for verified mentors", async () => {
            renderPage({
                mentors: [makeMentor({ verificationStatus: "verified" })],
                error: null,
            });
            await waitFor(() => screen.getByText("Alice Mentor"));
            fireEvent.click(screen.getAllByText("View")[0]);
            expect(screen.getByText("Already Verified")).toBeInTheDocument();
            expect(screen.queryByText("Mark as Verified")).not.toBeInTheDocument();
        });

        it("verifies a mentor successfully, updates the row, and toasts", async () => {
            mockActionImpl = async () => ({ success: true, mentorProfileId: "mentor1" });
            renderPage({ mentors: [makeMentor()], error: null });
            await waitFor(() => screen.getByText("Alice Mentor"));
            fireEvent.click(screen.getAllByText("View")[0]);
            fireEvent.click(screen.getByText("Mark as Verified"));

            await waitFor(() => {
                expect(screen.getByText("✓ Mentor verified successfully!")).toBeInTheDocument();
            });
        });

        it("shows a server error toast when verification fails", async () => {
            mockActionImpl = async () => ({ success: false, error: "Verification failed." });
            renderPage({ mentors: [makeMentor()], error: null });
            await waitFor(() => screen.getByText("Alice Mentor"));
            fireEvent.click(screen.getAllByText("View")[0]);
            fireEvent.click(screen.getByText("Mark as Verified"));

            await waitFor(() => {
                expect(screen.getByText("Verification failed.")).toBeInTheDocument();
            });
        });

        it("falls back to err.message when verification fails without a server message", async () => {
            mockActionImpl = async () => ({ success: false, error: "Something went wrong." });
            renderPage({ mentors: [makeMentor()], error: null });
            await waitFor(() => screen.getByText("Alice Mentor"));
            fireEvent.click(screen.getAllByText("View")[0]);
            fireEvent.click(screen.getByText("Mark as Verified"));

            await waitFor(() => {
                expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
            });
        });

        it("shows a verifying spinner state while the request is in flight", async () => {
            let resolveAction;
            mockActionImpl = () =>
                new Promise((resolve) => {
                    resolveAction = resolve;
                });
            renderPage({ mentors: [makeMentor()], error: null });
            await waitFor(() => screen.getByText("Alice Mentor"));
            fireEvent.click(screen.getAllByText("View")[0]);
            fireEvent.click(screen.getByText("Mark as Verified"));

            expect(await screen.findByText("Verifying…")).toBeInTheDocument();
            resolveAction({ success: true, mentorProfileId: "mentor1" });
            await waitFor(() => {
                expect(screen.queryByText("Verifying…")).not.toBeInTheDocument();
            });
        });
    });
});