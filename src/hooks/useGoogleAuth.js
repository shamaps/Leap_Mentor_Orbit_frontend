// src/hooks/useGoogleAuth.js
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux"; // ✅ ADDED
import { setUser } from "../store/slices/authSlice"; // ✅ ADDED
import axiosInstance from "../utils/axiosInstance";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Store callbacks outside the hook so they stay fresh across re-renders
// but initialize() is only called once per app lifetime
const callbackRef = {
  onSuccess: null,
  onError: null,
  onLoadingChange: null,
  rolesRef: null,
  termsAcceptedRef: null,
  dispatch: null, // ✅ ADDED
  setUser: null, // ✅ ADDED
};

const useGoogleAuth = ({
  btnRef,
  roles,
  termsAcceptedRef,
  onSuccess,
  onError,
  onLoadingChange,
}) => {
  const dispatch = useDispatch(); // ✅ ADDED — hook-level, not passed as prop
  const rolesRef = useRef(roles);

  useEffect(() => {
    rolesRef.current = roles;
  }, [roles]);

  // Always keep the global callbackRef up to date so the frozen
  // Google callback always calls the latest handlers
  callbackRef.onSuccess = onSuccess;
  callbackRef.onError = onError;
  callbackRef.onLoadingChange = onLoadingChange;
  callbackRef.rolesRef = rolesRef;
  callbackRef.termsAcceptedRef = termsAcceptedRef;
  callbackRef.dispatch = dispatch; // ✅ kept fresh
  callbackRef.setUser = setUser; // ✅ kept fresh

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      onError?.("Missing VITE_GOOGLE_CLIENT_ID in frontend .env");
      return;
    }

    const initGoogle = () => {
      if (!btnRef.current) return;

      // Only initialize once for the entire app lifetime
      if (!globalThis.__googleInitialized) {
        globalThis.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            const termsAccepted = callbackRef.termsAcceptedRef?.current ?? true;

            if (!termsAccepted) {
              callbackRef.onError?.("Please accept the terms to continue.");
              return;
            }

            try {
              callbackRef.onLoadingChange?.(true);

              const res = await axiosInstance.post("/auth/google", {
                credential: response.credential,
                roles: callbackRef.rolesRef.current,
                termsAccepted: true,
              });

              // ✅ FIXED: was localStorage.setItem("token", res.data.token)
              // Backend sets HttpOnly cookie automatically.
              // We only dispatch into Redux — never store token in localStorage.
              if (res.data?.accessToken || res.data?.token) {
                callbackRef.dispatch?.(
                  callbackRef.setUser({
                    token: res.data.accessToken || res.data.token,
                    user: res.data.user || null,
                  }),
                );
              }

              callbackRef.onSuccess?.(res.data);
            } catch (err) {
              const apiMsg =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.message ||
                "Already user exists";
              callbackRef.onError?.(apiMsg);
            } finally {
              callbackRef.onLoadingChange?.(false);
            }
          },
        });
        globalThis.__googleInitialized = true;
      }

      // Always re-render the button — safe to call multiple times
      btnRef.current.innerHTML = "";
      globalThis.google.accounts.id.renderButton(btnRef.current, {
        theme: "outline",
        size: "large",
        width: 400,
        text: "continue_with",
      });
    };

    if (globalThis.google) {
      if ("requestIdleCallback" in globalThis) {
        requestIdleCallback(initGoogle, { timeout: 2000 });
      } else {
        setTimeout(initGoogle, 200);
      }
    } else {
      const script = document.querySelector(
        'script[src="https://accounts.google.com/gsi/client"]',
      );
      if (script) {
        script.addEventListener("load", initGoogle);
        return () => script.removeEventListener("load", initGoogle);
      }
    }
  }, []);
};

export default useGoogleAuth;
