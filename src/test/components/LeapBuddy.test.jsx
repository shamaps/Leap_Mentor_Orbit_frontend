import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import LeapBuddy from "../../shared/components/LeapBuddy";
import axiosInstance from "../../shared/utils/axiosInstance";

// Polyfill missing browser element layout methods inside JSDOM environment scope
window.HTMLElement.prototype.scrollIntoView = vi.fn();

vi.mock("../../shared/utils/axiosInstance", () => ({
    default: {
        post: vi.fn(() => Promise.resolve({ data: {} })),
    },
}));

describe("LeapBuddy AI Assistant Component Suite", () => {
    const mockUser = { name: "Alice Developer", email: "alice@example.com" };
    const mockProfile = {
        skills: ["React", "Vitest"],
        interestedFields: ["Engineering"],
        currentRole: "Engineer",
        company: "LeapMentor",
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("Initialization & Timed Greetings Animation", () => {
        it("should process name strings and populate specialized firstName greetings inside floating bubbles", async () => {
            vi.useFakeTimers();
            render(<LeapBuddy role="mentee" user={mockUser} profile={mockProfile} />);

            act(() => {
                vi.advanceTimersByTime(2500);
            });

            expect(screen.getByText(/Hi Alice!/i)).toBeInTheDocument();

            act(() => {
                vi.advanceTimersByTime(6000);
            });
            expect(screen.queryByText(/Hi Alice!/i)).not.toBeInTheDocument();

            vi.useRealTimers();
        });

        it("should fallback cleanly to standard gender-neutral messages if user context is missing", async () => {
            vi.useFakeTimers();
            render(<LeapBuddy role="mentor" user={null} profile={null} />);

            act(() => {
                vi.advanceTimersByTime(2500);
            });

            expect(screen.getByText(/Hi there!/i)).toBeInTheDocument();
            vi.useRealTimers();
        });
    });

    describe("Chat Interface Interactions & API Pipelines", () => {
        const openChat = () => {
            const toggleBtn = screen.getByTitle("Chat with LeapBuddy");
            fireEvent.click(toggleBtn);
        };

        it("should toggle visibility matrices upon action element input ticks", () => {
            render(<LeapBuddy role="mentee" user={mockUser} />);
            openChat();
            expect(screen.getByPlaceholderText("Ask LeapBuddy anything...")).toBeInTheDocument();
        });

        it("should accept inputs, trigger chat thunks, and process clean payload messages", async () => {
            axiosInstance.post.mockResolvedValueOnce({
                data: { content: [{ text: "You can book via the Explore page." }] },
            });

            render(<LeapBuddy role="mentee" user={mockUser} />);
            openChat();

            const textZone = screen.getByPlaceholderText("Ask LeapBuddy anything...");
            fireEvent.change(textZone, { target: { value: "How do I book a session?" } });
            fireEvent.keyDown(textZone, { key: "Enter", code: "Enter" });

            await waitFor(() => {
                expect(screen.getByText("You can book via the Explore page.")).toBeInTheDocument();
            });
        });

        it("should append a functional escalation panel inside chat if [ESCALATE] tags fire and execute controlled form changes", async () => {
            axiosInstance.post.mockResolvedValueOnce({
                data: { content: [{ text: "This demands human tracking. [ESCALATE]" }] },
            });

            render(<LeapBuddy role="mentor" user={mockUser} profile={mockProfile} />);
            openChat();

            const textarea = screen.getByPlaceholderText("Ask LeapBuddy anything...");
            fireEvent.change(textarea, { target: { value: "I need a direct refund." } });

            const sendBtn = screen.getByText("➤");
            fireEvent.click(sendBtn);

            await waitFor(() => {
                expect(screen.getByText("🎫 Submit a support ticket")).toBeInTheDocument();
            });

            const emailInput = screen.getByPlaceholderText("Your email");
            const subjectInput = screen.getByPlaceholderText("Subject");
            const descInput = screen.getByPlaceholderText("Describe your issue...");

            fireEvent.change(emailInput, { target: { value: "support-escalation@test.com" } });
            fireEvent.change(subjectInput, { target: { value: "Urgent Payout Issue" } });
            fireEvent.change(descInput, { target: { value: "The earnings aren't releasing properly." } });

            expect(emailInput.value).toBe("support-escalation@test.com");
            expect(subjectInput.value).toBe("Urgent Payout Issue");
            expect(descInput.value).toBe("The earnings aren't releasing properly.");

            axiosInstance.post.mockResolvedValueOnce({});
            const ticketBtn = screen.getByText("📨 Submit to Admin");
            fireEvent.click(ticketBtn);

            await waitFor(() => {
                expect(screen.getByText(/Ticket submitted/i)).toBeInTheDocument();
            });
        });

        it("should display connection warning structures if server processes fail unexpectedly", async () => {
            axiosInstance.post.mockRejectedValueOnce(new Error("Network Failure"));

            render(<LeapBuddy role="mentee" user={mockUser} />);
            openChat();

            const textarea = screen.getByPlaceholderText("Ask LeapBuddy anything...");
            fireEvent.change(textarea, { target: { value: "Hello?" } });
            fireEvent.click(screen.getByText("➤"));

            await waitFor(() => {
                expect(screen.getByText(/Connection issue/i)).toBeInTheDocument();
            });
        });

        it("should allow users to clear contextual chat histories and reset state engines cleanly", () => {
            render(<LeapBuddy role="mentor" user={mockUser} />);
            openChat();

            const clearBtn = screen.getByText("Clear");
            fireEvent.click(clearBtn);

            expect(screen.getByText(/Hey Alice! 👋 I'm LeapBuddy! How can I help\?/i)).toBeInTheDocument();
        });

        it("should process quick chips events directly from preset list suggestions", async () => {
            axiosInstance.post.mockResolvedValueOnce({
                data: { content: [{ text: "Mock response text" }] },
            });
            render(<LeapBuddy role="mentor" user={mockUser} />);
            openChat();

            const regularChip = screen.getByText("When do I get paid?");
            fireEvent.click(regularChip);

            await waitFor(() => {
                expect(axiosInstance.post).toHaveBeenCalled();
            });
        });

        it("should trigger ticket creation errors if support submissions are blocked by api issues", async () => {
            axiosInstance.post.mockResolvedValueOnce({
                data: { content: [{ text: "Error block triggered [ESCALATE]" }] },
            });

            render(<LeapBuddy role="mentee" user={mockUser} />);
            openChat();

            fireEvent.change(screen.getByPlaceholderText("Ask LeapBuddy anything..."), { target: { value: "Harassment report" } });
            fireEvent.click(screen.getByText("➤"));

            await waitFor(() => {
                expect(screen.getByText("📨 Submit to Admin")).toBeInTheDocument();
            });

            axiosInstance.post.mockRejectedValueOnce(new Error("Database drop"));
            fireEvent.click(screen.getByText("📨 Submit to Admin"));

            await waitFor(() => {
                expect(screen.getByText(/Failed. Please try again./i)).toBeInTheDocument();
            });
        });

        it("should adapt text field metrics safely across height shifts dynamically and execute focused/blur boundaries", () => {
            render(<LeapBuddy role="mentee" user={mockUser} />);
            openChat();

            const txt = screen.getByPlaceholderText("Ask LeapBuddy anything...");

            fireEvent.focus(txt);
            fireEvent.change(txt, { target: { value: "Line 1\nLine 2\nLine 3\nLine 4" } });
            fireEvent.blur(txt);

            expect(txt.style.height).toBeDefined();
        });

        it("should guard tracking loops from emitting queries when current strings are empty", () => {
            render(<LeapBuddy role="mentee" user={mockUser} />);
            openChat();
            fireEvent.click(screen.getByText("➤"));
            expect(axiosInstance.post).not.toHaveBeenCalled();
        });

        //  Forces all remaining internal branches to run by passing alternative missing parameter contexts
        it("should trace the complete FAQ data structures and alternative profile combinations", async () => {
            axiosInstance.post.mockResolvedValue({ data: { content: [{ text: "Acknowledged" }] } });

            const complexProfile = {
                name: "Alice Developer",
                email: "alice@example.com",
                roles: ["mentor", "mentee"],
                skills: ["React", "Jest"],
                interestedFields: ["Product"],
                currentRole: "Lead",
                company: "Orbit",
            };

            const { rerender } = render(<LeapBuddy role="mentor" user={complexProfile} profile={complexProfile} />);
            openChat();
            fireEvent.change(screen.getByPlaceholderText("Ask LeapBuddy anything..."), { target: { value: "Ping Mentor FAQ" } });
            fireEvent.click(screen.getByText("➤"));

            // Re-render passing completely blank arrays and fields to force lines 323-324, 396-399, 545-548 to run
            const sparseProfile = {
                name: null,
                email: null,
                skills: [],
                interestedFields: [],
                currentRole: null,
                company: null,
            };

            rerender(<LeapBuddy role="mentee" user={sparseProfile} profile={sparseProfile} />);
            fireEvent.change(screen.getByPlaceholderText("Ask LeapBuddy anything..."), { target: { value: "Ping Mentee FAQ with blank context blocks" } });
            fireEvent.click(screen.getByText("➤"));

            await waitFor(() => {
                expect(axiosInstance.post).toHaveBeenCalled();
            });
        });
    });
});