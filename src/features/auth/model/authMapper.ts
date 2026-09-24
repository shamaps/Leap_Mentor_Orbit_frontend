// src/mappers/authMapper.ts
// Single seam between backend user shape and frontend user shape.
// If the backend renames/restructures a field, only this file changes.

export interface RawUser {
    _id?: string;
    id?: string;
    name?: string;
    email?: string;
    roles?: string[];
    isVerified?: boolean;
    [key: string]: unknown;
}

export interface MappedUser {
    id?: string;
    name: string;
    email: string;
    roles: string[];
    isVerified: boolean;
    [key: string]: unknown;
}

export interface RawAuthResponse {
    user?: RawUser;
    accessToken?: string | null;
    isNewUser?: boolean;
}

export interface MappedAuthResponse {
    user: MappedUser | null;
    accessToken: string | null;
    isNewUser: boolean;
}

export function mapUser(rawUser?: RawUser | null): MappedUser | null {
    if (!rawUser) return null;
    return {
        id: rawUser._id ?? rawUser.id,
        name: rawUser.name ?? "",
        email: rawUser.email ?? "",
        roles: rawUser.roles ?? [],
        isVerified: Boolean(rawUser.isVerified),
    };
}

export function mapAuthResponse(raw: RawAuthResponse): MappedAuthResponse {
    return {
        user: mapUser(raw.user),
        accessToken: raw.accessToken ?? null,
        isNewUser: raw.isNewUser ?? true,
    };
}