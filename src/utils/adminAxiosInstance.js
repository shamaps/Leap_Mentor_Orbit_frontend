// src/utils/adminAxiosInstance.js
import axios from "axios";
import logger from "./logger";
import { HTTP_STATUS } from "../constants/httpStatus";
const adminAxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true, // ← ADDED: browser sends adminAccessToken cookie automatically
  timeout: 15000, // 15s — hung requests reject instead of waiting indefinitely
});

// ── Request interceptor REMOVED ───────────────────────────────
// Previously read adminToken from localStorage and attached as Bearer header
// Now the browser sends the adminAccessToken httpOnly cookie automatically
// No manual token attachment needed at all

// ── Response interceptor: redirect to login on 401 ───────────
adminAxiosInstance.interceptors.response.use(
  (response) => {
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
  (error) => {
    logger.error("Admin API request failed", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });
    if (error.code === "ECONNABORTED") {
      logger.error("Admin API request timed out", { url: error.config?.url });
      // No global-error store on the admin side today — dispatch is not
      // wired here. Simplest immediate fix: let the calling component's
      // existing .catch()/try-catch show its own "request failed" state,
      // since error.message will now read "timeout of 15000ms exceeded".
    }
    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
      window.location.href = "/admin/login";
    }
    return Promise.reject(error);
  },
);

export default adminAxiosInstance;
