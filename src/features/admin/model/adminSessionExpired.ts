// Handles an admin 401 that happens mid-session (cookie expired/revoked).

import { resetAdminSessionCache } from "./requireAdminAuth";

export const ADMIN_LOGIN_PATH = "/admin/login";

export interface AdminLoginLocationState {
    from?: string;
    reason?: "session-expired";
}

interface RouterLike {
    state: { location: { pathname: string; search: string } };
    navigate: (
        to: string,
        opts: { replace?: boolean; state?: AdminLoginLocationState },
    ) => Promise<unknown>;
}

export const createAdminUnauthorizedHandler = (router: RouterLike) => () => {
    resetAdminSessionCache();

    const { pathname, search } = router.state.location;
    if (pathname === ADMIN_LOGIN_PATH) return undefined;

    return router.navigate(ADMIN_LOGIN_PATH, {
        replace: true,
        state: { from: `${pathname}${search}`, reason: "session-expired" },
    });
};

export const getSafeAdminReturnPath = (from: unknown): string | null => {
    if (typeof from !== "string") return null;
    if (!from.startsWith("/admin/") || from.startsWith("//")) return null;
    if (from === ADMIN_LOGIN_PATH || from.startsWith(`${ADMIN_LOGIN_PATH}?`)) return null;
    return from;
};