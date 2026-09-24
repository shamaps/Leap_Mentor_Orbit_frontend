// src/features/admin/presenter/useAdminLayout.js
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentAdmin, getPendingLeapRequestsCount, logoutAdmin } from "../model/admin.api";
import logger from "@/shared/utils/logger";

export const useAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingWalletCount, setPendingWalletCount] = useState(0);
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState({ name: "Admin" });

  useEffect(() => {
    const fetchAdminUser = async () => {
      try {
        const res = await getCurrentAdmin();
        setAdminUser(res.data.admin || { name: "Admin" });
      } catch {
        // silent — name just shows as "Admin" if fails
      }
    };
    fetchAdminUser();
  }, []);

  // ── Fetch pending wallet request count for sidebar badge ──
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const res = await getPendingLeapRequestsCount();
        setPendingWalletCount(res.data.count ?? 499);
      } catch {
        // silent — badge just won't show if this fails
      }
    };

    fetchPendingCount();
    // Re-poll every 60 seconds so badge stays fresh
    const interval = setInterval(fetchPendingCount, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await logoutAdmin();
    } catch (err) {
      // even if request fails, redirect to login
      logger.error("[AdminLayout] Logout request failed", {
        status: err?.response?.status,
        message: err.message,
      });
    }
    navigate("/admin/login");
  };

  const closeSidebar = () => setSidebarOpen(false);

  return {
    sidebarOpen,
    setSidebarOpen,
    pendingWalletCount,
    adminUser,
    handleLogout,
    closeSidebar,
  };
};
