// src/mappers/authMapper.js
// Single seam between backend user shape and frontend user shape.
// If the backend renames/restructures a field, only this file changes.

export function mapUser(rawUser) {
    if (!rawUser) return null;
    return {
        id: rawUser._id ?? rawUser.id,
        name: rawUser.name ?? "",
        email: rawUser.email ?? "",
        roles: rawUser.roles ?? [],
        isVerified: Boolean(rawUser.isVerified),
    };
}

export function mapAuthResponse(raw) {
    return {
        user: mapUser(raw.user),
        accessToken: raw.accessToken ?? null,
        isNewUser: raw.isNewUser ?? true,
    };
}