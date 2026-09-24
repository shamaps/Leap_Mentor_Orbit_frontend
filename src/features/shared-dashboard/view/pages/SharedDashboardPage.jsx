// src/pages/SharedDashboardPage.jsx
import { useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchSharedConnect } from "@/app/store/slices/sharedConnectSlice";
import SharedDashboardLayout from "@/features/shared-dashboard/view/components/SharedDashboardLayout.jsx";
import {
  selectAuthToken,
  selectIsBootstrapping,
  selectSharedConnect,
} from "@/app/store/selectors";
import NotFound from "@/shared/marketing/NotFound";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
const VALID_TABS =new Set( ["overview", "chat", "goals", "notes", "addSession"]);
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;
const SharedDashboardPage = () => {
  const { connectRequestId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const isValidId = OBJECT_ID_REGEX.test(connectRequestId);
  const token = useSelector(selectAuthToken);
  const isBootstrapping = useSelector(selectIsBootstrapping);
  const { connect, loading, error } = useSelector(selectSharedConnect);

  const tabFromUrl = searchParams.get("tab");
  const activeTab = VALID_TABS.has(tabFromUrl) ? tabFromUrl : "overview";

  const handleSetActiveTab = useCallback(
    (tab) => {
      setSearchParams({ tab }, { replace: true });
    },
    [setSearchParams],
  );

  const fetchConnect = useCallback(() => {
    dispatch(fetchSharedConnect(connectRequestId)).then((result) => {
      if (fetchSharedConnect.rejected.match(result)) {
        const reason = result.payload?.reason;
        if (reason === "unauthorized") return navigate("/login");
        if (reason === "forbidden") return navigate(-1);
      }
    });
  }, [connectRequestId, dispatch, navigate]);

  useEffect(() => {
    if (!isValidId) return;  
    if (token) {
      fetchConnect();
      return;
    }
    if (isBootstrapping) return;
    navigate("/login");
  }, [isValidId, token, isBootstrapping, fetchConnect, navigate]);

  const handleAllComplete = useCallback(() => {
    fetchConnect();
  }, [fetchConnect]);
  if (!isValidId) {
    return <NotFound />;
  }
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
      onAllComplete={handleAllComplete}
      activeTab={activeTab}
      setActiveTab={handleSetActiveTab}
    />
  );
};

export default SharedDashboardPage;
