// src/mappers/mentorMapper.js
// Normalizes mentor-shaped objects from different endpoints into one
// canonical frontend shape. Some endpoints nest the person under `user`
// (e.g. /mentors/search), others return name/email flat on the mentor
// object itself (e.g. referredByProfile on a connect request) — this
// mapper absorbs that difference so components never have to guess.

function pickName(raw) {
    return raw.user?.name ?? raw.name ?? "";
}

function pickEmail(raw) {
    return raw.user?.email ?? raw.email ?? "";
}

function pickUserId(raw) {
    return raw.user?._id ?? raw.userId ?? raw._id ?? null;
}

// Used for mentor cards / grid / search results — lighter weight.
export function mapMentorCard(raw) {
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

export function mapMentorSearchResponse(raw) {
    return {
        mentors: (raw.mentors ?? []).map(mapMentorCard),
        pagination: raw.pagination ?? null,
        mySkills: raw.mySkills ?? [],
    };
}

// Used for full profile views — modal, referred-by view, etc.
export function mapMentorFullProfile(raw) {
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