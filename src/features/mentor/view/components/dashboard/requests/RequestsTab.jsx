// src/components/mentor/dashboard/requests/RequestsTab.jsx
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchIncomingRequests,
  updateRequestStatus,
} from "@/app/store/slices/connectRequestsSlice";
import {
  selectIncomingRequests,
  selectConnectRequestsLoading,
  selectConnectRequestsInitialLoad,
  selectConnectRequestsError,
} from "@/app/store/selectors";
import RequestCard from "./RequestCard";
import EmptyState from "@/shared/components/EmptyState";
import MenteeProfileModal from "./MenteeProfileModal";
import ErrorState from "@/shared/components/ErrorState";
const TABS = [
  { key: "all", label: "All Requests" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "rejected", label: "Rejected" },
  { key: "referred", label: "Referred" },
  { key: "ongoing", label: "Ongoing" },
  { key: "completed", label: "Completed" },
];

const RequestsTab = () => {
  const dispatch = useDispatch();
  const requests = useSelector(selectIncomingRequests);
  const loading = useSelector(selectConnectRequestsLoading);
  const initialLoad = useSelector(selectConnectRequestsInitialLoad);
  const error = useSelector(selectConnectRequestsError);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedRequest, setSelectedRequest] = useState(null);

  //  socket listener now dispatches the thunk instead of calling a local fetch fn
  useEffect(() => {
    const handleRequestChanged = () => dispatch(fetchIncomingRequests());

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
  }, [dispatch]);

  //only fetch on mount if we've never loaded this slice before —
  // the socket listener above keeps it fresh after that, so remounting
  // this tab (switching away and back) no longer re-hits the API.
  useEffect(() => {
    if (initialLoad) {
      dispatch(fetchIncomingRequests());
    }
  }, [dispatch, initialLoad]);

  const handleUpdate = (id, newStatus) => {
    dispatch(updateRequestStatus({ id, newStatus }));
  };

  const filtered =
    activeTab === "all"
      ? requests
      : requests.filter((r) => r.status === activeTab);

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    accepted: requests.filter((r) => r.status === "accepted").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
    referred: requests.filter((r) => r.status === "referred").length,
    ongoing: requests.filter((r) => r.status === "ongoing").length,
    completed: requests.filter((r) => r.status === "completed").length,
  };

  if (loading && initialLoad) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-blue-100 border-t-blue-900 animate-spin" />
          <p className="text-sm text-slate-400 font-medium">
            Loading requests...
          </p>
        </div>
      </div>
    );
  }
  const SUB_MESSAGES = {
    pending: "You'll see new requests here when mentees reach out.",
    referred: "Requests you've referred to other mentors will appear here.",
    all: "When mentees send you connect requests, they'll appear here.",
  };
  const emptyStateSubMessage = SUB_MESSAGES[activeTab] || `No requests have been ${activeTab} yet.`;
  const getTabBadgeClass = (isActive, tabKey) => {
    if (isActive) return "bg-blue-900 text-white";
    if (tabKey === "referred") return "bg-violet-100 text-violet-600";
    return "bg-slate-100 text-slate-500";
  };
  return (
    <>
      <div className="w-full space-y-5">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Mentee Requests
            </h1>
            <p className="text-sm text-blue-900 mt-0.5">
              Manage your incoming and active mentorship connections.
            </p>
          </div>
          {requests.length > 0 && (
            <span className="self-start sm:self-auto text-xs font-bold text-blue-900 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full shrink-0">
              {requests.length} total
            </span>
          )}
        </div>

        {/* ── Error ── */}
        {error && (
          <ErrorState message={error} onAction={() => dispatch(fetchIncomingRequests())} compact />
        )}

        {/* ── Tabs ── */}
        <div className="w-full border-b border-slate-100">
          <div className="flex overflow-x-auto scrollbar-none">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 sm:flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-150 border-b-2 whitespace-nowrap ${
                  activeTab === tab.key
                    ? "text-blue-900 border-blue-900 bg-blue-50/50"
                    : "text-slate-700 border-transparent hover:text-blue-900 hover:bg-slate-50"
                }`}
              >
                {tab.label}
                {counts[tab.key] > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${getTabBadgeClass(activeTab === tab.key, tab.key)}`}
                  >
                    {counts[tab.key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Cards ── */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            }
            message={activeTab === "all" ? "No requests yet" : `No ${activeTab} requests`}
            subMessage={emptyStateSubMessage}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((request) => (
              <RequestCard
                key={request._id}
                request={request}
                onViewProfile={(r) => setSelectedRequest(r)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedRequest && (
        <MenteeProfileModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdate={(id, status) => {
            handleUpdate(id, status);
            setSelectedRequest(null);
          }}
        />
      )}
    </>
  );
};

export default RequestsTab;
