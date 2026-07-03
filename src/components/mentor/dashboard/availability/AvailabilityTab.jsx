// components/mentor/dashboard/availability/AvailabilityTab.jsx
import { useState } from "react";
import useAvailability from "../../../../hooks/useAvailability";
import CalendarAvailabilitySection from "./CalendarAvailabilitySection";
import TimezoneDurationSection from "./TimezoneDurationSection";
import IntegrationsSection from "./IntegrationsSection";

// ─── Helper: convert "HH:MM" 24h to "h:MM AM/PM" ─────────────────────────────
const formatSlotTime = (timeStr) => {
  if (!timeStr) return "";
  const [hhStr, mm] = timeStr.split(":");
  let hh = parseInt(hhStr, 10);
  const period = hh >= 12 ? "PM" : "AM";
  hh = hh % 12 || 12;
  return `${hh}:${mm} ${period}`;
};

// ─── Busy Conflict Confirmation Modal ────────────────────────────────────────
const BusyConflictModal = ({ conflicts, onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6">
      {/* Icon + Title */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#c2410c"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800">
            Busy Time Conflict
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
            Some of your selected slots overlap with events in your Google
            Calendar.
          </p>
        </div>
      </div>

      {/* Conflict list */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 mb-5 space-y-2 max-h-48 overflow-y-auto">
        {conflicts.map((c, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 shrink-0" />
            <div>
              <span className="text-xs font-bold text-orange-800">
                {c.dateLabel}
              </span>
              <span className="text-xs text-orange-700 ml-1">
                {c.slotTime} conflicts with{" "}
                <span className="font-semibold">{c.busyTime}</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-600 mb-5 leading-relaxed">
        Do you still want to save? Mentees may be able to book you during these
        times even though you have other events scheduled.
      </p>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-semibold px-4 py-2 rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-all duration-150"
        >
          Go Back & Edit
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="text-xs font-bold px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition-all duration-150 shadow-sm"
        >
          Yes, Save Anyway
        </button>
      </div>
    </div>
  </div>
);

// ─── Helper: collect all busy conflicts across all specificDates ──────────────
const collectBusyConflicts = (specificDates, busySlots) => {
  if (!busySlots?.length || !specificDates?.length) return [];

  const conflicts = [];

  for (const dateEntry of specificDates) {
    const dateStr = dateEntry.date;
    const dateLabel = new Date(dateStr + "T00:00:00").toLocaleDateString(
      "en-US",
      {
        weekday: "short",
        month: "short",
        day: "numeric",
      },
    );

    for (const slot of dateEntry.slots) {
      const slotStart = new Date(`${dateStr}T${slot.startTime}:00`);
      const slotEnd = new Date(`${dateStr}T${slot.endTime}:00`);

      for (const busy of busySlots) {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);

        if (slotStart < busyEnd && slotEnd > busyStart) {
          const fmt = (iso) =>
            new Date(iso).toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });

          conflicts.push({
            dateLabel,
            slotTime: `${formatSlotTime(slot.startTime)} – ${formatSlotTime(slot.endTime)}`,
            busyTime: `${fmt(busy.start)} – ${fmt(busy.end)}`,
          });
          break; // one conflict per slot is enough
        }
      }
    }
  }

  return conflicts;
};

// ─── AvailabilityTab ──────────────────────────────────────────────────────────
const AvailabilityTab = () => {
  const {
    availability,
    loading,
    saving,
    msg,
    toggleDuration,
    updateTimezone,
    saveAvailability,
    cancelChanges,
    setSpecificDates,
    setAvailability,
  } = useAvailability();

  // busySlots are lifted up from CalendarAvailabilitySection via callback
  const [busySlots, setBusySlots] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [pendingConflicts, setPendingConflicts] = useState([]);
  // ── NEW: track whether all calendar slots pass validation ──────────────────
  const [isAvailabilityValid, setIsAvailabilityValid] = useState(true);

  const handleConnectionChange = (connected) => {
    setAvailability((prev) => ({
      ...prev,
      googleCalendarConnected: connected,
    }));
  };

  // Intercept save — block if slot errors exist, then check for busy conflicts
  const handleSave = () => {
    // ── Guard: do not save when there are slot validation errors ──────────────
    if (!isAvailabilityValid) return;

    const today = new Date().toISOString().split("T")[0];
    const futureDates = (availability.specificDates || []).filter(
      (d) => d.date >= today,
    );
    const conflicts = collectBusyConflicts(futureDates, busySlots);

    if (conflicts.length > 0) {
      setPendingConflicts(conflicts);
      setShowModal(true);
    } else {
      saveAvailability();
    }
  };

  const handleConfirmSave = () => {
    setShowModal(false);
    saveAvailability();
  };

  const handleCancelModal = () => {
    setShowModal(false);
    setPendingConflicts([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-blue-100 border-t-blue-900 animate-spin" />
          <p className="text-sm font-medium text-slate-500">
            Loading availability...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Busy conflict confirmation modal */}
      {showModal && (
        <BusyConflictModal
          conflicts={pendingConflicts}
          onConfirm={handleConfirmSave}
          onCancel={handleCancelModal}
        />
      )}

      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Availability Settings
          </h1>
          <p className="text-sm text-blue-900 mt-0.5">
            Manage your calendar availability and integrations.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:shrink-0">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isAvailabilityValid}
            className="w-26 flex items-center justify-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-900 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-150 shadow-sm shadow-blue-200"
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
          <button
            type="button"
            onClick={cancelChanges}
            disabled={saving}
            className="w-26 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50 transition-all duration-150"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Status message */}
      {msg.text && (
        <div
          className={`flex items-center gap-2 text-sm font-medium rounded-xl px-4 py-3 border ${
            msg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-600"
          }`}
        >
          <span>{msg.type === "success" ? "✓" : "⚠"}</span>
          {msg.text}
        </div>
      )}

      <CalendarAvailabilitySection
        specificDates={availability.specificDates || []}
        setSpecificDates={setSpecificDates}
        googleCalendarConnected={availability.googleCalendarConnected}
        onBusySlotsChange={setBusySlots}
        sessionDurations={availability.sessionDurations}
        onValidationChange={setIsAvailabilityValid}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TimezoneDurationSection
          timezone={availability.timezone}
          sessionDurations={availability.sessionDurations}
          updateTimezone={updateTimezone}
          toggleDuration={toggleDuration}
        />
        <IntegrationsSection
          googleCalendarConnected={availability.googleCalendarConnected}
          onConnectionChange={handleConnectionChange}
        />
      </div>

      <div className="pt-1 pb-4">
        <p className="text-xs font-medium text-slate-900">
          Changes are saved to your profile and visible to mentees immediately.
        </p>
      </div>
    </div>
  );
};

export default AvailabilityTab;
