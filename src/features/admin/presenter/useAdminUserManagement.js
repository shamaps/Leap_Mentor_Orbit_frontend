// src/features/admin/presenter/useAdminUserManagement.js
import { useState, useEffect, useCallback, useRef } from "react";
import {
  getUserStats,
  getUserGrowthData,
  getMentorIndustryStats,
  getUsers,
  deleteUser,
  blockUser,
  unblockUser,
} from "../model/admin.api";
import logger from "@/shared/utils/logger";

export const useAdminUserManagement = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showBlocked, setShowBlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const [actionModal, setActionModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [toast, setToast] = useState(null);
  const [growthData, setGrowthData] = useState([]);
  const [industryData, setIndustryData] = useState([]);

  const searchTimer = useRef(null);

  // ── Toast ─────────────────────────────────────────────────
  const showToast = ({ message, type = "success" }) => {
    setToast({ msg: message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetchers ──────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    try {
      const res = await getUserStats();
      setStats(res.data);
    } catch (err) {
      logger.error("Error fetching stats", { err });
    }
  }, []);

  const fetchGrowthData = useCallback(async () => {
    try {
      const res = await getUserGrowthData();
      setGrowthData(res.data);
    } catch (err) {
      logger.error("Failed to fetch growth data", { err });
    }
  }, []);

  const fetchIndustryData = useCallback(async () => {
    try {
      const res = await getMentorIndustryStats();
      setIndustryData(res.data);
    } catch (err) {
      logger.error("Failed to fetch industry data", { err });
    }
  }, []);

  const fetchUsers = useCallback(
    async (page = 1, q = search, role = roleFilter, blocked = showBlocked) => {
      try {
        setLoading(true);
        const params = { page, limit: 15 };
        if (q) params.search = q;
        if (role) params.role = role;
        if (blocked) params.deleted = true;

        const res = await getUsers(params);
        setUsers(res.data.users);
        setPagination(res.data.pagination);
      } catch {
        showToast({ message: "Failed to load users.", type: "error" });
      } finally {
        setLoading(false);
      }
    },
    [search, roleFilter, showBlocked],
  );

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchGrowthData();
    fetchIndustryData();
  }, []);

  // ── Handlers ──────────────────────────────────────────────
  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(
      () => fetchUsers(1, val, roleFilter, showBlocked),
      400,
    );
  };

  const handleRoleFilter = (role) => {
    setRoleFilter(role);
    fetchUsers(1, search, role, showBlocked);
  };

  const handleBlockedToggle = (isBlocked) => {
    setShowBlocked(isBlocked);
    fetchUsers(1, search, roleFilter, isBlocked);
  };

  const executeAction = async () => {
    if (!actionModal) return;
    const { user, mode } = actionModal;
    setActionLoading(true);

    try {
      if (mode === "delete") {
        await deleteUser(user._id);
        showToast({ message: `${user.name} has been permanently deleted.` });
      } else if (mode === "block") {
        await blockUser(user._id);
        showToast({ message: `${user.name} has been blocked.` });
      } else if (mode === "unblock") {
        await unblockUser(user._id);
        showToast({ message: `${user.name} has been restored.` });
      }

      setActionModal(null);
      fetchStats();
      fetchUsers(pagination.page);
      if (mode === "delete") fetchIndustryData();
    } catch (err) {
      showToast({ message: err?.response?.data?.message || "Action failed.", type: "error" });
    } finally {
      setActionLoading(false);
    }
  };

  return {
    stats,
    users,
    pagination,
    search,
    roleFilter,
    showBlocked,
    loading,
    actionModal,
    setActionModal,
    actionLoading,
    toast,
    growthData,
    industryData,
    fetchUsers,
    handleSearchChange,
    handleRoleFilter,
    handleBlockedToggle,
    executeAction,
  };
};
