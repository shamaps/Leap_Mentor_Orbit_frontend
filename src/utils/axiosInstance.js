// src/utils/axiosInstance.js
import axios from "axios";
import { setToken, logoutUser } from "../store/slices/authSlice";
import logger from "./logger";
import { HTTP_STATUS } from "../constants/httpStatus";
import { setGlobalError } from "../store/slices/uiSlice";

// ── Store injection ────────────────────────────────────────
// axiosInstance must NOT import { store } from "../store" directly:
// store/index.js imports the slices, the slices import axiosInstance,
// and axiosInstance importing store back would re-enter store/index.js
// while it's still mid-evaluation (circular import → TDZ crash on the
// reducer bindings). Instead, store/index.js calls injectStore(store)
// once, right after it's created, and this module holds a reference.
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

axiosInstance.interceptors.response.use(
  (response) => {
    // Guard against a 2xx response whose body isn't JSON — e.g. an HTML
    // error page served by a proxy/CDN/gateway with a 200 status. Without
    // this, malformed data would silently flow downstream as `undefined`
    // fields instead of surfacing as a real, loggable error.
    if (response.data !== null && typeof response.data !== "object") {
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
    // Centralized reporting point: every API error that reaches this
    // interceptor gets logged here once, regardless of which component
    // triggered it. Components can still show their own user-facing
    // message, but they no longer need to remember to report it.
    logger.error(
      `API request failed: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url} → ${status ?? "network error"}`,
      {
        requestId,
        message: error.response?.data?.message || error.message,
      }
    );

    // ── Timeout handling ──
    // Axios timeouts have no error.response and error.code "ECONNABORTED".
    // Surface this to the user via the same global-error banner used for
    // other non-401 failures, instead of failing silently in the console.
    if (error.code === "ECONNABORTED") {
      store.dispatch(
        setGlobalError({
          message: "That request took too long and timed out. Please try again.",
          code: "TIMEOUT",
        }),
      );
    }

    // ── Centralized handling for non-401 status codes ──
    // 401 has its own dedicated refresh flow below; everything else gets
    // a single, consistent global-error banner instead of each component
    // having to remember to handle it.
    switch (status) {
      case HTTP_STATUS.FORBIDDEN:
        store.dispatch(
          setGlobalError({
            message: "You don't have permission to do that.",
            code: status,
          }),
        );
        break;
      case HTTP_STATUS.NOT_FOUND:
        // Usually handled locally by the calling component (e.g. "profile
        // not found") — intentionally not surfaced as a global banner.
        break;
      case HTTP_STATUS.TOO_MANY_REQUESTS:
        store.dispatch(
          setGlobalError({
            message: "You're doing that too much. Please wait a moment and try again.",
            code: status,
          }),
        );
        break;
      case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      case HTTP_STATUS.BAD_GATEWAY:
      case HTTP_STATUS.SERVICE_UNAVAILABLE:
        store.dispatch(
          setGlobalError({
            message: "Something went wrong on our end. Please try again shortly.",
            code: status,
          }),
        );
        break;
      default:
        break;
    }

    // ── Generic retry for transient failures (network error) ──
    if (isRetryableError(error, originalRequest)) {
      originalRequest._genericRetryCount = originalRequest._genericRetryCount || 0;

      if (originalRequest._genericRetryCount < MAX_RETRIES) {
        originalRequest._genericRetryCount += 1;
        const backoff = RETRY_DELAY_MS * 2 ** (originalRequest._genericRetryCount - 1);

        logger.warn(
          `Retrying request (${originalRequest._genericRetryCount}/${MAX_RETRIES}) after ${backoff}ms`,
          { requestId, url: originalRequest?.url, status: status ?? "network error" },
        );

        await delay(backoff);
        return axiosInstance(originalRequest);
      }
    }

    // ── Existing 401 refresh-and-retry flow ──
    if (status === HTTP_STATUS.UNAUTHORIZED && !originalRequest._retry) {
      // Skip refresh for auth routes — they 401 legitimately
      if (
        originalRequest.url?.includes("/auth/refresh") ||
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/register")
      ) {
        store.dispatch(logoutUser());
        throw error;
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            // Let request interceptor re-attach fresh token from Redux
            delete originalRequest.headers["Authorization"];
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            throw err;
          });
      }

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
    }

    throw error;
  },
);

export default axiosInstance;