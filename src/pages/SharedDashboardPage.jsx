// src/pages/SharedDashboardPage.jsx
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import axiosInstance from "../utils/axiosInstance";
import SharedDashboardLayout from "../components/shared-dashboard/SharedDashboardLayout";

const VALID_TABS = ["overview", "chat", "goals", "notes", "addSession"];

const SharedDashboardPage = () => {
  const { connectRequestId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const token = useSelector((state) => state.auth.token);
  const isBootstrapping = useSelector((state) => state.auth.isBootstrapping); 

  const [connect, setConnect] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    VALID_TABS.includes(tabFromUrl) ? tabFromUrl : "overview"
  );

  const handleSetActiveTab = useCallback((tab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  }, [setSearchParams]);

  const fetchConnect = useCallback(async () => {
    try {
      const res = await axiosInstance.get(
        `/connect-requests/${connectRequestId}/detail`
      );
      setConnect(res.data.connect ?? res.data);
    } catch (err) {
      console.error("❌ fetchConnect error:", err?.response?.status, err?.response?.data);
      const status = err?.response?.status;
      if (status === 401) return navigate("/login");
      if (status === 403) return navigate(-1);
      setError(err?.response?.data?.message || "Failed to load session.");
    } finally {
      setLoading(false);
    }
  }, [connectRequestId, navigate]);

  useEffect(() => {
    // Token exists — fetch immediately
    // (user navigated here from dashboard, token is already in Redux)
    if (token) {
      fetchConnect();
      return;
    }

    //  No token yet — wait for bootstrap to complete
    // (user landed directly on this URL, App.jsx is still refreshing)
    if (isBootstrapping) return; // FIXED: was (!bootstrapped)

    //  Bootstrap done, still no token — not logged in
    navigate("/login");
  }, [token, isBootstrapping, fetchConnect, navigate]); // updated dependency

  const handleAllComplete = useCallback(() => {
    fetchConnect();
  }, [fetchConnect]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-full border-4 border-blue-100 border-t-blue-900 animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading session…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-6 py-4">
            <span className="text-red-500">⚠</span>
            <p className="text-sm text-red-600">{error}</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            ← Go back
          </button>
        </div>
      </div>
    );
  }

  if (!connect) return null;

  return (
    <SharedDashboardLayout
      connect={connect}
      onAllComplete={handleAllComplete}
      activeTab={activeTab}
      setActiveTab={handleSetActiveTab}
    />
  );
};

export default SharedDashboardPage;