// src/test/hooks/useGoals.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useToast } from "../../shared/context/ToastContext";
import * as goalsApi from "../../features/shared-dashboard/model/goals.api";
import useGoals from "../../features/shared-dashboard/presenter/useGoals";

vi.mock("../../shared/context/ToastContext");
vi.mock("../../features/shared-dashboard/model/goals.api");

// Flushes pending microtasks — safe regardless of fake-timer state.
const flush = async () => {
    await act(async () => {
        for (let i = 0; i < 5; i += 1) {
             
            await Promise.resolve();
        }
    });
};

const advance = async (ms) => {
    await act(async () => {
        await vi.advanceTimersByTimeAsync(ms);
    });
};

const createMockSocket = () => {
    const handlers = {};
    return {
        connected: true,
        emit: vi.fn(),
        on: vi.fn((event, cb) => {
            handlers[event] = cb;
        }),
        off: vi.fn((event) => {
            delete handlers[event];
        }),
        __trigger: (event, payload) => handlers[event]?.(payload),
    };
};

describe("useGoals", () => {
    let mockSocket;
    let showToast;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        showToast = vi.fn();
        useToast.mockReturnValue({ showToast });
        mockSocket = createMockSocket();
        globalThis.__leapSocket = mockSocket;
    });

    afterEach(() => {
        globalThis.__leapSocket = null;
        vi.useRealTimers();
    });

    const setupConnected = async (connectRequestId = "req1") => {
        const hookResult = renderHook(() => useGoals(connectRequestId));
        await flush();
        await advance(200);
        return hookResult;
    };

    it("does not fetch when connectRequestId is falsy", async () => {
        const { result } = renderHook(() => useGoals(null));
        await flush();

        expect(goalsApi.getGoal).not.toHaveBeenCalled();
        expect(result.current.loading).toBe(true);
    });

    it("fetches goal and milestones on mount", async () => {
        goalsApi.getGoal.mockResolvedValue({
            goal: { _id: "g1", title: "Learn React" },
            milestones: [{ _id: "m1", title: "Finish hooks" }],
        });

        const { result } = renderHook(() => useGoals("req1"));
        await flush();

        expect(goalsApi.getGoal).toHaveBeenCalledWith("req1");
        expect(result.current.loading).toBe(false);
        expect(result.current.goal).toEqual({ _id: "g1", title: "Learn React" });
        expect(result.current.milestones).toEqual([{ _id: "m1", title: "Finish hooks" }]);
    });

    it("defaults milestones to an empty array when missing", async () => {
        goalsApi.getGoal.mockResolvedValue({ goal: null });

        const { result } = renderHook(() => useGoals("req1"));
        await flush();

        expect(result.current.milestones).toEqual([]);
    });

    it("sets an error message when fetching fails", async () => {
        goalsApi.getGoal.mockRejectedValue({ response: { data: { message: "Not allowed" } } });

        const { result } = renderHook(() => useGoals("req1"));
        await flush();

        expect(result.current.error).toBe("Not allowed");
    });

    it("falls back to err.message, then a generic message, on fetch failure", async () => {
        goalsApi.getGoal.mockRejectedValue(new Error("boom"));

        const { result } = renderHook(() => useGoals("req1"));
        await flush();

        expect(result.current.error).toBe("boom");
    });

    it("joins the socket room and registers listeners once connected", async () => {
        goalsApi.getGoal.mockResolvedValue({ goal: null, milestones: [] });

        await setupConnected();

        expect(mockSocket.emit).toHaveBeenCalledWith("join_room", { connectRequestId: "req1" });
        expect(mockSocket.on).toHaveBeenCalledWith("goal_created", expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith("goal_updated", expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith("milestone_added", expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith("milestone_updated", expect.any(Function));
        expect(mockSocket.on).toHaveBeenCalledWith("milestone_deleted", expect.any(Function));
    });

    it("cleans up socket listeners on unmount", async () => {
        goalsApi.getGoal.mockResolvedValue({ goal: null, milestones: [] });

        const { unmount } = await setupConnected();
        unmount();

        expect(mockSocket.off).toHaveBeenCalledWith("goal_created", expect.any(Function));
        expect(mockSocket.off).toHaveBeenCalledWith("milestone_deleted", expect.any(Function));
    });

    it("handles an incoming goal_created event and toasts", async () => {
        goalsApi.getGoal.mockResolvedValue({ goal: null, milestones: [{ _id: "old" }] });

        const { result } = await setupConnected();

        act(() => mockSocket.__trigger("goal_created", { goal: { _id: "g2", title: "New Goal" } }));

        expect(result.current.goal).toEqual({ _id: "g2", title: "New Goal" });
        expect(result.current.milestones).toEqual([]);
        expect(showToast).toHaveBeenCalledWith({
            type: "success",
            title: "Goal Set!",
            message: '"New Goal"',
        });
    });

    it("swallows a self-originated goal_created event without toasting", async () => {
        goalsApi.getGoal.mockResolvedValue({ goal: { _id: "g1" }, milestones: [] });
        goalsApi.createGoal.mockResolvedValue({ goal: { _id: "g1", title: "Mine" } });

        const { result } = await setupConnected();

        await act(async () => {
            await result.current.createGoal({ title: "Mine" });
        });
        showToast.mockClear();

        act(() => mockSocket.__trigger("goal_created", { goal: { _id: "g1", title: "Mine" } }));

        expect(showToast).not.toHaveBeenCalled();
    });

    it("handles an incoming goal_updated event and toasts", async () => {
        goalsApi.getGoal.mockResolvedValue({ goal: { _id: "g1", title: "Old" }, milestones: [] });

        const { result } = await setupConnected();

        act(() =>
            mockSocket.__trigger("goal_updated", { goal: { _id: "g1", title: "Updated Goal" } }),
        );

        expect(result.current.goal).toEqual({ _id: "g1", title: "Updated Goal" });
        expect(showToast).toHaveBeenCalledWith({
            type: "info",
            title: "Goal Updated",
            message: '"Updated Goal"',
        });
    });

    it("handles an incoming milestone_added event and toasts", async () => {
        goalsApi.getGoal.mockResolvedValue({ goal: { _id: "g1" }, milestones: [] });

        const { result } = await setupConnected();

        act(() =>
            mockSocket.__trigger("milestone_added", { milestone: { _id: "m1", title: "New MS" } }),
        );

        expect(result.current.milestones).toEqual([{ _id: "m1", title: "New MS" }]);
        expect(showToast).toHaveBeenCalledWith({
            type: "info",
            title: "Milestone Added",
            message: '"New MS"',
        });
    });

    it("handles an incoming milestone_updated event as completed and toasts success", async () => {
        goalsApi.getGoal.mockResolvedValue({
            goal: { _id: "g1" },
            milestones: [{ _id: "m1", title: "MS", isCompleted: false }],
        });

        const { result } = await setupConnected();

        act(() =>
            mockSocket.__trigger("milestone_updated", {
                milestone: { _id: "m1", title: "MS", isCompleted: true },
            }),
        );

        expect(result.current.milestones[0].isCompleted).toBe(true);
        expect(showToast).toHaveBeenCalledWith({
            type: "success",
            title: "Milestone Completed!",
            message: '"MS"',
        });
    });

    it("handles an incoming milestone_updated event as reopened and toasts warning", async () => {
        goalsApi.getGoal.mockResolvedValue({
            goal: { _id: "g1" },
            milestones: [{ _id: "m1", title: "MS", isCompleted: true }],
        });

        const { result } = await setupConnected();

        act(() =>
            mockSocket.__trigger("milestone_updated", {
                milestone: { _id: "m1", title: "MS", isCompleted: false },
            }),
        );

        expect(result.current.milestones[0].isCompleted).toBe(false);
        expect(showToast).toHaveBeenCalledWith({
            type: "warning",
            title: "Milestone Reopened",
            message: '"MS"',
        });
    });

    it("swallows a self-originated milestone_updated event without toasting", async () => {
        goalsApi.getGoal.mockResolvedValue({
            goal: { _id: "g1" },
            milestones: [{ _id: "m1", title: "MS", isCompleted: false }],
        });
        goalsApi.toggleMilestone.mockResolvedValue({
            milestone: { _id: "m1", title: "MS", isCompleted: true },
        });

        const { result } = await setupConnected();

        await act(async () => {
            await result.current.toggleMilestone("m1", true);
        });
        showToast.mockClear();

        act(() =>
            mockSocket.__trigger("milestone_updated", {
                milestone: { _id: "m1", title: "MS", isCompleted: true },
            }),
        );

        expect(showToast).not.toHaveBeenCalled();
    });

    it("handles an incoming milestone_deleted event and toasts", async () => {
        goalsApi.getGoal.mockResolvedValue({
            goal: { _id: "g1" },
            milestones: [{ _id: "m1" }, { _id: "m2" }],
        });

        const { result } = await setupConnected();

        act(() => mockSocket.__trigger("milestone_deleted", { milestoneId: "m1" }));

        expect(result.current.milestones).toEqual([{ _id: "m2" }]);
        expect(showToast).toHaveBeenCalledWith({
            type: "warning",
            title: "Milestone Removed",
            message: "A milestone was deleted",
        });
    });

    it("swallows a self-originated milestone_deleted event without toasting", async () => {
        goalsApi.getGoal.mockResolvedValue({
            goal: { _id: "g1" },
            milestones: [{ _id: "m1" }],
        });
        goalsApi.deleteMilestone.mockResolvedValue();

        const { result } = await setupConnected();

        await act(async () => {
            await result.current.deleteMilestone("m1");
        });
        showToast.mockClear();

        act(() => mockSocket.__trigger("milestone_deleted", { milestoneId: "m1" }));

        expect(showToast).not.toHaveBeenCalled();
    });

    it("createGoal succeeds and replaces goal/milestones", async () => {
        goalsApi.getGoal.mockResolvedValue({ goal: null, milestones: [] });
        goalsApi.createGoal.mockResolvedValue({ goal: { _id: "g1", title: "New" } });

        const { result } = renderHook(() => useGoals("req1"));
        await flush();

        let response;
        await act(async () => {
            response = await result.current.createGoal({
                title: "New",
                description: "d",
                startDate: "s",
                endDate: "e",
            });
        });

        expect(goalsApi.createGoal).toHaveBeenCalledWith({
            connectRequestId: "req1",
            title: "New",
            description: "d",
            startDate: "s",
            endDate: "e",
        });
        expect(response).toEqual({ success: true });
        expect(result.current.goal).toEqual({ _id: "g1", title: "New" });
        expect(result.current.milestones).toEqual([]);
        expect(result.current.saving).toBe(false);
    });

    it("createGoal returns an error on failure", async () => {
        goalsApi.getGoal.mockResolvedValue({ goal: null, milestones: [] });
        goalsApi.createGoal.mockRejectedValue({ response: { data: { message: "dup goal" } } });

        const { result } = renderHook(() => useGoals("req1"));
        await flush();

        let response;
        await act(async () => {
            response = await result.current.createGoal({ title: "New" });
        });

        expect(response).toEqual({ success: false, error: "dup goal" });
        expect(result.current.error).toBe("dup goal");
    });

    it("updateGoal succeeds and updates goal", async () => {
        goalsApi.getGoal.mockResolvedValue({ goal: { _id: "g1", title: "Old" }, milestones: [] });
        goalsApi.updateGoal.mockResolvedValue({ goal: { _id: "g1", title: "New" } });

        const { result } = renderHook(() => useGoals("req1"));
        await flush();

        let response;
        await act(async () => {
            response = await result.current.updateGoal("g1", { title: "New" });
        });

        expect(goalsApi.updateGoal).toHaveBeenCalledWith("g1", { title: "New" });
        expect(response).toEqual({ success: true });
        expect(result.current.goal).toEqual({ _id: "g1", title: "New" });
    });

    it("updateGoal returns a fallback error message on failure", async () => {
        goalsApi.getGoal.mockResolvedValue({ goal: { _id: "g1" }, milestones: [] });
        goalsApi.updateGoal.mockRejectedValue(new Error());

        const { result } = renderHook(() => useGoals("req1"));
        await flush();

        let response;
        await act(async () => {
            response = await result.current.updateGoal("g1", {});
        });

        expect(response).toEqual({ success: false, error: "Failed to update goal" });
    });

    it("addMilestone succeeds and appends the new milestone", async () => {
        goalsApi.getGoal.mockResolvedValue({ goal: { _id: "g1" }, milestones: [] });
        goalsApi.addMilestone.mockResolvedValue({ milestone: { _id: "m1", title: "MS" } });

        const { result } = renderHook(() => useGoals("req1"));
        await flush();

        let response;
        await act(async () => {
            response = await result.current.addMilestone("g1", { title: "MS", dueDate: "d" });
        });

        expect(goalsApi.addMilestone).toHaveBeenCalledWith("g1", { title: "MS", dueDate: "d" });
        expect(response).toEqual({ success: true });
        expect(result.current.milestones).toEqual([{ _id: "m1", title: "MS" }]);
    });

    it("addMilestone returns an error on failure", async () => {
        goalsApi.getGoal.mockResolvedValue({ goal: { _id: "g1" }, milestones: [] });
        goalsApi.addMilestone.mockRejectedValue({ response: { data: { message: "limit reached" } } });

        const { result } = renderHook(() => useGoals("req1"));
        await flush();

        let response;
        await act(async () => {
            response = await result.current.addMilestone("g1", { title: "MS" });
        });

        expect(response).toEqual({ success: false, error: "limit reached" });
    });

    it("toggleMilestone optimistically updates then confirms with server response", async () => {
        goalsApi.getGoal.mockResolvedValue({
            goal: { _id: "g1" },
            milestones: [{ _id: "m1", title: "MS", isCompleted: false }],
        });
        goalsApi.toggleMilestone.mockResolvedValue({
            milestone: { _id: "m1", title: "MS", isCompleted: true, updatedAt: "t" },
        });

        const { result } = renderHook(() => useGoals("req1"));
        await flush();

        await act(async () => {
            await result.current.toggleMilestone("m1", true);
        });

        expect(goalsApi.toggleMilestone).toHaveBeenCalledWith("m1", true);
        expect(result.current.milestones[0]).toEqual({
            _id: "m1",
            title: "MS",
            isCompleted: true,
            updatedAt: "t",
        });
    });

    it("toggleMilestone rolls back optimistic update and sets error on failure", async () => {
        goalsApi.getGoal.mockResolvedValue({
            goal: { _id: "g1" },
            milestones: [{ _id: "m1", title: "MS", isCompleted: false }],
        });
        goalsApi.toggleMilestone.mockRejectedValue({ response: { data: { message: "toggle fail" } } });

        const { result } = renderHook(() => useGoals("req1"));
        await flush();

        await act(async () => {
            await result.current.toggleMilestone("m1", true);
        });

        expect(result.current.milestones[0].isCompleted).toBe(false);
        expect(result.current.error).toBe("toggle fail");
    });

    it("deleteMilestone optimistically removes and confirms on success", async () => {
        goalsApi.getGoal.mockResolvedValue({
            goal: { _id: "g1" },
            milestones: [{ _id: "m1" }, { _id: "m2" }],
        });
        goalsApi.deleteMilestone.mockResolvedValue();

        const { result } = renderHook(() => useGoals("req1"));
        await flush();

        let response;
        await act(async () => {
            response = await result.current.deleteMilestone("m1");
        });

        expect(goalsApi.deleteMilestone).toHaveBeenCalledWith("m1");
        expect(response).toEqual({ success: true });
        expect(result.current.milestones).toEqual([{ _id: "m2" }]);
    });

    it("deleteMilestone rolls back to previous list and sets error on failure", async () => {
        // Real timers + a delayed rejection: the hook captures the previous
        // milestones list via a side-effecting setState updater, which React's
        // scheduler flushes on its own timing. An instantly-rejecting mock can
        // race ahead of that flush (something that wouldn't happen with a real
        // network call), so we delay the rejection by a tick to match reality.
        vi.useRealTimers();

        goalsApi.getGoal.mockResolvedValue({
            goal: { _id: "g1" },
            milestones: [{ _id: "m1" }, { _id: "m2" }],
        });
        goalsApi.deleteMilestone.mockImplementation(
            () =>
                new Promise((_, reject) => {
                    setTimeout(() => reject(new Error("delete broke")), 0);
                }),
        );

        const { result } = renderHook(() => useGoals("req1"));
        await flush();

        let response;
        await act(async () => {
            response = await result.current.deleteMilestone("m1");
        });

        expect(response).toEqual({ success: false, error: "delete broke" });
        expect(result.current.milestones).toEqual([{ _id: "m1" }, { _id: "m2" }]);
    });

    it("refetch re-invokes getGoal", async () => {
        goalsApi.getGoal
            .mockResolvedValueOnce({ goal: null, milestones: [] })
            .mockResolvedValueOnce({ goal: { _id: "g1" }, milestones: [] });

        const { result } = renderHook(() => useGoals("req1"));
        await flush();
        expect(result.current.goal).toBeNull();

        await act(async () => {
            await result.current.refetch();
        });

        expect(result.current.goal).toEqual({ _id: "g1" });
        expect(goalsApi.getGoal).toHaveBeenCalledTimes(2);
    });
});