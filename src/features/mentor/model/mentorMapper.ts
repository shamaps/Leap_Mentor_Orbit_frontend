// src/mappers/mentorMapper.js
// Normalizes mentor-shaped objects from different endpoints into one
// canonical frontend shape. Some endpoints nest the person under `user`
// (e.g. /mentors/search), others return name/email flat on the mentor
// object itself (e.g. referredByProfile on a connect request) — this
// mapper absorbs that difference so components never have to guess.

// Mentor-shaped payloads vary across endpoints (see note above), so we
// type the raw input loosely on purpose rather than pretending to know
// the exact backend shape.
interface RawMentorUser {
    _id?: string;
    name?: string;
    email?: string;
}

interface RawMentor {
    _id?: string;
    id?: string;
    userId?: string | null;
    user?: RawMentorUser | null;
    name?: string;
    email?: string;
    currentRole?: string;
    company?: string;
    industry?: string;
    skills?: string[];
    hourlyRate?: number;
    avgRating?: number;
    yearsOfExperience?: number;
    verificationStatus?: string;
    profilePicture?: string;
    profilePicture56?: string;
    profilePicture80?: string;
    bio?: string;
    reviewCount?: number;
    totalSessions?: number;
    location?: string;
    mentors?: RawMentor[];
    pagination?: { hasMore?: boolean; totalCount?: number } | null;
    mySkills?: string[];
}

function pickName(raw: RawMentor) {
    return raw.user?.name ?? raw.name ?? "";
}

function pickEmail(raw: RawMentor) {
    return raw.user?.email ?? raw.email ?? "";
}

function pickUserId(raw: RawMentor) {
    return raw.user?._id ?? raw.userId ?? raw._id ?? null;
}

// Used for mentor cards / grid / search results — lighter weight.
export function mapMentorCard(raw: RawMentor | null | undefined) {
    if (!raw) return null;
    return {
        id: raw._id ?? raw.id,
        userId: pickUserId(raw),
        name: pickName(raw),
        currentRole: raw.currentRole ?? "",
        company: raw.company ?? "",
        industry: raw.industry ?? "",
        skills: raw.skills ?? [],
        hourlyRate: raw.hourlyRate ?? 0,
        avgRating: raw.avgRating ?? 0,
        yearsOfExperience: raw.yearsOfExperience ?? 0,
        verificationStatus: raw.verificationStatus ?? "unverified",
        profilePicture: raw.profilePicture56 ?? raw.profilePicture ?? "",
    };
}

export function mapMentorSearchResponse(raw: RawMentor) {
    return {
        mentors: (raw.mentors ?? []).map((mentor) => mapMentorCard(mentor)).filter((mentor): mentor is NonNullable<typeof mentor> => mentor !== null),
        pagination: raw.pagination ?? null,
        mySkills: raw.mySkills ?? [],
    };
}

// Used for full profile views — modal, referred-by view, etc.
export function mapMentorFullProfile(raw: RawMentor | null | undefined) {
    if (!raw) return null;
    return {
        ...mapMentorCard(raw),
        email: pickEmail(raw),
        bio: raw.bio ?? "",
        reviewCount: raw.reviewCount ?? 0,
        totalSessions: raw.totalSessions ?? 0,
        location: raw.location ?? "",
        profilePicture: raw.profilePicture80 ?? raw.profilePicture ?? "",
    };
}