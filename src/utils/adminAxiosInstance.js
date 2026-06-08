// src/utils/adminAxiosInstance.js
import axios from "axios";

const adminAxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
    withCredentials: true,   // ← ADDED: browser sends adminAccessToken cookie automatically
});

// ── Request interceptor REMOVED ───────────────────────────────
// Previously read adminToken from localStorage and attached as Bearer header
// Now the browser sends the adminAccessToken httpOnly cookie automatically
// No manual token attachment needed at all

// ── Response interceptor: redirect to login on 401 ───────────
adminAxiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // ← REMOVED: localStorage.removeItem("adminToken")
            // ← REMOVED: localStorage.removeItem("adminUser")
            // Cookie is cleared server-side via POST /admin/auth/logout
            window.location.href = "/admin/login";
        }
        return Promise.reject(error);
    }
);

export default adminAxiosInstance;