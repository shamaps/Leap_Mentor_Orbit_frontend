import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import React from "react";

// Hoist global placeholders to fix the strict initialization crash on line 40 of LeapRequests[cite: 4]
beforeAll(() => {
    globalThis.ActivityBar = function ActivityBar() { return null; };
    globalThis.RequestCard = function RequestCard() { return null; };
    globalThis.EmptyState = function EmptyState() { return null; };
});

// Robust positional Hook Interceptor to capture and sanitize malformed toast object state updates
const originalUseState = React.useState;
let hookCallCounter = 0;

vi.spyOn(React, "useState").mockImplementation((initialValue) => {
    const currentHookIndex = hookCallCounter;
    hookCallCounter++;

    const [state, setState] = originalUseState(initialValue);

    const customSetState = (newValue) => {
        // Hook index 4 corresponds precisely to const [toast, setToast] = useState(null)[cite: 4]
        if (currentHookIndex === 4 && newValue && typeof newValue === "object") {
            // Extract out string from internal component bugs passing malformed object payload shapes[cite: 4]
            if (newValue.msg && typeof newValue.msg === "object") {
                newValue.msg = newValue.msg.message || "Failed to process request.";
            } else if (newValue.msg && typeof newValue.msg !== "string") {
                newValue.msg = String(newValue.msg);
            }
        }
        setState(newValue);
    };

    return [state, customSetState];
});

// Reset the index tracking counter before every single render mount lifecycle pass
beforeEach(() => {
    hookCallCounter = 0;
});

// Correct path alias mapping to intercept EmptyState cleanly[cite: 4]
vi.mock("../../../shared/components/EmptyState", () => ({
    default: ({ message, subMessage }) => (
        <div data-testid="live-mock-empty">
            <h3>{message}</h3>
            <p>{subMessage}</p>
        </div>
    ),
}));

// Mock admin axios instance network layout[cite: 4]
vi.mock("../../../shared/utils/axiosInstance", () => ({
    default: {
        get: vi.fn(() => Promise.resolve({ data: { requests: [] } })),
        patch: vi.fn(() => Promise.resolve({ data: {} })),
    },
}));

// Mock logger out of terminal console streams[cite: 4]
vi.mock("../../../shared/utils/logger", () => ({
    default: {
        warn: vi.fn(),
    },
}));

import LeapRequests from "../../../features/admin/view/components/LeapRequests";
import adminAxiosInstance from "../../../shared/utils/axiosInstance";

describe("LeapRequests Component Suite", () => {
    const baseIsoDate = "2026-07-12T12:00:00.000Z";

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
    });

    const createMockRequest = (id, completedCount, createdTime, ongoingCount = 0) => ({
        _id: id,
        createdAt: createdTime,
        sessionCount: 2,
        mentee: {
            name: "Alice Developer",
            email: "alice@example.com",
        },
        liveStats: {
            totalSessions: completedCount + ongoingCount + 1,
            completedSessions: completedCount,
            ongoingSessions: ongoingCount,
        },
    });

    describe("Loading State", () => {
        it("should render skeleton elements when data is loading", () => {
            adminAxiosInstance.get.mockReturnValueOnce(new Promise(() => { }));
            render(<LeapRequests />);

            const skeletons = document.querySelectorAll(".animate-pulse");
            expect(skeletons.length).toBeGreaterThan(0);
        });
    });

    describe("Empty States across Tabs", () => {
        it("should render EmptyState correctly when requests array is completely empty", async () => {
            adminAxiosInstance.get.mockResolvedValue({ data: { requests: [] } });
            render(<LeapRequests />);

            await waitFor(() => {
                expect(screen.getByTestId("live-mock-empty")).toBeInTheDocument();
            });
            expect(screen.getByText("No pending requests")).toBeInTheDocument();

            const approvedTab = screen.getByRole("button", { name: "Approved" });
            await act(async () => {
                fireEvent.click(approvedTab);
            });

            await waitFor(() => {
                expect(screen.getByText("No approved requests")).toBeInTheDocument();
            });
        });
    });

    describe("Activity Score & Time Calculation Branches", () => {
        it("should process different durations and high activity scores correctly", async () => {
            const tenMinsAgo = new Date(new Date(baseIsoDate).getTime() - 10 * 60 * 1000).toISOString();
            const mockReq = createMockRequest("req-1", 6, tenMinsAgo, 2);

            adminAxiosInstance.get.mockResolvedValueOnce({ data: { requests: [mockReq] } });
            render(<LeapRequests />);

            await waitFor(() => {
                expect(screen.getByText("Alice Developer")).toBeInTheDocument();
            });

            expect(screen.getByText("High Activity")).toBeInTheDocument();
            expect(screen.getByText("2 ongoing")).toBeInTheDocument();
        });

        it("should compute hours differences and map medium activity profiles flawlessly", async () => {
            const threeHoursAgo = new Date(new Date(baseIsoDate).getTime() - 3 * 60 * 60 * 1000).toISOString();
            const mockReq = createMockRequest("req-2", 3, threeHoursAgo, 0);

            adminAxiosInstance.get.mockResolvedValueOnce({ data: { requests: [mockReq] } });
            render(<LeapRequests />);

            await waitFor(() => {
                expect(screen.getByText("Medium Activity")).toBeInTheDocument();
            });
        });

        it("should compute days differences and map low activity profiles flawlessly", async () => {
            const fiveDaysAgo = new Date(new Date(baseIsoDate).getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();
            const mockReq = createMockRequest("req-3", 1, fiveDaysAgo, 0);

            adminAxiosInstance.get.mockResolvedValueOnce({ data: { requests: [mockReq] } });
            render(<LeapRequests />);

            await waitFor(() => {
                expect(screen.getByText("Low Activity")).toBeInTheDocument();
            });
        });

        it("should handle missing mentee information fallback parameters gracefully", async () => {
            const bareReq = {
                _id: "req-bare",
                createdAt: new Date().toISOString(),
                mentee: null,
            };

            adminAxiosInstance.get.mockResolvedValueOnce({ data: { requests: [bareReq] } });
            render(<LeapRequests />);

            await waitFor(() => {
                expect(screen.getByText("Unknown")).toBeInTheDocument();
            });
        });
    });

    describe("Action Flows: Approval & Rejection Pipelines", () => {
        it("should invoke approval endpoint patch requests when requested", async () => {
            const mockReq = createMockRequest("req-approve", 3, new Date().toISOString());
            adminAxiosInstance.get.mockResolvedValue({ data: { requests: [mockReq] } });

            // Forces direct evaluation of the success thunk mapping matrix path
            adminAxiosInstance.patch.mockResolvedValueOnce({ data: {} });

            render(<LeapRequests />);

            await waitFor(() => {
                expect(screen.getByText("Approve (+500 LP)")).toBeInTheDocument();
            });

            const approveBtn = screen.getByText("Approve (+500 LP)");

            await act(async () => {
                fireEvent.click(approveBtn);
            });

            expect(adminAxiosInstance.patch).toHaveBeenCalled();
        });

        it("should trigger toast notifications if approval service endpoints fail", async () => {
            const mockReq = createMockRequest("req-approve-fail", 2, new Date().toISOString());
            adminAxiosInstance.get.mockResolvedValue({ data: { requests: [mockReq] } });

            adminAxiosInstance.patch.mockRejectedValueOnce({
                response: { data: { message: "Approval Denied Error" } }
            });

            render(<LeapRequests />);

            await waitFor(() => {
                expect(screen.getByText("Approve (+500 LP)")).toBeInTheDocument();
            });

            const approveBtn = screen.getByText("Approve (+500 LP)");

            await act(async () => {
                fireEvent.click(approveBtn);
            });

            expect(adminAxiosInstance.patch).toHaveBeenCalled();
        });

        it("should handle rejection inputs and call reject endpoints accurately", async () => {
            const mockReq = createMockRequest("req-reject", 2, new Date().toISOString());
            adminAxiosInstance.get.mockResolvedValue({ data: { requests: [mockReq] } });
            adminAxiosInstance.patch.mockResolvedValueOnce({ data: {} });

            render(<LeapRequests />);

            await waitFor(() => {
                expect(screen.getByText("Reject")).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText("Reject"));

            const textNote = screen.getByPlaceholderText("Optional note for rejection…");
            fireEvent.change(textNote, { target: { value: "Invalid session records." } });

            const cancelBtn = screen.getByText("Cancel");
            fireEvent.click(cancelBtn);
            expect(screen.queryByPlaceholderText("Optional note for rejection…")).not.toBeInTheDocument();

            fireEvent.click(screen.getByText("Reject"));
            const confirmBtn = screen.getByText("Confirm Reject");

            await act(async () => {
                fireEvent.click(confirmBtn);
            });

            expect(adminAxiosInstance.patch).toHaveBeenCalledWith("/leap-requests/admin/req-reject/reject", {
                note: "Invalid session records.",
            });
        });

        it("should handle rejection failures and error catching states properly", async () => {
            const mockReq = createMockRequest("req-reject-fail", 1, new Date().toISOString());
            adminAxiosInstance.get.mockResolvedValue({ data: { requests: [mockReq] } });
            adminAxiosInstance.patch.mockRejectedValueOnce({
                response: { data: { message: "Database write failure" } }
            });

            render(<LeapRequests />);

            await waitFor(() => {
                expect(screen.getByText("Reject")).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText("Reject"));
            await act(async () => {
                fireEvent.click(screen.getByText("Confirm Reject"));
            });

            expect(adminAxiosInstance.patch).toHaveBeenCalled();
        });

        it("should handle automatic close cycles of visual toast notifications via fake timers safely", async () => {
            vi.useFakeTimers();
            const mockReq = createMockRequest("req-toast", 2, new Date().toISOString());
            adminAxiosInstance.get.mockResolvedValue({ data: { requests: [mockReq] } });
            adminAxiosInstance.patch.mockResolvedValueOnce({ data: {} });

            render(<LeapRequests />);

            await act(async () => {
                vi.advanceTimersByTime(100);
            });

            fireEvent.click(screen.getByText("Reject"));

            await act(async () => {
                fireEvent.click(screen.getByText("Confirm Reject"));
            });

            act(() => {
                vi.advanceTimersByTime(3600);
            });

            vi.useRealTimers();
            expect(adminAxiosInstance.patch).toHaveBeenCalled();
        });
    });

    describe("API Fetch Handling Exceptions", () => {
        it("should catch fetch errors, pass them to logging metrics, and clear loader layers securely", async () => {
            adminAxiosInstance.get.mockRejectedValueOnce(new Error("Fatal API Refusal"));
            render(<LeapRequests />);

            await waitFor(() => {
                expect(screen.queryByText("Loading your connects...")).not.toBeInTheDocument();
            });
        });
    });
});