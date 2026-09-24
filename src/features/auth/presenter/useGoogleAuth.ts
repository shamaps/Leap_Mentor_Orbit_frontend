// src/hooks/useGoogleAuth.ts
import { useEffect, useRef, type RefObject } from "react";
import { useDispatch } from "react-redux";
import { setUser } from "@/app/store/slices/authSlice";
import { googleAuthSync } from "@/features/auth/model/auth.api";

declare global {
  interface Window {
    google?: any;
    __googleInitialized?: boolean;
  }
   
  var google: any;
   
  var __googleInitialized: boolean | undefined;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

interface CallbackRefShape {
  onSuccess: ((data: unknown) => void) | null | undefined;
  onError: ((text: string) => void) | null | undefined;
  onLoadingChange: ((loading: boolean) => void) | null | undefined;
  rolesRef: RefObject<string[]> | null;
  termsAcceptedRef: RefObject<boolean> | null | undefined;
  dispatch: ReturnType<typeof useDispatch> | null;
  setUser: typeof setUser | null;
}

// Store callbacks outside the hook so they stay fresh across re-renders
// but initialize() is only called once per app lifetime
const callbackRef: CallbackRefShape = {
  onSuccess: null,
  onError: null,
  onLoadingChange: null,
  rolesRef: null,
  termsAcceptedRef: null,
  dispatch: null,
  setUser: null,
};

interface UseGoogleAuthArgs {
  btnRef: RefObject<HTMLDivElement | null>;
  roles: string[];
  termsAcceptedRef?: RefObject<boolean> | null;
  onSuccess?: (data: unknown) => void;
  onError?: (text: string) => void;
  onLoadingChange?: (loading: boolean) => void;
}

const useGoogleAuth = ({
  btnRef,
  roles,
  termsAcceptedRef,
  onSuccess,
  onError,
  onLoadingChange,
}: UseGoogleAuthArgs) => {
  const dispatch = useDispatch(); // — hook-level, not passed as prop
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
  callbackRef.dispatch = dispatch;
  callbackRef.setUser = setUser;

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
          callback: async (response: { credential: string }) => {
            const termsAccepted = callbackRef.termsAcceptedRef?.current ?? true;

            if (!termsAccepted) {
              callbackRef.onError?.("Please accept the terms to continue.");
              return;
            }

            try {
              callbackRef.onLoadingChange?.(true);

              const res = await googleAuthSync(
                response.credential,
                callbackRef.rolesRef?.current ?? [],
                true,
              );

              // Backend sets HttpOnly cookie automatically.
              // We only dispatch into Redux — never store token in localStorage.
              if (res.data?.accessToken || res.data?.token) {
                callbackRef.dispatch?.(
                  callbackRef.setUser!({
                    token: res.data.accessToken || res.data.token,
                    user: res.data.user || null,
                  }),
                );
              }

              callbackRef.onSuccess?.(res.data);
            } catch (err: any) {
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
      return undefined;
    }

    const script = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    if (script) {
      script.addEventListener("load", initGoogle);
      return () => script.removeEventListener("load", initGoogle);
    }

    return undefined;
  }, []);
};

export default useGoogleAuth;