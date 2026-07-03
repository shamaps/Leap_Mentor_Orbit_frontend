// src/utils/axiosInstance.js
import axios from "axios";
import { setToken, logoutUser } from "../store/slices/authSlice";
import logger from "./logger";
import { HTTP_STATUS } from "../constants/httpStatus";
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
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true,
});

// ── Request interceptor: attach access token ─────────────────
axiosInstance.interceptors.request.use((config) => {
  const token = store.getState().auth.token;
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: silent refresh on 401 ──────────────
let isRefreshing = false;
let failedQueue = [];

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
    // Centralized reporting point: every API error that reaches this
    // interceptor gets logged here once, regardless of which component
    // triggered it. Components can still show their own user-facing
    // message, but they no longer need to remember to report it.
    logger.error(
      `API request failed: ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url} → ${error.response?.status ?? "network error"}`,
      {
        message: error.response?.data?.message || error.message,
      }
    );
    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED && !originalRequest._retry) {
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
