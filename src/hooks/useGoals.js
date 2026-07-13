// src/hooks/useGoals.js
import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "../context/ToastContext";
import * as goalsApi from "../api/goals.api";
const replaceMilestone = (prev, milestone) =>
  prev.map((m) => (m._id === milestone._id ? milestone : m));

const removeMilestoneById = (prev, milestoneId) =>
  prev.filter((m) => m._id !== milestoneId);

const useGoals = (connectRequestId) => {
  const [goal, setGoal] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const pendingOwnMilestoneAdd = useRef(0);
  const pendingOwnMilestoneToggle = useRef(new Set());
  const pendingOwnMilestoneDelete = useRef(new Set());
  const pendingOwnGoalCreate = useRef(0);
  const pendingOwnGoalUpdate = useRef(0);

  const { showToast } = useToast();
  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  // ── Fetch goal + milestones ───────────────────────────────
  const fetchGoal = useCallback(async () => {
    if (!connectRequestId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await goalsApi.getGoal(connectRequestId);
      setGoal(data.goal);
      setMilestones(data.milestones || []);
    } catch (err) {
      setError(
        err?.response?.data?.message || err.message || "Failed to load goal",
      );
    } finally {
      setLoading(false);
    }
  }, [connectRequestId]);

  useEffect(() => {
    fetchGoal();
  }, [fetchGoal]);

  // ── Socket: join room + listen for real-time goal events ──
  useEffect(() => {
    if (!connectRequestId) return;

    const handleGoalCreated = ({ goal }) => {
      if (pendingOwnGoalCreate.current > 0) {
        pendingOwnGoalCreate.current -= 1;
        return;
      }
      setGoal(goal);
      setMilestones([]);
      showToastRef.current({
        type: "success",
        title: "Goal Set!",
        message: `"${goal.title}"`,
      });
    };

    const handleGoalUpdated = ({ goal }) => {
      if (pendingOwnGoalUpdate.current > 0) {
        pendingOwnGoalUpdate.current -= 1;
        return;
      }
      setGoal(goal);
      showToastRef.current({
        type: "info",
        title: "Goal Updated",
        message: `"${goal.title}"`,
      });
    };

    const handleMilestoneAdded = ({ milestone }) => {
      if (pendingOwnMilestoneAdd.current > 0) {
        pendingOwnMilestoneAdd.current -= 1;
        return;
      }
      setMilestones((prev) => [...prev, milestone]);
      showToastRef.current({
        type: "info",
        title: "Milestone Added",
        message: `"${milestone.title}"`,
      });
    };

    const handleMilestoneUpdated = ({ milestone }) => {
      if (pendingOwnMilestoneToggle.current.has(milestone._id)) {
        pendingOwnMilestoneToggle.current.delete(milestone._id);
        return;
      }
      setMilestones((prev) => replaceMilestone(prev, milestone));
      showToastRef.current({
        type: milestone.isCompleted ? "success" : "warning",
        title: milestone.isCompleted ? "Milestone Completed!" : "Milestone Reopened",
        message: `"${milestone.title}"`,
      });
    };

    const handleMilestoneDeleted = ({ milestoneId }) => {
      if (pendingOwnMilestoneDelete.current.has(milestoneId)) {
        pendingOwnMilestoneDelete.current.delete(milestoneId);
        return;
      }
      setMilestones((prev) => removeMilestoneById(prev, milestoneId));
      showToastRef.current({
        type: "warning",
        title: "Milestone Removed",
        message: "A milestone was deleted",
      });
    };
    const waitForSocket = setInterval(() => {
      if (globalThis.__leapSocket?.connected) {
        clearInterval(waitForSocket);
        globalThis.__leapSocket.emit("join_room", { connectRequestId });
        globalThis.__leapSocket.on("goal_created", handleGoalCreated);
        globalThis.__leapSocket.on("goal_updated", handleGoalUpdated);
        globalThis.__leapSocket.on("milestone_added", handleMilestoneAdded);
        globalThis.__leapSocket.on("milestone_updated", handleMilestoneUpdated);
        globalThis.__leapSocket.on("milestone_deleted", handleMilestoneDeleted);
      }
    }, 200);

    return () => {
      clearInterval(waitForSocket);
      globalThis.__leapSocket?.off("goal_created", handleGoalCreated);
      globalThis.__leapSocket?.off("goal_updated", handleGoalUpdated);
      globalThis.__leapSocket?.off("milestone_added", handleMilestoneAdded);
      globalThis.__leapSocket?.off("milestone_updated", handleMilestoneUpdated);
      globalThis.__leapSocket?.off("milestone_deleted", handleMilestoneDeleted);
    };
  }, [connectRequestId]);

  // ── Create goal ───────────────────────────────────────────
  const createGoal = useCallback(
    async ({ title, description, startDate, endDate }) => {
      setSaving(true);
      setError(null);
      pendingOwnGoalCreate.current += 1;
      try {
        const data = await goalsApi.createGoal({ connectRequestId, title, description, startDate, endDate });
        setGoal(data.goal);
        setMilestones([]);
        return { success: true };
      } catch (err) {
        pendingOwnGoalCreate.current -= 1;
        const msg =
          err?.response?.data?.message ||
          err.message ||
          "Failed to create goal";
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setSaving(false);
      }
    },
    [connectRequestId],
  );

  // ── Update goal ───────────────────────────────────────────
  const updateGoal = useCallback(async (goalId, fields) => {
    setSaving(true);
    setError(null);
    pendingOwnGoalUpdate.current += 1;
    try {
      const data = await goalsApi.updateGoal(goalId, fields);
      setGoal(data.goal);
      return { success: true };
    } catch (err) {
      pendingOwnGoalUpdate.current -= 1;
      const msg =
        err?.response?.data?.message || err.message || "Failed to update goal";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setSaving(false);
    }
  }, []);

  // ── Add milestone ─────────────────────────────────────────
  const addMilestone = useCallback(async (goalId, { title, dueDate }) => {
    setSaving(true);
    setError(null);
    pendingOwnMilestoneAdd.current += 1;
    try {
      const data = await goalsApi.addMilestone(goalId, { title, dueDate });
      setMilestones((prev) => [...prev, data.milestone]);
      return { success: true };
    } catch (err) {
      pendingOwnMilestoneAdd.current -= 1;
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Failed to add milestone";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setSaving(false);
    }
  }, []);

  // ── Toggle milestone (optimistic) ─────────────────────────
  const toggleMilestone = useCallback(async (milestoneId, isCompleted) => {
    pendingOwnMilestoneToggle.current.add(milestoneId);
    setMilestones((prev) =>
      prev.map((m) => (m._id === milestoneId ? { ...m, isCompleted } : m)),
    );
    try {
      const data = await goalsApi.toggleMilestone(milestoneId, isCompleted);
      setMilestones((prev) =>
        prev.map((m) => (m._id === milestoneId ? data.milestone : m)),
      );
    } catch (err) {
      pendingOwnMilestoneToggle.current.delete(milestoneId);
      setMilestones((prev) =>
        prev.map((m) =>
          m._id === milestoneId ? { ...m, isCompleted: !isCompleted } : m,
        ),
      );
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to update milestone",
      );
    }
  }, []);

  // ── Delete milestone (optimistic) ─────────────────────────
  const deleteMilestone = useCallback(async (milestoneId) => {
    pendingOwnMilestoneDelete.current.add(milestoneId);
    let prevMilestones;
    setMilestones((prev) => {
      prevMilestones = prev;
      return prev.filter((m) => m._id !== milestoneId);
    });
    try {
      await goalsApi.deleteMilestone(milestoneId);
      return { success: true };
    } catch (err) {
      pendingOwnMilestoneDelete.current.delete(milestoneId);
      setMilestones((prev) => prevMilestones ?? prev);
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Failed to delete milestone";
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  return {
    goal,
    milestones,
    loading,
    error,
    saving,
    createGoal,
    updateGoal,
    addMilestone,
    toggleMilestone,
    deleteMilestone,
    refetch: fetchGoal,
  };
};

export default useGoals;
