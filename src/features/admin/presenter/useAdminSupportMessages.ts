// src/features/admin/presenter/useAdminSupportMessages.js
import { useEffect, useState } from "react";
import { getSupportMessages, resolveSupportMessage } from "../model/admin.api";

const STATUS_STYLES = {
  open: { background: "#fef9c3", color: "#854d0e", label: "Open" },
  resolved: { background: "#dcfce7", color: "#166534", label: "Resolved" },
};

export const useAdminSupportMessages = () => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [resolving, setResolving] = useState<string | null>(null);

  const fetchMessages = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getSupportMessages();
      setMessages(res.data.messages || []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        err.message ||
        "Failed to load messages",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const markResolved = async (id: string) => {
    if (resolving === id) return;
    setResolving(id);
    try {
      await resolveSupportMessage(id);
      setMessages((prev) =>
        prev.map((m) => (m._id === id ? { ...m, status: "resolved" } : m)),
      );
    } catch {
      alert("Failed to update status");
    } finally {
      setResolving(null);
    }
  };

  const filtered = messages.filter(
    (m) => filter === "all" || m.status === filter,
  );
  const openCount = messages.filter((m) => m.status === "open").length;
  const resolvedCount = messages.filter((m) => m.status === "resolved").length;
  const emptyFilterLabel = filter === "all" ? "" : filter;

  return {
    messages,
    loading,
    error,
    filter,
    setFilter,
    expanded,
    setExpanded,
    resolving,
    filtered,
    openCount,
    resolvedCount,
    emptyFilterLabel,
    fetchMessages,
    markResolved,
    STATUS_STYLES,
  };
};