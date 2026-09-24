// src/hooks/useOngoingConnects.js
import { useState, useEffect, useCallback } from "react";
import { getOngoingConnects } from "@/features/connects/model/connectRequests.api";
import getErrorMessage from "@/shared/utils/getErrorMessage";
import type { MappedConnectRequest } from "@/features/connects/model/connectRequestMapper";

const useOngoingConnects = () => {
  const [ongoing, setOngoing] = useState<MappedConnectRequest[]>([]);
  const [completed, setCompleted] = useState<MappedConnectRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConnects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOngoingConnects();

      const all = (data.connects || []).filter((c): c is MappedConnectRequest => c !== null);

      //  Split into ongoing and completed
      setOngoing(all.filter((c) => c.status === "ongoing"));
      setCompleted(all.filter((c) => c.status === "completed"));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load connects."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnects();
  }, [fetchConnects]);

  // Keep connects for backward compat (ongoing only)
  return {
    connects: ongoing, // backward compat
    ongoing,
    completed,
    loading,
    error,
    refetch: fetchConnects,
  };
};

export default useOngoingConnects;