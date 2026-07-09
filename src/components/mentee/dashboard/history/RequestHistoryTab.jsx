// src/components/mentee/dashboard/history/RequestHistoryTab.jsx
import useRequestHistory from "../../../../hooks/useRequestHistory";
import { useEffect } from "react";
import { TABS } from "./constants";
import HistoryTable from "./HistoryTable";
import DetailDrawer from "./DetailDrawer";
import TabLoader from "../../../common/TabLoader";
const RequestHistoryTab = () => {
  const {
    filtered,
    counts,
    loading,
    error,
    activeTab,
    setActiveTab,
    selected,
    setSelected,
    deleteRequest,
    updateRequest,
    fetchRequests,
  } = useRequestHistory();

  useEffect(() => {
    const handleRequestChanged = () => fetchRequests();

    const waitForSocket = setInterval(() => {
      if (globalThis.__leapSocket?.connected) {
        clearInterval(waitForSocket);
        globalThis.__leapSocket.on("request_status_changed", handleRequestChanged);
      }
    }, 200);

    return () => {
      clearInterval(waitForSocket);
      globalThis.__leapSocket?.off("request_status_changed", handleRequestChanged);
    };
  }, [fetchRequests]);

  if (loading) {
    return <TabLoader message="Loading your history..." />;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Request History</h1>
        <p className="text-sm text-blue-900 mt-0.5">
          Manage and track your mentor outreach and collaboration requests.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3">
          <span>⚠</span> {error}
        </div>
      )}

      {/* Filter tabs — full width */}
      <div className="w-full border-b border-slate-100">
        <div className="flex w-full">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                setSelected(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold transition-all duration-150 border-b-2 ${
                activeTab === tab.key
                  ? "text-blue-900 border-blue-900 bg-blue-50/50"
                  : "text-slate-700 border-transparent hover:text-blue-900 hover:bg-slate-50"
              }`}
            >
              {tab.label}
              {counts[tab.key] > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === tab.key
                      ? "bg-blue-900 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {counts[tab.key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <HistoryTable
        requests={filtered}
        selected={selected}
        onSelect={setSelected}
        onDelete={deleteRequest}
      />

      {/* Drawer */}
      <DetailDrawer
        request={selected}
        onClose={() => setSelected(null)}
        onDelete={deleteRequest}
        onUpdateRequest={updateRequest}
      />
    </div>
  );
};

export default RequestHistoryTab;
