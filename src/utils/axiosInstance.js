// src/utils/axiosInstance.js
import axios from "axios";
import { setToken, logoutUser } from "../store/slices/authSlice";
import logger from "./logger";
import { HTTP_STATUS } from "../constants/httpStatus";
import { setGlobalError } from "../store/slices/uiSlice";

// ── Store injection ────────────────────────────────────────
let store;
export const injectStore = (_store) => {
  store = _store;
};
// ── Per-request trace ID ──────────────────────────────────────
// Generated client-side and forwarded as X-Request-Id so a single
// request can be traced
const generateRequestId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
  timeout: 15000, // 15s — hung requests reject instead of waiting indefinitely
  headers: {
    // ── Always-on default headers — applied to every request ──
    Accept: "application/json",
    "X-Client-Name": "leapmentor-frontend",
    "X-Client-Version": import.meta.env.VITE_APP_VERSION || "dev",
  },
});

// ── Request interceptor: attach access token + per-request headers ──
axiosInstance.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  // ── Attach a unique trace ID to every outgoing request ──
  config.headers["X-Request-Id"] = generateRequestId();

  // Don't force JSON Content-Type on multipart uploads — let the browser
  // set the correct multipart boundary itself when FormData is used.
  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;
  if (!isFormData && !config.headers["Content-Type"]) {
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});

// ── Response interceptor: silent refresh on 401 ──────────────
let isRefreshing = false;
let failedQueue = [];

// ── retry config for failures ──
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 500; // base delay;

const isRetryableError = (error, config) => {
  if (config?.method?.toLowerCase() !== "get") return false; // only retry safe, idempotent reads
  if (!error.response) return true; // network error / timeout
  const status = error.response.status;
  return status === HTTP_STATUS.BAD_GATEWAY || status === HTTP_STATUS.SERVICE_UNAVAILABLE;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

// ── Extracted helpers (keeps the response-error interceptor's
// cognitive complexity low — each concern lives in its own function) ──

const logApiError = (error, originalRequest, status, requestId) => {
  // Centralized reporting point: every API error that reaches this
  // interceptor gets logged here once, regardless of which component
  // triggered it. Components can still show their own user-facing
  // message, but they no longer need to remember to report it.
  const isExpectedAuthRefresh401 =
    status === HTTP_STATUS.UNAUTHORIZED && originalRequest?.url?.includes("/auth/refresh");
  const isExpectedNotFound =
    status === HTTP_STATUS.NOT_FOUND && originalRequest?.suppressNotFoundLog;

  if (isExpectedAuthRefresh401 || isExpectedNotFound) return;

  logger.error(
    `API request failed: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url} → ${status ?? "network error"}`,
    { requestId, message: error.response?.data?.message || error.message }
  );
};

const handleTimeout = (error) => {
  // Axios timeouts have no error.response and error.code "ECONNABORTED".
  // Surface this to the user via the same global-error banner used for
  // other non-401 failures, instead of failing silently in the console.
  if (error.code !== "ECONNABORTED") return;
  store.dispatch(
    setGlobalError({
      message: "That request took too long and timed out. Please try again.",
      code: "TIMEOUT",
    }),
  );
};

// ── Centralized handling for non-401/404 status codes ──
// 401 has its own dedicated refresh flow, and 404 is usually handled
// locally by the calling component — everything else gets a single,
// consistent global-error banner instead of each component having to
// remember to handle it.
const STATUS_MESSAGES = {
  [HTTP_STATUS.FORBIDDEN]: "You don't have permission to do that.",
  [HTTP_STATUS.TOO_MANY_REQUESTS]: "You're doing that too much. Please wait a moment and try again.",
  [HTTP_STATUS.INTERNAL_SERVER_ERROR]: "Something went wrong on our end. Please try again shortly.",
  [HTTP_STATUS.BAD_GATEWAY]: "Something went wrong on our end. Please try again shortly.",
  [HTTP_STATUS.SERVICE_UNAVAILABLE]: "Something went wrong on our end. Please try again shortly.",
};

const dispatchStatusBanner = (status) => {
  const message = STATUS_MESSAGES[status];
  if (!message) return;
  store.dispatch(setGlobalError({ message, code: status }));
};

// ── Generic retry for transient failures (network error) ──
const retryTransientFailure = async (error, originalRequest, status, requestId) => {
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
  return axiosInstance(originalRequest);
};

// ── Existing 401 refresh-and-retry flow ──
const isAuthRouteRequest = (url) =>
  url?.includes("/auth/refresh") || url?.includes("/auth/login") || url?.includes("/auth/register");

const queueWhileRefreshing = (originalRequest) =>
  new Promise((resolve, reject) => {
    failedQueue.push({ resolve, reject });
  }).then(() => {
    // Let request interceptor re-attach fresh token from Redux
    delete originalRequest.headers["Authorization"];
    return axiosInstance(originalRequest);
  });

const refreshTokenAndRetry = async (originalRequest) => {
  originalRequest._retry = true;
  isRefreshing = true;

  try {
    const { data } = await axiosInstance.post("/auth/refresh");
    store.dispatch(setToken(data.accessToken));
    processQueue(null, data.accessToken);
    // Let request interceptor re-attach fresh token from Redux
    delete originalRequest.headers["Authorization"];
    return axiosInstance(originalRequest);
  } catch (refreshError) {
    processQueue(refreshError, null);
    store.dispatch(logoutUser());
    throw refreshError;
  } finally {
    isRefreshing = false;
  }
};

const handleUnauthorized = (error, originalRequest) => {
  if (originalRequest._retry) return null;

  // Skip refresh for auth routes — they 401 legitimately
  if (isAuthRouteRequest(originalRequest.url)) {
    store.dispatch(logoutUser());
    throw error;
  }

  if (isRefreshing) return queueWhileRefreshing(originalRequest);

  return refreshTokenAndRetry(originalRequest);
};

axiosInstance.interceptors.response.use(
  (response) => {
    // 204 No Content / empty body is a valid, successful response —
    // don't treat it as malformed just because it isn't JSON.
    const isEmptyBody =
      response.status === 204 ||
      response.data === "" ||
      response.data === undefined;

    if (!isEmptyBody && response.data !== null && typeof response.data !== "object") {
      logger.error("Non-JSON response received", {
        url: response.config?.url,
        contentType: response.headers?.["content-type"],
      });
      return Promise.reject(new Error("Unexpected response format from server."));
    }

    if (response.data?.success === true && response.data.data !== undefined) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const requestId = originalRequest?.headers?.["X-Request-Id"];

    logApiError(error, originalRequest, status, requestId);
    handleTimeout(error);
    dispatchStatusBanner(status);

    const retryResult = await retryTransientFailure(error, originalRequest, status, requestId);
    if (retryResult) return retryResult;

    if (status === HTTP_STATUS.UNAUTHORIZED) {
      const authResult = await handleUnauthorized(error, originalRequest);
      if (authResult) return authResult;
    }

    throw error;
  },
);

export default axiosInstance;