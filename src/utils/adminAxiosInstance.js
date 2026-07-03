// src/utils/adminAxiosInstance.js
import axios from "axios";
import logger from "./logger";
import { HTTP_STATUS } from "../constants/httpStatus";
const adminAxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  withCredentials: true, // ← ADDED: browser sends adminAccessToken cookie automatically
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
    if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
      window.location.href = "/admin/login";
    }
    return Promise.reject(error);
  },
);

export default adminAxiosInstance;
