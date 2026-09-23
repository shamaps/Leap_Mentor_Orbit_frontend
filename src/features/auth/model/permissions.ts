// src/features/auth/model/permissions.ts
//
// RBAC permission layer
export const PERMISSIONS = {
    VIEW_MENTOR_DASHBOARD: "view:mentor-dashboard",
    VIEW_MENTEE_DASHBOARD: "view:mentee-dashboard",

    UPLOAD_VERIFICATION_DOCS: "upload:verification-docs",
    MANAGE_MENTOR_PROFILE: "manage:mentor-profile",

    MANAGE_MENTEE_PROFILE: "manage:mentee-profile",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
    mentor: [
        PERMISSIONS.VIEW_MENTOR_DASHBOARD,
        PERMISSIONS.UPLOAD_VERIFICATION_DOCS,
        PERMISSIONS.MANAGE_MENTOR_PROFILE,
    ],
    mentee: [
        PERMISSIONS.VIEW_MENTEE_DASHBOARD,
        PERMISSIONS.MANAGE_MENTEE_PROFILE,
    ],
};

export const getPermissionsForRoles = (roles: string[] = []): Permission[] =>
    [...new Set(roles.flatMap((r) => ROLE_PERMISSIONS[r] ?? []))];

export const hasPermission = (
    roles: string[] = [],
    permission: Permission,
): boolean => getPermissionsForRoles(roles).includes(permission);

export const hasAnyPermission = (
    roles: string[] = [],
    permissions: Permission[],
): boolean => {
    const granted = getPermissionsForRoles(roles);
    return permissions.some((p) => granted.includes(p));
};