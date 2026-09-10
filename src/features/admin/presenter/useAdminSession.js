// src/features/admin/presenter/useAdminSession.js
import { useState, useEffect } from "react";
import { getCurrentAdmin } from "../model/admin.api";

// Verifies the admin session on mount. Returns "checking" | "allowed" | "denied".
export const useAdminSession = () => {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    const verifySession = async () => {
      try {
        await getCurrentAdmin();
        setStatus("allowed");
      } catch {
        setStatus("denied");
      }
    };
    verifySession();
  }, []);

  return status;
};
