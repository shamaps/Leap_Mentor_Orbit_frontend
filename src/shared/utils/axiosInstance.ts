// src/utils/axiosInstance.js

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { setToken, logoutUser } from "@/app/store/slices/authSlice";
import logger from "./logger";
import { HTTP_STATUS } from "@/shared/constants/httpStatus";
import { setGlobalError } from "@/app/store/slices/uiSlice";
import { formatSuccessResponse } from "./client";
import { reportApiError } from "./apiError";

// Minimal structural type for the injected Redux store — avoids a hard,
// circular dependency on the full AppStore/RootState type from app/store
// at this low-level infrastructure module.
interface MinimalStore {
  getState: () => { auth: { token: string | null } };
  dispatch: (action: unknown) => unknown;
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _genericRetryCount?: number;
  _retry?: boolean;
  suppressNotFoundLog?: boolean;
}

// ── Store injection ────────────────────────────────────────
let store: MinimalStore;
export const injectStore = (_store: MinimalStore): void => {
  store = _store;
};

// ── Per-request trace ID ──────────────────────────────────────
const generateRequestId = (): string =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const apiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "X-Client-Name": "leapmentor-frontend",
    "X-Client-Version": import.meta.env.VITE_APP_VERSION || "dev",
  },
});

// Distinguishes which auth flow a given request belongs to.
const isAdminRequest = (url?: string): boolean => Boolean(url?.includes("/admin"));

// ── Request interceptor ──────────────────────────────────────
apiInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Only attach a Bearer token for non-admin requests — admin auth is
  // cookie-only, there is no admin token in Redux to attach.
  if (!isAdminRequest(config.url)) {
    const token = store.getState().auth.token;
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }

  config.headers["X-Request-Id"] = generateRequestId();

  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;
  if (!isFormData && !config.headers["Content-Type"]) {
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});

// ── Shared generic retry (GET only, both user & admin) ──
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token?: string | null) => void; reject: (err: unknown) => void }> = [];

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500;

const isRetryableError = (error: AxiosError, config?: RetryableRequestConfig): boolean => {
  if (config?.method?.toLowerCase() !== "get") return false;
  if (!error.response) return true;
  const status = error.response.status;
  return status === HTTP_STATUS.BAD_GATEWAY || status === HTTP_STATUS.SERVICE_UNAVAILABLE;
};

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const retryTransientFailure = async (
  error: AxiosError,
  originalRequest: RetryableRequestConfig,
  status: number | undefined,
  requestId: string | undefined,
) => {
  if (!isRetryableError(error, originalRequest)) return null;

  originalRequest._genericRetryCount = originalRequest._genericRetryCount || 0;
  if (originalRequest._genericRetryCount >= MAX_RETRIES) return null;

  originalRequest._genericRetryCount += 1;
  const backoff = RETRY_DELAY_MS * 2 ** (originalRequest._genericRetryCount - 1);

  logger.warn(
    `Retrying request (${originalRequest._genericRetryCount}/${MAX_RETRIES}) after ${backoff}ms`,
    { requestId, url: originalRequest?.url, status: status ?? "network error" },
  );

  await delay(backoff);
  return apiInstance(originalRequest);
};

const processQueue = (error: unknown, token: string | null = null): void => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const logApiError = (
  error: AxiosError,
  originalRequest: RetryableRequestConfig,
  status: number | undefined,
  requestId: string | undefined,
): void => {
  const isExpectedAuthRefresh401 =
    status === HTTP_STATUS.UNAUTHORIZED && originalRequest?.url?.includes("/auth/refresh");
  const isExpectedNotFound =
    status === HTTP_STATUS.NOT_FOUND && originalRequest?.suppressNotFoundLog;

  if (isExpectedAuthRefresh401 || isExpectedNotFound) return;

  const responseData = error.response?.data as { message?: string } | undefined;
  logger.error(
    `API request failed: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url} → ${status ?? "network error"}`,
    { requestId, message: responseData?.message || error.message }
  );
};

const handleTimeout = (error: AxiosError): void => {
  if (error.code !== "ECONNABORTED") return;
  store.dispatch(
    setGlobalError({
      message: "That request took too long and timed out. Please try again.",
      code: "TIMEOUT",
    }),
  );
};

const STATUS_MESSAGES: Record<number, string> = {
  [HTTP_STATUS.FORBIDDEN]: "You don't have permission to do that.",
  [HTTP_STATUS.TOO_MANY_REQUESTS]: "You're doing that too much. Please wait a moment and try again.",
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: "Something went wrong on our end. Please try again shortly.",
  [HTTP_STATUS.BAD_GATEWAY]: "Something went wrong on our end. Please try again shortly.",
  [HTTP_STATUS.SERVICE_UNAVAILABLE]: "Something went wrong on our end. Please try again shortly.",
};

const dispatchStatusBanner = (status: number | undefined): void => {
  if (status === undefined) return;
  const message = STATUS_MESSAGES[status];
  if (!message) return;
  store.dispatch(setGlobalError({ message, code: status }));
};

// ── User-side 401: silent refresh + retry queue ──
const isAuthRouteRequest = (url?: string): boolean =>
  Boolean(url?.includes("/auth/refresh") || url?.includes("/auth/login") || url?.includes("/auth/register"));

const queueWhileRefreshing = (originalRequest: RetryableRequestConfig) =>
  new Promise<string | null | undefined>((resolve, reject) => {
    failedQueue.push({ resolve, reject });
  }).then(() => {
    delete originalRequest.headers["Authorization"];
    return apiInstance(originalRequest);
  });

const refreshTokenAndRetry = async (originalRequest: RetryableRequestConfig) => {
  originalRequest._retry = true;
  isRefreshing = true;

  try {
    const { data } = await apiInstance.post<{ accessToken: string }>("/auth/refresh");
    store.dispatch(setToken(data.accessToken));
    processQueue(null, data.accessToken);
    delete originalRequest.headers["Authorization"];
    return apiInstance(originalRequest);
  } catch (refreshError) {
    processQueue(refreshError, null);
    store.dispatch(logoutUser());
    throw refreshError;
  } finally {
    isRefreshing = false;
  }
};

const handleUserUnauthorized = (error: AxiosError, originalRequest: RetryableRequestConfig) => {
  if (originalRequest._retry) return null;

  if (isAuthRouteRequest(originalRequest.url)) {
    store.dispatch(logoutUser());
    throw error;
  }

  if (isRefreshing) return queueWhileRefreshing(originalRequest);

  return refreshTokenAndRetry(originalRequest);
};

// ── Response interceptor
apiInstance.interceptors.response.use(
  (response) => formatSuccessResponse(response),
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig;
    const status = error.response?.status;
    const requestId = originalRequest?.headers?.["X-Request-Id"] as string | undefined;
    const admin = isAdminRequest(originalRequest?.url);

    if (admin) {
      const responseData = error.response?.data as { message?: string } | undefined;
      logger.error("Admin API request failed", {
        url: originalRequest?.url,
        method: originalRequest?.method,
        status,
        message: responseData?.message || error.message,
      });
    } else {
      logApiError(error, originalRequest, status, requestId);
      handleTimeout(error);
      dispatchStatusBanner(status);
    }

    const retryResult = await retryTransientFailure(error, originalRequest, status, requestId);
    if (retryResult) return retryResult;

    if (status === HTTP_STATUS.UNAUTHORIZED) {
      if (admin) {
        globalThis.location.href = "/admin/login";
      } else {
        const authResult = await handleUserUnauthorized(error, originalRequest);
        if (authResult) return authResult;
      }
    }

    // Report to Sentry only for genuinely unexpected failures (network,
    // timeout, 5xx) — never for expected validation/auth/forbidden/rate-limit
    // responses. This is the final failure point: retries and refresh-retry
    // have already been exhausted by the time we get here.
    reportApiError(error, {
      method: originalRequest?.method,
      path: originalRequest?.url,
      status,
      requestId,
      admin,
    });

    throw error;
  },
);

export default apiInstance;