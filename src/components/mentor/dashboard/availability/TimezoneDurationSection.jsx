// components/mentor/dashboard/availability/TimezoneDurationSection.jsx
import PropTypes from "prop-types";
const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Sao_Paulo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const DURATION_OPTIONS = [30, 45, 60];

const TimezoneDurationSection = ({
  timezone,
  sessionDurations,
  updateTimezone,
  toggleDuration,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
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
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-slate-800">
          Timezone & Duration
        </h3>
      </div>

      {/* Timezone */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
          Timezone
        </label>
        <select
          value={timezone}
          onChange={(e) => updateTimezone(e.target.value)}
          className="w-full text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-150"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      {/* Session Durations */}
      <div>
        <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
          Session Durations
        </label>
        <div className="flex items-center gap-2">
          {DURATION_OPTIONS.map((duration) => {
            const isSelected = sessionDurations.includes(duration);
            return (
              <button
                key={duration}
                type="button"
                onClick={() => toggleDuration(duration)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 ${
                  isSelected
                    ? "bg-blue-900 text-white shadow-sm shadow-blue-200"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-700"
                }`}
              >
                {duration} min
              </button>
            );
          })}
        </div>
        <p className="text-xs font-medium text-slate-800 mt-2">
          Select the session lengths you want to offer mentees.
        </p>
      </div>
    </div>
  );
};
TimezoneDurationSection.propTypes = {
  timezone: PropTypes.string.isRequired,
  sessionDurations: PropTypes.arrayOf(PropTypes.number).isRequired,
  updateTimezone: PropTypes.func.isRequired,
  toggleDuration: PropTypes.func.isRequired,
};
export default TimezoneDurationSection;
