// src/features/admin/presenter/useAdminLayout.js
import { useState, useEffect } from "react";
import { useNavigate, useNavigation, useLocation } from "react-router-dom";
import { getCurrentAdmin, getPendingLeapRequestsCount, logoutAdmin } from "../model/admin.api";
import { resetAdminSessionCache } from "../model/requireAdminAuth";
import getErrorMessage, { getHttpErrorStatus } from "@/shared/utils/getErrorMessage";
import logger from "@/shared/utils/logger";

export const useAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingWalletCount, setPendingWalletCount] = useState(0);
  const navigate = useNavigate();
  const navigation = useNavigation();
  const location = useLocation();
  const [adminUser, setAdminUser] = useState<{ name: string; email?: string }>({ name: "Admin" });
  const isNavigating =
    navigation.state !== "idle" &&
    navigation.location?.pathname === location.pathname;
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
        status: getHttpErrorStatus(err),
        message: getErrorMessage(err),
      });
    }
    // Invalidate the cached session check regardless of whether the
    // logout request itself succeeded — the client is done being "admin".
    resetAdminSessionCache();
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
    isNavigating,
  };
};