// src/context/ToastContext.tsx
import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: number;
  type: ToastType;
  title?: string;
  message?: string;
}

interface ShowToastArgs {
  type?: ToastType;
  title?: string;
  message?: string;
}

interface ToastContextValue {
  showToast: (args: ShowToastArgs) => void;
}

const ToastContext = createContext < ToastContextValue | null > (null);

// eslint-disable-next-line react-refresh/only-export-components -- context hook and provider are intentionally colocated
export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState < ToastItem[] > ([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type = "success", title, message }: ShowToastArgs) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => removeToast(id), 3000);
    },
    [removeToast]
  );
  const ctxValue = useMemo(() => ({ showToast }), [showToast]);
  return (
    <ToastContext.Provider value={ctxValue}>
      {children}
      {/* ── Toast container — top right ── */}
      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// ── Toast styles per type ─────────────────────────────────────
interface ToastStyle {
  border: string;
  bg: string;
  iconBg: string;
  iconColor: string;
  icon: ReactNode;
}

const TOAST_STYLES: Record<ToastType, ToastStyle> = {
  success: {
    border: "#22c55e",
    bg: "#f0fdf4",
    iconBg: "#dcfce7",
    iconColor: "#16a34a",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  error: {
    border: "#ef4444",
    bg: "#fef2f2",
    iconBg: "#fee2e2",
    iconColor: "#dc2626",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    ),
  },
  info: {
    border: "#3b82f6",
    bg: "#eff6ff",
    iconBg: "#dbeafe",
    iconColor: "#2563eb",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
  },
  warning: {
    border: "#f59e0b",
    bg: "#fffbeb",
    iconBg: "#fef3c7",
    iconColor: "#d97706",
    icon: (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
};

const Toast = ({ toast, onRemove }: { toast: ToastItem; onRemove: (id: number) => void }) => {
  const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;

  return (
    <div
      style={{
        pointerEvents: "auto",
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        borderLeft: `4px solid ${style.border}`,
        borderRadius: "14px",
        padding: "14px 16px",
        minWidth: "300px",
        maxWidth: "380px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
        animation: "slideIn 0.25s ease",
        textAlign: "left",
        font: "inherit",
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Icon */}
      <div
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          backgroundColor: style.iconBg,
          color: style.iconColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {style.icon}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {toast.title && (
          <p
            style={{
              fontSize: "13px",
              fontWeight: "700",
              color: "#1e293b",
              marginBottom: "2px",
            }}
          >
            {toast.title}
          </p>
        )}
        {toast.message && (
          <p style={{ fontSize: "12px", color: "#64748b", lineHeight: "1.5" }}>
            {toast.message}
          </p>
        )}
      </div>

      {/* Close */}
      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "#94a3b8",
          padding: "0",
          flexShrink: 0,
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
};