// src/shared/utils/apiError.ts
//
// Single source of truth for classifying and reporting API (Axios) failures.

import * as Sentry from "@sentry/react";
import type { AxiosError } from "axios";
import { HTTP_STATUS } from "@/shared/constants/httpStatus";

export type ApiErrorKind =
    | "network"
    | "timeout"
    | "auth"
    | "forbidden"
    | "validation"
    | "rate-limit"
    | "server"
    | "unknown";

export interface NormalizedApiError {
    kind: ApiErrorKind;
    status?: number;
    message: string;
    requestId?: string;
    isRetryable: boolean;
}

interface ErrorResponseData {
    message?: string;
    errors?: Array<{ message: string }>;
}

const RETRYABLE_STATUSES = new Set<number>([
    HTTP_STATUS.BAD_GATEWAY,
    HTTP_STATUS.SERVICE_UNAVAILABLE,
]);

// Only these kinds represent unexpected/bug-like failures worth alerting on.
const REPORTABLE_KINDS = new Set<ApiErrorKind>(["network", "timeout", "server"]);

const classify = (error: AxiosError, status: number | undefined): ApiErrorKind => {
    if (error.code === "ECONNABORTED") return "timeout";
    if (!error.response) return "network";
    if (status === HTTP_STATUS.UNAUTHORIZED) return "auth";
    if (status === HTTP_STATUS.FORBIDDEN) return "forbidden";
    if (status === HTTP_STATUS.TOO_MANY_REQUESTS) return "rate-limit";
    if (status === HTTP_STATUS.BAD_REQUEST || status === HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        return "validation";
    }
    if (status !== undefined && status >= HTTP_STATUS.INTERNAL_SERVER_ERROR) return "server";
    return "unknown";
};

const messageFor = (kind: ApiErrorKind, error: AxiosError, fallback: string): string => {
    const data = error.response?.data as ErrorResponseData | undefined;

    switch (kind) {
        case "validation":
            if (Array.isArray(data?.errors) && data.errors.length) {
                return data.errors.map((e) => e.message).join(" ");
            }
            return data?.message || "Please check the highlighted fields and try again.";
        case "rate-limit":
            return "You're doing that a bit too fast. Please wait a moment and try again.";
        case "forbidden":
            return data?.message || "You don't have permission to do that.";
        case "server":
            return "Something went wrong on our end. We've been notified — please try again shortly.";
        case "timeout":
            return "That request took too long and timed out. Please try again.";
        case "network":
            // Preserve any explicit error message (e.g. "Network Error") before
            // falling back to the friendly default.
            return data?.message || error.message || "Couldn't reach the server. Check your connection and try again.";
        default:
            return data?.message || error.message || fallback;
    }
};

/**
 * Normalizes any Axios (or Axios-like) error into a consistent shape.
 * Never throws — always returns a usable result, even for malformed input.
 */
export const normalizeApiError = (
    error: unknown,
    fallback = "Something went wrong.",
): NormalizedApiError => {
    const axiosError = error as AxiosError;
    const status = axiosError?.response?.status;
    const kind = classify(axiosError, status);
    const requestId = (axiosError?.config?.headers?.["X-Request-Id"] as string) || undefined;

    return {
        kind,
        status,
        message: messageFor(kind, axiosError, fallback),
        requestId,
        isRetryable: status !== undefined ? RETRYABLE_STATUSES.has(status) : kind === "network",
    };
};

interface ReportContext {
    component?: string;
    action?: string;
    method?: string;
    path?: string;
    [key: string]: unknown;
}

// Keys that must never reach Sentry, even nested inside context objects.
const SENSITIVE_KEYS = new Set([
    "data",
    "body",
    "authorization",
    "password",
    "token",
    "cookie",
    "file",
    "files",
]);

const sanitize = (value: unknown, depth = 0): unknown => {
    if (depth > 3 || value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map((v) => sanitize(v, depth + 1));

    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
        if (SENSITIVE_KEYS.has(key.toLowerCase())) continue;
        out[key] = sanitize(val, depth + 1);
    }
    return out;
};

/**
 * Reports a normalized API error to Sentry, but only when it represents an
 * unexpected failure (network / timeout / server) — never for expected,
 * user-actionable responses like validation, auth, forbidden, or rate-limit.
 * Metadata is sanitized: no request/response bodies, headers, or files.
 */
export const reportApiError = (
    error: unknown,
    context: ReportContext = {},
): void => {
    const normalized = normalizeApiError(error);
    if (!REPORTABLE_KINDS.has(normalized.kind)) return;

    Sentry.captureException(error, {
        tags: {
            apiErrorKind: normalized.kind,
            ...(normalized.status !== undefined ? { httpStatus: normalized.status } : {}),
        },
        extra: sanitize({
            requestId: normalized.requestId,
            ...context,
        }) as Record<string, unknown>,
    });
};