// src/utils/logger.js
//
// Central logging utility. Replaces raw console.log/warn/error calls.
// - Ships structured logs to BetterStack (Logtail HTTP ingest) whenever a
//   source token is configured, in any environment — set  VITE_BETTERSTACK_SOURCE_TOKEN 


const BETTERSTACK_SOURCE_TOKEN = import.meta.env.VITE_BETTERSTACK_SOURCE_TOKEN;
const BETTERSTACK_INGEST_URL =
    import.meta.env.VITE_BETTERSTACK_INGEST_URL || "https://in.logs.betterstack.com";

const isDev = import.meta.env.DEV;

// ── Redaction ──────────────────────────────────────────────
// Any object key whose name (case-insensitive) contains one of these
// substrings gets its value replaced before logging. Keeps this list
// close to the logger so nobody has to remember to redact per call site.
const SENSITIVE_KEY_FRAGMENTS = [
    "token",
    "password",
    "secret",
    "authorization",
    "cookie",
    "otp",
    "clerktoken",
];

const isSensitiveKey = (key) => {
    const lower = key.toLowerCase();
    return SENSITIVE_KEY_FRAGMENTS.some((fragment) => lower.includes(fragment));
};

const redact = (value, depth = 0) => {
    if (depth > 4 || value === null || typeof value !== "object") return value;

    if (value instanceof Error) {
        return { name: value.name, message: value.message, stack: value.stack };
    }

    if (Array.isArray(value)) {
        return value.map((item) => redact(item, depth + 1));
    }

    const output = {};
    for (const [key, val] of Object.entries(value)) {
        output[key] = isSensitiveKey(key) ? "[REDACTED]" : redact(val, depth + 1);
    }
    return output;
};

// ── Shipping to BetterStack ───────────────────────────────
// Uses fetch(..., { keepalive: true }) rather than sendBeacon because
// BetterStack ingest requires a Bearer auth header, which sendBeacon
// cannot set. keepalive gives the same "survive page unload" guarantee.
const ship = (level, message, context) => {
    if (!BETTERSTACK_SOURCE_TOKEN) return;

    const payload = JSON.stringify({
        dt: new Date().toISOString(),
        level,
        message,
        context: redact(context),
        app: "leapmentor-frontend",
        env: import.meta.env.MODE,
        url: typeof globalThis === "undefined" ? undefined : globalThis.location.href,
    });

    fetch(BETTERSTACK_INGEST_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${BETTERSTACK_SOURCE_TOKEN}`,
        },
        body: payload,
        keepalive: true,
    }).catch(() => {
        // Logging must never throw or break the app. Swallow network errors.
    });
};

const log = (level, consoleMethod, message, context) => {
    const safeContext = redact(context);

    if (isDev) {
        // eslint-disable-next-line no-console
        console[consoleMethod](`[${level.toUpperCase()}] ${message}`, safeContext ?? "");
    }

    ship(level, message, safeContext);
};

const logger = {
    debug: (message, context) => log("debug", "debug", message, context),
    info: (message, context) => log("info", "info", message, context),
    warn: (message, context) => log("warn", "warn", message, context),
    error: (message, context) => log("error", "error", message, context),
};

export default logger;