// src/mappers/connectRequestMapper.ts
// Connect-request objects come from 3 endpoints (my-requests, incoming,
// ongoing) but are the same underlying document at different lifecycle
// stages. This mapper is additive/lossless — it spreads the raw object
// through untouched (many components still read _id, mentor.name, etc.
// directly) and only centralizes the two things that were being
// hand-rolled inconsistently across components: which slot to show for
// a given status, and the referred-mentor profile shape.

import { mapMentorFullProfile } from "@/features/mentor/model/mentorMapper";

export interface ConnectSlot {
    day: string;
    date: string;
    startTime: string;
    endTime: string;
    [key: string]: unknown;
}

export interface ConnectPerson {
    _id: string;
    name: string;
    email?: string;
    [key: string]: unknown;
}

export interface ConnectPersonInfo {
    currentRole?: string;
    company?: string;
    skills?: string[];
    profilePicture?: string;
    [key: string]: unknown;
}

export interface RawConnectRequest {
    _id: string;
    status: string;
    selectedSlots?: ConnectSlot[];
    confirmedSlot?: ConnectSlot | null;
    referredTo?: ConnectPerson | null;
    referredToProfile?: Record<string, unknown>;
    referredBy?: ConnectPerson | null;
    referredByProfile?: Record<string, unknown>;
    mentor?: ConnectPerson | null;
    mentorProfile?: ConnectPersonInfo | null;
    mentee?: ConnectPerson | null;
    menteeProfile?: ConnectPersonInfo | null;
    totalAmount?: number;
    [key: string]: unknown;
}

export interface MappedConnectRequest extends RawConnectRequest {
    selectedSlots: ConnectSlot[];
    confirmedSlot: ConnectSlot | null;
    displaySlot: ConnectSlot | null;
    referredMentor: ReturnType<typeof mapMentorFullProfile> | null;
    referredByMentor: ReturnType<typeof mapMentorFullProfile> | null;
}

// Same "which slot to show" logic that lived inline in RequestCard.jsx
export function pickDisplaySlot(request: RawConnectRequest): ConnectSlot | null {
    const { status, selectedSlots = [], confirmedSlot } = request;
    if (status === "pending") return selectedSlots[0] ?? null;
    return confirmedSlot ?? selectedSlots[0] ?? null;
}

// Builds the same shape mapMentorFullProfile produces, from the split
// {referredBy/referredTo} + {referredByProfile/referredToProfile} fields
// a connect request stores referral snapshots in. Replaces the object
// that RequestCard.jsx and DetailDrawer.jsx were each hand-rolling.
export function mapReferredMentor(
    person: ConnectPerson | null | undefined,
    profile: Record<string, unknown> | undefined,
) {
    if (!person) return null;
    return mapMentorFullProfile({
        ...profile,
        _id: person._id,
        name: person.name,
        email: person.email,
    });
}

export function mapConnectRequest(raw: RawConnectRequest | null | undefined): MappedConnectRequest | null {
    if (!raw) return null;
    return {
        ...raw,
        selectedSlots: raw.selectedSlots ?? [],
        confirmedSlot: raw.confirmedSlot ?? null,
        displaySlot: pickDisplaySlot(raw),
        referredMentor: mapReferredMentor(raw.referredTo, raw.referredToProfile),
        referredByMentor: mapReferredMentor(raw.referredBy, raw.referredByProfile),
    };
}

export function mapConnectRequestList(rawList: RawConnectRequest[] = []): (MappedConnectRequest | null)[] {
    return rawList.map(mapConnectRequest);
}