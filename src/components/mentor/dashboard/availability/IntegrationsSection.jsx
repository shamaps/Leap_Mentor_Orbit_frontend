// components/mentor/dashboard/availability/IntegrationsSection.jsx
import { useState } from "react";
import * as availabilityApi from "../../../../api/availability.api";
import logger from "../../../../utils/logger";
import PropTypes from "prop-types";
const IntegrationsSection = ({
  googleCalendarConnected,
  onConnectionChange,
}) => {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const data = await availabilityApi.getGoogleCalendarAuthUrl();
      const popup = window.open(data.url, "gcal_auth", "width=500,height=600");

      // Poll for popup closure + backend confirmation
      const poll = setInterval(async () => {
        let isClosed = false;
        try {
          isClosed = popup.closed;
        } catch {
          // COOP blocks access to popup.closed — treat as closed
          isClosed = true;
        }

        if (isClosed) {
          clearInterval(poll);
          try {
            const status = await availabilityApi.getGoogleCalendarStatus();
            if (status?.connected) {
              onConnectionChange(true);
            } else {
              logger.error("Google Calendar not connected after popup closed");
            }
          } catch (e) {
            logger.error("Failed to check calendar status", { err: e });
          }
          setLoading(false);
        }
      }, 800);
      setTimeout(
        () => {
          clearInterval(poll);
          setLoading(false);
        },
        5 * 60 * 1000,
      );
    } catch (err) {
      logger.error("Google Calendar connect failed", { err });
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await availabilityApi.disconnectGoogleCalendar();
      onConnectionChange(false);
    } catch (err) {
      logger.error("Google Calendar disconnect failed", { err });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-blue-900 flex items-center justify-center shrink-0">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-slate-800">Integrations</h3>
      </div>

      {/* Google Calendar row */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
        <div className="flex items-center gap-3">
          {/* Google Calendar icon */}
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2" fill="#4285F4" />
              <rect x="3" y="4" width="18" height="5" rx="1" fill="#1967D2" />
              <text
                x="12"
                y="17"
                textAnchor="middle"
                fill="white"
                fontSize="7"
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                CAL
              </text>
              <line
                x1="8"
                y1="2"
                x2="8"
                y2="6"
                stroke="#1967D2"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <line
                x1="16"
                y1="2"
                x2="16"
                y2="6"
                stroke="#1967D2"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">
              Google Calendar
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${googleCalendarConnected ? "bg-green-500" : "bg-red-400"}`}
              />
              <span
                className={`text-xs font-semibold ${googleCalendarConnected ? "text-green-700" : "text-red-600"}`}
              >
                {googleCalendarConnected ? "Connected" : "Not Connected"}
              </span>
            </div>
          </div>
        </div>

        {/* Connect / Disconnect button */}
        {googleCalendarConnected ? (
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={loading}
            className="text-xs font-bold px-4 py-2 rounded-xl border-2 border-red-300 text-red-600 bg-white hover:bg-red-50 hover:border-red-500 transition-all duration-150 shrink-0 disabled:opacity-50"
          >
            {loading ? "..." : "Disconnect"}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            disabled={loading}
            className="text-xs font-bold px-4 py-2 rounded-xl border-2 border-blue-300 text-blue-700 bg-white hover:bg-blue-50 hover:border-blue-500 transition-all duration-150 shrink-0 disabled:opacity-50"
          >
            {loading ? "Connecting..." : "Connect"}
          </button>
        )}
      </div>

      <p className="text-xs font-medium text-slate-800 mt-3 leading-relaxed">
        Syncing your calendar prevents bookings on times you are busy and
        automatically adds sessions to your schedule.
      </p>
    </div>
  );
};
IntegrationsSection.propTypes = {
  googleCalendarConnected: PropTypes.bool,
  onConnectionChange: PropTypes.func.isRequired,
};
export default IntegrationsSection;
