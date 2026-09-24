// src/utils/logger.ts
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

const isSensitiveKey = (key: string): boolean => {
    const lower = key.toLowerCase();
    return SENSITIVE_KEY_FRAGMENTS.some((fragment) => lower.includes(fragment));
};

const redact = (value: unknown, depth = 0): unknown => {
    if (depth > 4 || value === null || typeof value !== "object") return value;

    if (value instanceof Error) {
        return { name: value.name, message: value.message, stack: value.stack };
    }

    if (Array.isArray(value)) {
        return value.map((item) => redact(item, depth + 1));
    }

    const output: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
        output[key] = isSensitiveKey(key) ? "[REDACTED]" : redact(val, depth + 1);
    }
    return output;
};

// ── ECS shaping ────────────────────────────────────────────

const ECS_VERSION = "8.11";

const sanitizeLabelKeys = (value: unknown): unknown => {
    if (value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map(sanitizeLabelKeys);

    const output: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
        const safeKey = key.replace(/[.*\\]/g, "_");
        output[safeKey] = sanitizeLabelKeys(val);
    }
    return output;
};

// redact() already flattens Error instances to { name, message, stack }.
// Detect that shape and route it into ECS's error.* fields instead of
// leaving it as an opaque label blob.
const isRedactedError = (value: unknown): value is { name: unknown; message: unknown; stack: unknown } =>
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "message" in value &&
    "stack" in value;

// ── Shipping to BetterStack

const ship = (level: string, message: string, context: unknown): void => {
    if (!BETTERSTACK_SOURCE_TOKEN) return;

    const safeContext = context;
    const errorField = isRedactedError(safeContext)
        ? {
            error: {
                type: safeContext.name,
                message: safeContext.message,
                stack_trace: safeContext.stack,
            },
        }
        : {};
    const labelsField =
        safeContext && !isRedactedError(safeContext) && typeof safeContext === "object"
            ? { labels: sanitizeLabelKeys(safeContext) }
            : {};

    const payload = JSON.stringify({
        "@timestamp": new Date().toISOString(),
        "log.level": level,
        message,
        "ecs.version": ECS_VERSION,
        service: {
            name: "leapmentor-frontend",
            environment: import.meta.env.MODE,
        },
        url: { full: globalThis.location?.href },
        ...labelsField,
        ...errorField,
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

type ConsoleMethod = "debug" | "info" | "warn" | "error";

const log = (level: string, consoleMethod: ConsoleMethod, message: string, context?: unknown): void => {
    const safeContext = redact(context);

    if (isDev) {

        console[consoleMethod](`[${level.toUpperCase()}] ${message}`, safeContext ?? "");
    }

    ship(level, message, safeContext);
};

const logger = {
    debug: (message: string, context?: unknown) => log("debug", "debug", message, context),
    info: (message: string, context?: unknown) => log("info", "info", message, context),
    warn: (message: string, context?: unknown) => log("warn", "warn", message, context),
    error: (message: string, context?: unknown) => log("error", "error", message, context),
};

export default logger;