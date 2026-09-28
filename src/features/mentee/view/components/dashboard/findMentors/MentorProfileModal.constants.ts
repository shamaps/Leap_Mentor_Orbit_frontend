// src/features/mentee/view/components/dashboard/findMentors/MentorProfileModal.constants.ts
//
// Non-component values (config, constants, pure helper functions) split out
// of MentorProfileModal.components.tsx so that file can export components
// only — required for react-refresh/only-export-components (Fast Refresh).

import type { PublicTimeSlot } from "@/features/mentor/model/availability.types";

export interface MentorProfile {
    userId?: string | null;
    name?: string;
    currentRole?: string;
    company?: string;
    industry?: string;
    bio?: string;
    hourlyRate?: number;
    avgRating?: number;
    reviewCount?: number;
    yearsOfExperience?: number;
    profilePicture?: string;
    profilePicture56?: string;
    profilePicture80?: string;
    location?: string;
    totalSessions?: number;
}

export interface SelectedSlot extends PublicTimeSlot {
    date: string;
    day?: string;
    displayDate?: string;
}

export const ELIGIBLE_BADGES_CONFIG = [
    { id: "newcomer", title: "Newcomer", icon: "👋", blurb: "Joined LeapMentor", verify: () => true },
    { id: "ten_sessions", title: "10 Sessions", icon: "🎯", blurb: "Completed 10 sessions", verify: (m: MentorProfile) => (m?.totalSessions || 0) >= 10 },
    { id: "top_rated", title: "Top Rated", icon: "⭐", blurb: "Achieved 4.5+ rating", verify: (m: MentorProfile) => (m?.avgRating || 0) >= 4.5 },
    { id: "expert_guide", title: "Expert Guide", icon: "🏆", blurb: "50+ sessions completed", verify: (m: MentorProfile) => (m?.totalSessions || 0) >= 50 }
];

export const SLOT_DOT_KEYS = ["dot-1", "dot-2", "dot-3", "dot-4", "dot-5"];
export const MAX_SLOTS = 5;

export const formatTime = (timeString?: string) => {
    if (!timeString) return "";
    const fragments = timeString.split(":").map(Number);
    const notation = fragments[0] >= 12 ? "PM" : "AM";
    const adjustedHour = fragments[0] % 12 || 12;
    return `${String(adjustedHour).padStart(2, "0")}:${String(fragments[1]).padStart(2, "0")} ${notation}`;
};