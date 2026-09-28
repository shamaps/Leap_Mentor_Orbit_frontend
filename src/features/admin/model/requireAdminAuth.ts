import { redirect } from "react-router-dom";
import { getCurrentAdmin } from "./admin.api";

// Cached so multiple loaders firing in parallel for the same navigation
// only trigger one network call, not one per loader.
let sessionCheck: Promise<boolean> | null = null;

export function resetAdminSessionCache() {
    sessionCheck = null;
}

async function checkAdminSession(): Promise<boolean> {
    sessionCheck ??= getCurrentAdmin()
        .then(() => true)
        .catch(() => false);
    return sessionCheck;
}

export async function requireAdminAuth() {
    const ok = await checkAdminSession();
    if (!ok) {
        throw redirect("/admin/login");
    }
}