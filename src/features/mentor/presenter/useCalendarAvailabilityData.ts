// src/features/mentor/presenter/useCalendarAvailabilityData.ts

import { useState, useEffect } from "react";
import logger from "@/shared/utils/logger";
import { getGoogleCalendarBusySlots, getGoogleCalendarEvents } from "@/features/mentor/model/availability.api";
import type { BusySlot } from "@/features/mentor/model/availability.types";
import type { CalendarEventItem } from "@/features/mentor/view/components/dashboard/availability/calendarAvailability.utils";

interface UseCalendarAvailabilityDataResult {
    busySlots: BusySlot[];
    calendarEvents: CalendarEventItem[];
}

const useCalendarAvailabilityData = (
    googleCalendarConnected: boolean,
    calYear: number,
    calMonth: number,
    onBusySlotsChange?: (slots: BusySlot[]) => void,
): UseCalendarAvailabilityDataResult => {
    const [busySlots, setBusySlots] = useState<BusySlot[]>([]);
    const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);

    const updateBusySlots = (slots: BusySlot[]) => {
        setBusySlots(slots);
        onBusySlotsChange?.(slots);
    };

    useEffect(() => {
        if (!googleCalendarConnected) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- intentionally syncing local state from an external source (prop/URL), not derivable from render inputs alone
            setBusySlots([]);
            setCalendarEvents([]);
            return;
        }
        const firstDay = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-01`;
        const lastDay = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${new Date(calYear, calMonth + 1, 0).getDate()}`;
        const params = { startDate: firstDay, endDate: lastDay };

        const fetchBusySlots = async () => {
            try {
                const data = await getGoogleCalendarBusySlots(params);
                updateBusySlots(data.busy || []);
            } catch (err) {
                logger.warn("Failed to fetch busy slots:", { err });
            }
        };
        fetchBusySlots();

        const fetchCalendarEvents = async () => {
            try {
                const data = await getGoogleCalendarEvents(params);
                setCalendarEvents((data.events as CalendarEventItem[]) || []);
            } catch (err) {
                logger.warn("Failed to fetch events:", { err });
            }
        };
        fetchCalendarEvents();
        // eslint-disable-next-line react-hooks/exhaustive-deps -- onBusySlotsChange intentionally excluded, matches original component behavior
    }, [googleCalendarConnected, calYear, calMonth]);

    return { busySlots, calendarEvents };
};

export default useCalendarAvailabilityData;