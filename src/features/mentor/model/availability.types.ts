// src/features/mentor/model/availability.types.ts
//
// Single source of truth for availability-related shapes on the frontend.
// SessionDuration is a literal union (not `number`) so that any array literal
// containing a value outside the allowed set fails at COMPILE time instead of
// surfacing as a 400 from the backend at runtime.
//
// NOTE: this union must be kept in sync with the backend validator
// (currently [30, 60, 90]). If the backend contract changes, update it here
// first — every consumer (TimezoneDurationSection, useAvailability, etc.)
// will then get a compile error pointing at the exact lines to fix.

export type SessionDuration = 30 | 60 | 90;

export const SESSION_DURATION_OPTIONS: readonly SessionDuration[] = [30, 60, 90] as const;

export interface TimeSlot {
    id: string;
    startTime: string; // "HH:mm", 24h
    endTime: string;   // "HH:mm", 24h
}

export interface SpecificDate {
    date: string; // "YYYY-MM-DD"
    slots: TimeSlot[];
}

export interface AvailabilityState {
    timezone: string;
    sessionDurations: SessionDuration[];
    googleCalendarConnected: boolean;
    specificDates: SpecificDate[];
}

// Payload sent to PATCH /availability/me
export interface AvailabilityPayload {
    timezone: string;
    sessionDurations: SessionDuration[];
    specificDates: SpecificDate[];
}

// Shape returned by GET /availability/me (partial — server may omit fields
// that were never set, hence Partial)
export type AvailabilityResponse = Partial<AvailabilityState>;

export interface BusySlot {
    start: string; // ISO datetime
    end: string;   // ISO datetime
}

export interface CalendarEvent {
    id: string;
    start: string;
    end: string;
    title?: string;
}

// Enriched shapes returned specifically by the PUBLIC booking-slots endpoint
// (/availability/:mentorUserId/slots). Unlike the raw settings shape above,
// this endpoint is purpose-built to power the "book a session" UI, so it may
// enrich each slot/date with presentation and booking-status fields that the
// raw AvailabilityState/SpecificDate shape doesn't have. These are optional
// since we can't guarantee the backend always populates them — callers must
// still fall back gracefully (see MentorProfileModal.tsx).
export interface PublicTimeSlot extends TimeSlot {
    isBooked?: boolean;
}

export interface PublicSpecificDate extends Omit<SpecificDate, "slots"> {
    day?: string;         // e.g. "Monday"
    displayDate?: string; // e.g. "Monday, Sep 14"
    slots: PublicTimeSlot[];
}

export interface GoogleCalendarStatus {
    connected: boolean;
    email?: string;
}