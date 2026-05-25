// src/utils/adminAxiosInstance.js
import axios from "axios";

const adminAxiosInstance = axios.create({
    // ✅ FIXED: was VITE_API_BASE_URL — wrong variable name, different from main axiosInstance
    // Main axiosInstance uses VITE_API_URL. Admin must use the same variable.
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
});

adminAxiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("adminToken"); // admin token stays in localStorage — fine, it's separate
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

adminAxiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("adminToken");
            localStorage.removeItem("adminUser");
            window.location.href = "/admin/login";
        }
        return Promise.reject(error);
    }
);

export default adminAxiosInstance;