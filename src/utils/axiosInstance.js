// src/utils/axiosInstance.js
import axios from "axios";
import { store } from "../store";
import { setToken, logout } from "../store/slices/authSlice";

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
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      // ✅ Skip refresh for auth routes — they 401 legitimately
      if (
        originalRequest.url?.includes("/auth/refresh") ||
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/register")
      ) {
        store.dispatch(logout());
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            // ✅ Let request interceptor re-attach fresh token from Redux
            delete originalRequest.headers["Authorization"];
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axiosInstance.post("/auth/refresh");
        store.dispatch(setToken(data.accessToken));
        processQueue(null, data.accessToken);
        // ✅ Let request interceptor re-attach fresh token from Redux
        delete originalRequest.headers["Authorization"];
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        store.dispatch(logout());
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;