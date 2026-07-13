// components/mentor/dashboard/availability/CalendarAvailabilitySection.jsx
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import logger from "../../../../utils/logger";
import axiosInstance from "../../../../utils/axiosInstance";
import PropTypes from "prop-types";
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const getTodayLocal = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const toDateStr = (year, month, day) =>
  `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const GRID_7 = {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getOverlappingBusy = (dateStr, slot, busySlots) => {
  if (!busySlots?.length) return [];
  const slotStart = new Date(`${dateStr}T${slot.startTime}:00`);
  const slotEnd = new Date(`${dateStr}T${slot.endTime}:00`);
  return busySlots.filter((busy) => {
    const busyStart = new Date(busy.start);
    const busyEnd = new Date(busy.end);
    return slotStart < busyEnd && slotEnd > busyStart;
  });
};

const formatTime = (isoStr) => {
  if (!isoStr?.includes("T")) return "";
  const d = new Date(isoStr);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const removeSlotById = (day, slotId) => ({
  ...day,
  slots: day.slots.filter((s) => s.id !== slotId),
});

const updateSlotById = (day, slotId, field, value) => ({
  ...day,
  slots: day.slots.map((s) => (s.id === slotId ? { ...s, [field]: value } : s)),
});
const isoToHHMM = (isoStr) => {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const getBusyWindowsForDate = (dateStr, busySlots) => {
  if (!busySlots?.length) return [];
  return busySlots
    .filter((b) => {
      const d = new Date(b.start).toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      });
      return d === dateStr;
    })
    .map((b) => ({
      start: b.start,
      end: b.end,
      startHHMM: isoToHHMM(b.start),
      endHHMM: isoToHHMM(b.end),
      label: `${formatTime(b.start)} – ${formatTime(b.end)}`,
    }));
};

const timeToMins = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const isSlotTooShort = (startTime, endTime, minDuration) => {
  if (!startTime || !endTime) return false;
  const diffMins = timeToMins(endTime) - timeToMins(startTime);
  return diffMins > 0 && diffMins < minDuration;
};

// null = valid, otherwise returns an error string
const getSlotError = (startTime, endTime, minDuration) => {
  if (!startTime || !endTime) return null;
  const diff = timeToMins(endTime) - timeToMins(startTime);
  if (diff === 0) return "Start and end time cannot be the same";
  if (diff < 0) return "End time must be after start time";
  if (minDuration && diff < minDuration)
    return `Minimum slot duration is ${minDuration} min`;
  return null;
};

const getEventsForDate = (dateStr, events) => {
  if (!events?.length) return [];
  return events.filter((e) => {
    if (!e.start) return false;
    if (e.allDay) return e.start === dateStr;
    const localDate = new Date(e.start).toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });
    return localDate === dateStr;
  });
};

// ─── Parse / format "HH:MM" (24h) ────────────────────────────────────────────

/** "14:30" → { hour12: 2, minute: 30, period: "PM" } */
const parse24 = (timeStr) => {
  if (!timeStr) return { hour12: 9, minute: 0, period: "AM" };
  const [h, m] = timeStr.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return { hour12, minute: m, period };
};

/** { hour12, minute, period } → "14:30" */
const format24 = ({ hour12, minute, period }) => {
  let h = hour12 % 12;
  if (period === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const PlusIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const XIcon = ({ size = 10 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
XIcon.propTypes = {
  size: PropTypes.number,
};
const TrashIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

const WarnIcon = () => (
  <svg
    width="9"
    height="9"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const ClockIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

// ─── Custom Time Picker ───────────────────────────────────────────────────────
const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [0, 15, 30, 45]; // quarter-hours only

const parseTyped = (raw) => {
  const s = raw.trim();
  const match = s.match(/^(\d{1,2})[:.]?(\d{2})?\s*(am|pm)?$/i);
  if (!match) return null;
  let hh = Number.parseInt(match[1], 10);
  let mm = match[2] ? Number.parseInt(match[2], 10) : 0;
  const meridian = match[3]?.toLowerCase();

  if (hh > 23 || mm > 59) return null;

  if (meridian === "pm" && hh < 12) hh += 12;
  if (meridian === "am" && hh === 12) hh = 0;

  mm = Math.round(mm / 15) * 15;
  if (mm === 60) {
    mm = 0;
    hh = Math.min(hh + 1, 23);
  }

  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};

const TimePicker = ({ value, onChange, hasError = false }) => {
  const [open, setOpen] = useState(false);
  const [h, setH] = useState(1);
  const [m, setM] = useState(0);
  const [p, setP] = useState("AM");
  const [inputVal, setInputVal] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isEditing) return;
    const parsed = parse24(value);
    setH(parsed.hour12);
    setM(parsed.minute);
    setP(parsed.period);
    const dh = String(parsed.hour12).padStart(2, "0");
    const dm = String(parsed.minute).padStart(2, "0");
    setInputVal(`${dh}:${dm} ${parsed.period}`);
  }, [value, isEditing]);

  useEffect(() => {
    if (!open || !wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const commitParts = (newH, newM, newP) => {
    onChange(format24({ hour12: newH, minute: newM, period: newP }));
  };

  const selectHour = (val) => {
    setH(val);
    commitParts(val, m, p);
  };
  const selectMin = (val) => {
    setM(val);
    commitParts(h, val, p);
  };
  const selectPer = (val) => {
    setP(val);
    commitParts(h, m, val);
  };

  const handleInputFocus = () => {
    setIsEditing(true);
    setOpen(false);
  };
  const handleInputChange = (e) => setInputVal(e.target.value);
  const handleInputBlur = () => {
    setIsEditing(false);
    const parsed = parseTyped(inputVal);
    if (parsed) {
      onChange(parsed);
    } else {
      const cur = parse24(value);
      setInputVal(
        `${String(cur.hour12).padStart(2, "0")}:${String(cur.minute).padStart(2, "0")} ${cur.period}`,
      );
    }
  };
  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setIsEditing(false);
      inputRef.current?.blur();
    }
  };

  const displayH = String(h).padStart(2, "0");
  const displayMin = String(m).padStart(2, "0");

  const dropdown = (
    <div
      ref={dropdownRef}
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
        width: 172,
        zIndex: 9999,
      }}
      className="bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden select-none"
    >
      <div className="grid grid-cols-3 border-b border-slate-100">
        <div className="flex items-center justify-center py-2 bg-blue-900 text-white">
          <span className="text-sm font-bold">{displayH}</span>
        </div>
        <div className="flex items-center justify-center py-2 bg-blue-900 text-white border-l border-blue-800">
          <span className="text-sm font-bold">{displayMin}</span>
        </div>
        <div className="flex items-center justify-center py-2 bg-blue-900 text-white border-l border-blue-800">
          <span className="text-sm font-bold">{p}</span>
        </div>
      </div>

      <div
        className="grid grid-cols-3 divide-x divide-slate-100"
        style={{ maxHeight: "192px" }}
      >
        <div className="overflow-y-auto" style={{ maxHeight: "192px" }}>
          {HOURS.map((hr) => (
            <button
              key={hr}
              type="button"
              onClick={() => selectHour(hr)}
              className={`w-full text-center text-sm py-1.5 transition-colors duration-100
                ${hr === h ? "bg-blue-50 text-blue-900 font-bold" : "text-slate-600 hover:bg-slate-50 font-medium"}`}
            >
              {String(hr).padStart(2, "0")}
            </button>
          ))}
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "192px" }}>
          {MINUTES.map((mn) => (
            <button
              key={mn}
              type="button"
              onClick={() => selectMin(mn)}
              className={`w-full text-center text-sm py-1.5 transition-colors duration-100
                ${mn === m ? "bg-blue-50 text-blue-900 font-bold" : "text-slate-600 hover:bg-slate-50 font-medium"}`}
            >
              {String(mn).padStart(2, "0")}
            </button>
          ))}
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: "192px" }}>
          {["AM", "PM"].map((per) => (
            <button
              key={per}
              type="button"
              onClick={() => selectPer(per)}
              className={`w-full text-center text-sm py-1.5 transition-colors duration-100
                ${per === p ? "bg-blue-50 text-blue-900 font-bold" : "text-slate-600 hover:bg-slate-50 font-medium"}`}
            >
              {per}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  let timeFieldStateClass = "border-slate-200 hover:border-slate-300";
  if (hasError) {
    timeFieldStateClass = "border-red-400 ring-2 ring-red-100";
  } else if (isEditing) {
    timeFieldStateClass = "border-blue-400 ring-2 ring-blue-100";
  }

  return (
    <>
      <div
        ref={wrapperRef}
        className={`flex items-center bg-white border rounded-lg transition-all duration-150 ${timeFieldStateClass}`}
        style={{ width: "120px" }}
      >
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          placeholder="09:00 AM"
          className="w-0 flex-1 text-xs font-medium text-slate-700 bg-transparent outline-none pl-2.5 pr-0 py-1.5"
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setOpen((v) => !v);
            setIsEditing(false);
          }}
          className={`flex items-center justify-center px-2 py-1.5 rounded-r-lg border-l border-slate-200 transition-colors duration-150
            ${open ? "bg-blue-900 text-white" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"}`}
        >
          <ClockIcon />
        </button>
      </div>
      {open && createPortal(dropdown, document.body)}
    </>
  );
};
TimePicker.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  hasError: PropTypes.bool,
};
// ─── EventTooltip ─────────────────────────────────────────────────────────────
const EventTooltip = ({ events, isBusyOnly }) => (
  <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-slate-900 rounded-xl shadow-2xl p-3 pointer-events-none border border-slate-700">
    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">
      Google Calendar
    </div>
    {isBusyOnly ? (
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
        <span className="text-xs font-semibold text-white">Busy</span>
      </div>
    ) : (
      <div className="space-y-2">
        {events.map((e) => (
          <div key={e.id} className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-white leading-tight truncate">
              {e.summary}
            </span>
            {!e.allDay && e.start && (
              <span className="text-[10px] text-slate-400">
                {formatTime(e.start)}
                {e.end ? ` – ${formatTime(e.end)}` : ""}
              </span>
            )}
            {e.allDay && (
              <span className="text-[10px] text-slate-400">All day</span>
            )}
          </div>
        ))}
      </div>
    )}
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-slate-900" />
  </div>
);
EventTooltip.propTypes = {
  events: PropTypes.array,
  isBusyOnly: PropTypes.bool,
};
// ─── CalendarGrid ─────────────────────────────────────────────────────────────
const CalendarGrid = ({
  year,
  month,
  specificDates,
  onToggleDate,
  onNavPrev,
  onNavNext,
  calendarEvents,
  busySlots,
}) => {
  const today = getTodayLocal();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const [hoveredDate, setHoveredDate] = useState(null);

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push({ blank: true, key: `blank-${year}-${month}-${i}` });
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={onNavPrev}
          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-600"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <p className="text-sm font-bold text-slate-800 tracking-wide">
          {MONTHS[month]} {year}
        </p>
        <button
          type="button"
          onClick={onNavNext}
          className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-slate-600"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      <div style={GRID_7} className="mb-1">
        {DAY_LABELS.map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-bold text-slate-700 py-1 uppercase tracking-wide"
          >
            {d}
          </div>
        ))}
      </div>

      <div style={{ ...GRID_7, gap: "3px", overflow: "visible" }}>
        {cells.map((cell) => {
          if (cell?.blank) return <div key={cell.key} />;
          const day = cell;
          const dateStr = toDateStr(year, month, day);
          const isPast = dateStr < today;
          const isToday = dateStr === today;
          const isSelected = specificDates.some((d) => d.date === dateStr);
          const dayEvents = getEventsForDate(dateStr, calendarEvents);
          const hasEvents = dayEvents.length > 0;
          const hasBusy = busySlots?.some((b) => {
            const busyDate = new Date(b.start).toLocaleDateString("en-CA", {
              timeZone: "Asia/Kolkata",
            });
            return busyDate === dateStr;
          });
          const hasIndicator = hasEvents || hasBusy;
          const isHovered = hoveredDate === dateStr;

          let dayCellClass = "text-slate-600 hover:bg-slate-100 hover:text-slate-800";
          if (isPast) {
            dayCellClass = "text-slate-200 cursor-not-allowed";
          } else if (isSelected) {
            dayCellClass = "bg-blue-900 text-white shadow-sm scale-105";
          } else if (isToday) {
            dayCellClass = "bg-blue-50 text-blue-900 ring-1 ring-blue-300 font-bold hover:bg-blue-100";
          }

          let indicatorDotClass = "bg-orange-400";
          if (isPast) {
            indicatorDotClass = "bg-orange-200";
          } else if (isSelected) {
            indicatorDotClass = "bg-yellow-300";
          }

          return (
            <div key={dateStr} className="relative">
              <button
                type="button"
                disabled={isPast}
                onClick={() => !isPast && onToggleDate(dateStr)}
                onMouseEnter={() => hasIndicator && setHoveredDate(dateStr)}
                onMouseLeave={() => setHoveredDate(null)}
                onFocus={() => hasIndicator && setHoveredDate(dateStr)}
                onBlur={() => setHoveredDate(null)}
                style={{ aspectRatio: "1 / 1", width: "100%" }}
                className={`relative rounded-lg text-[11px] font-semibold flex flex-col items-center justify-center transition-all duration-150 ${dayCellClass}`}
              >
                {day}
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {isSelected && (
                    <span className="w-1 h-1 bg-white/70 rounded-full" />
                  )}
                  {hasIndicator && (
                    <span
                      className={`w-1 h-1 rounded-full ${indicatorDotClass}`}
                    />
                  )}
                </div>
              </button>
              {isHovered && hasIndicator && (
                <EventTooltip
                  events={dayEvents}
                  isBusyOnly={!hasEvents && hasBusy}
                />
              )}
            </div>
          );
        })}
      </div>

      {calendarEvents?.length > 0 && (
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            <span className="text-[11px] font-semibold text-slate-800">
              Has events
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
CalendarGrid.propTypes = {
  year: PropTypes.number.isRequired,
  month: PropTypes.number.isRequired,
  specificDates: PropTypes.array.isRequired,
  onToggleDate: PropTypes.func.isRequired,
  onNavPrev: PropTypes.func.isRequired,
  onNavNext: PropTypes.func.isRequired,
  calendarEvents: PropTypes.array,
  busySlots: PropTypes.array,
};
// ─── BusyBadge ────────────────────────────────────────────────────────────────
const BusyBadge = ({ overlaps }) => {
  if (!overlaps?.length) return null;
  return (
    <div className="flex flex-col gap-1">
      {overlaps.map((b) => (
        <span
          key={`${b.start}-${b.end}`}
          className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-700 bg-orange-100 border border-orange-300 rounded-lg px-2.5 py-1 leading-none whitespace-nowrap"
        >
          <WarnIcon />
          Busy&nbsp;·&nbsp;{formatTime(b.start)}–{formatTime(b.end)}
        </span>
      ))}
    </div>
  );
};
BusyBadge.propTypes = {
  overlaps: PropTypes.arrayOf(
    PropTypes.shape({ start: PropTypes.string, end: PropTypes.string }),
  ),
};

// ─── DateSlotEditor ───────────────────────────────────────────────────────────
const DateSlotEditor = ({
  dateEntry,
  onAddSlot,
  onRemoveSlot,
  onUpdateSlot,
  onRemoveDate,
  busySlots,
  minDuration,
}) => {
  const displayStr = new Date(dateEntry.date + "T00:00:00").toLocaleDateString(
    "en-US",
    {
      weekday: "short",
      month: "short",
      day: "numeric",
    },
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Date header row */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
          <span className="text-xs font-bold text-slate-700">{displayStr}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onAddSlot(dateEntry.date)}
            title="Add time slot"
            className="flex items-center gap-1 text-[11px] font-semibold text-white bg-blue-900 hover:bg-blue-800 border border-blue-900 rounded-lg px-2.5 py-1 transition-all duration-150"
          >
            <PlusIcon />
            Add slot
          </button>
          <button
            type="button"
            onClick={() => onRemoveDate(dateEntry.date)}
            title="Remove this date"
            className="flex items-center gap-1 text-[11px] font-semibold text-white bg-red-600 hover:bg-red-700 border border-red-600 rounded-lg px-2.5 py-1 transition-all duration-150"
          >
            <XIcon size={10} />
            Remove
          </button>
        </div>
      </div>

      {/* Slots */}
      <div className="px-3.5 py-2.5 space-y-3">
        {dateEntry.slots.map((slot) => {
          const overlaps = getOverlappingBusy(dateEntry.date, slot, busySlots);
          const isBusy = overlaps.length > 0;
          const slotError = getSlotError(slot.startTime, slot.endTime, minDuration);

          const handleStartChange = (val) => {
            onUpdateSlot(dateEntry.date, slot.id, "startTime", val);
            const endMins = timeToMins(slot.endTime);
            const startMins = timeToMins(val);
            if (startMins >= endMins) {
              const newEnd = startMins + (minDuration || 60);
              const eh = Math.floor(newEnd / 60) % 24;
              const em = newEnd % 60;
              onUpdateSlot(
                dateEntry.date,
                slot.id,
                "endTime",
                `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`,
              );
            }
          };

          const handleEndChange = (val) => {
            onUpdateSlot(dateEntry.date, slot.id, "endTime", val);
          };

          return (
            <div key={slot.id} className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <TimePicker
                  value={slot.startTime}
                  onChange={handleStartChange}
                />
                <span className="text-slate-400 text-xs font-bold select-none">
                  →
                </span>
                <TimePicker
                  value={slot.endTime}
                  onChange={handleEndChange}
                  hasError={!!slotError}
                />

                {isBusy && <BusyBadge overlaps={overlaps} />}

                {dateEntry.slots.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveSlot(dateEntry.date, slot.id)}
                    title="Remove this slot"
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-500 bg-slate-100 border border-slate-300 hover:text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-150 ml-auto"
                  >
                    <XIcon size={10} />
                  </button>
                )}
              </div>

              {/* Inline slot-level error — unchanged */}
              {slotError && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg px-2.5 py-1 w-fit">
                  <WarnIcon />
                  {slotError}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
DateSlotEditor.propTypes = {
  dateEntry: PropTypes.shape({
    date: PropTypes.string.isRequired,
    slots: PropTypes.array.isRequired,
  }).isRequired,
  onAddSlot: PropTypes.func.isRequired,
  onRemoveSlot: PropTypes.func.isRequired,
  onUpdateSlot: PropTypes.func.isRequired,
  onRemoveDate: PropTypes.func.isRequired,
  busySlots: PropTypes.array,
  minDuration: PropTypes.number,
};

// ─── CalendarAvailabilitySection ──────────────────────────────────────────────
const CalendarAvailabilitySection = ({
  specificDates,
  setSpecificDates,
  googleCalendarConnected,
  onBusySlotsChange,
  sessionDurations,
  onValidationChange,
}) => {
  const now = new Date();
  const minDuration = sessionDurations?.length
    ? Math.min(...sessionDurations)
    : 30;
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [busySlots, setBusySlots] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  // Compute validity and notify parent on every change
  const hasInvalidSlots = specificDates.some((d) =>
    d.slots.some(
      (s) => getSlotError(s.startTime, s.endTime, minDuration) !== null,
    ),
  );

  useEffect(() => {
    onValidationChange?.(!hasInvalidSlots);
  }, [hasInvalidSlots, minDuration]);

  const updateBusySlots = (slots) => {
    setBusySlots(slots);
    onBusySlotsChange?.(slots);
  };

  useEffect(() => {
    if (!googleCalendarConnected) {
      setBusySlots([]);
      setCalendarEvents([]);
      return;
    }
    const firstDay = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-01`;
    const lastDay = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${new Date(calYear, calMonth + 1, 0).getDate()}`;
    const params = { startDate: firstDay, endDate: lastDay };

    const fetchBusySlots = async () => {
      try {
        const { data } = await axiosInstance.get("/google-calendar/busy", { params });
        updateBusySlots(data.busy || []);
      } catch (err) {
        logger.error("Failed to fetch busy slots:", { err });
      }
    };
    fetchBusySlots();

    const fetchCalendarEvents = async () => {
      try {
        const { data } = await axiosInstance.get("/google-calendar/events", { params });
        setCalendarEvents(data.events || []);
      } catch (err) {
        logger.error("Failed to fetch events:", { err });
      }
    };
    fetchCalendarEvents();
  }, [googleCalendarConnected, calYear, calMonth]);

  const handleToggleDate = (dateStr) => {
    setSpecificDates((prev) => {
      const exists = prev.find((d) => d.date === dateStr);
      if (exists) return prev.filter((d) => d.date !== dateStr);
      return [
        ...prev,
        { date: dateStr, slots: [{ id: crypto.randomUUID(), startTime: "09:00", endTime: "17:00" }] },
      ].sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const handleRemoveDate = (dateStr) =>
    setSpecificDates((prev) => prev.filter((d) => d.date !== dateStr));
  const handleAddSlot = (dateStr) =>
    setSpecificDates((prev) =>
      prev.map((d) =>
        d.date === dateStr
          ? {
            ...d,
            slots: [...d.slots, { id: crypto.randomUUID(), startTime: "09:00", endTime: "17:00" }],
          }
          : d,
      ),
    );
  const handleRemoveSlot = (dateStr, slotId) =>
    setSpecificDates((prev) =>
      prev.map((d) => (d.date === dateStr ? removeSlotById(d, slotId) : d)),
    );
  const handleUpdateSlot = (dateStr, slotId, field, value) =>
    setSpecificDates((prev) =>
      prev.map((d) => (d.date === dateStr ? updateSlotById(d, slotId, field, value) : d)),
    );

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else setCalMonth((m) => m - 1);
  };
  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else setCalMonth((m) => m + 1);
  };

  const today = getTodayLocal();
  const futureDates = specificDates.filter((d) => d.date >= today);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex flex-col md:flex-row gap-6">
        {/* ── Calendar ── */}
        <div className="w-full md:w-64 md:shrink-0">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-blue-900 flex items-center justify-center shrink-0">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Calendar Availability
              </h3>
              <p className="text-[10px] text-slate-700">
                Click dates to mark available
              </p>
            </div>
          </div>

          <CalendarGrid
            year={calYear}
            month={calMonth}
            specificDates={specificDates}
            onToggleDate={handleToggleDate}
            onNavPrev={handlePrevMonth}
            onNavNext={handleNextMonth}
            calendarEvents={calendarEvents}
            busySlots={busySlots}
          />
        </div>

        {/* Divider */}
        <div className="block md:hidden h-px bg-slate-100 w-full" />
        <div className="hidden md:block w-px bg-slate-100 self-stretch" />

        {/* ── Date slot editor ── */}
        <div className="flex-1 min-w-0">
          {googleCalendarConnected && (
            <div className="flex items-center gap-1.5 mb-3 px-3 py-2 rounded-xl bg-green-50 border border-green-200 w-fit">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <span className="text-xs font-semibold text-green-700">
                Google Calendar synced — hover dates to see events
              </span>
            </div>
          )}

          {futureDates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-10 gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#CBD5E1"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-600">
                  No dates selected
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any future date on the calendar to add availability
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700">
                  {futureDates.length} date{futureDates.length > 1 ? "s" : ""}{" "}
                  selected
                </p>
                <button
                  type="button"
                  onClick={() => setSpecificDates([])}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-300 rounded-lg px-3 py-1.5 transition-all duration-150"
                >
                  <TrashIcon />
                  Clear all
                </button>
              </div>

              <style>{`
                .slot-scroll::-webkit-scrollbar { width: 5px; }
                .slot-scroll::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 99px; }
                .slot-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
                .slot-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
              `}</style>
              <div
                className="slot-scroll space-y-2 overflow-y-auto pr-1"
                style={{ maxHeight: "260px" }}
              >
                {futureDates.map((dateEntry) => (
                  <DateSlotEditor
                    key={dateEntry.date}
                    dateEntry={dateEntry}
                    onAddSlot={handleAddSlot}
                    onRemoveSlot={handleRemoveSlot}
                    onUpdateSlot={handleUpdateSlot}
                    onRemoveDate={handleRemoveDate}
                    busySlots={busySlots}
                    minDuration={minDuration}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
CalendarAvailabilitySection.propTypes = {
  specificDates: PropTypes.array.isRequired,
  setSpecificDates: PropTypes.func.isRequired,
  googleCalendarConnected: PropTypes.bool,
  onBusySlotsChange: PropTypes.func,
  sessionDurations: PropTypes.arrayOf(PropTypes.number),
  onValidationChange: PropTypes.func,
};
export default CalendarAvailabilitySection;