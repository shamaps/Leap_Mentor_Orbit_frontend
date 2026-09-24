// src/mappers/menteeMapper.js
// Normalizes the mentee profile response from /mentee-profile/me.
// Unlike mentor, there's a single endpoint and a single flat shape here —
// this mapper's job is just centralizing defaults, not reconciling shapes.
// It must stay lossless: both the edit form and settings form read from it.

// Raw payload is typed loosely on purpose (matches mentorMapper.ts's
// convention) — `unknown` here would make every `raw.field ?? default`
// widen to `{} | typeof default` instead of the plain default's type.
 
export function mapMenteeProfile(raw: Record<string, any> | null | undefined) {
    if (!raw) return null;
    return {
        id: raw._id ?? raw.id ?? null,
        profilePicture: raw.profilePicture160 ?? raw.profilePicture ?? "",
        bio: raw.bio ?? "",
        currentRole: raw.currentRole ?? "",
        company: raw.company ?? "",
        industry: raw.industry ?? "",
        yearsOfExperience: raw.yearsOfExperience ?? "",
        skills: raw.skills ?? [],
        interestedFields: raw.interestedFields ?? [],
        communicationPreferences: raw.communicationPreferences ?? [],
        languages: raw.languages ?? [],
        linkedInUrl: raw.linkedInUrl ?? "",
        portfolioUrl: raw.portfolioUrl ?? "",
        emailNotifications: raw.emailNotifications ?? true,
        marketingPreferences: raw.marketingPreferences ?? false,
        updatedAt: raw.updatedAt ?? null,
    };
}