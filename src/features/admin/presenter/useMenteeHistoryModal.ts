// src/features/admin/presenter/useMenteeHistoryModal.js
import { useState, useEffect } from "react";
import { getMenteeEngagements } from "../model/admin.api";
import type { AdminEngagement, AdminPerson } from "../model/admin.types";
import getErrorMessage from "@/shared/utils/getErrorMessage";
import logger from "@/shared/utils/logger";

export const useMenteeHistoryModal = (mentee: AdminPerson | null) => {
  const [engagements, setEngagements] = useState<AdminEngagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!mentee) {
      setEngagements([]);
      setLoading(false);
      return;
    }
    const fetchEngagements = async () => {
      try {
        setLoading(true);
        const res = await getMenteeEngagements(mentee.name);
        const all = res.data.engagements || res.data || res.data || [];
        // Filter to only this mentee's engagements
        const filtered = all.filter(
          (e: AdminEngagement) =>
            e.mentee?._id === mentee._id || e.mentee?.email === mentee.email,
        );
        setEngagements(filtered);
      } catch (err: unknown) {
        logger.warn("Failed to fetch engagements", { message: getErrorMessage(err) });
      } finally {
        setLoading(false);
      }
    };
    if (mentee) fetchEngagements();
  }, [mentee]);

  const toggleExpand = (engId: string) => {
    setExpandedId((prev) => (prev === engId ? null : engId));
  };

  return { engagements, loading, expandedId, toggleExpand };
};