// src/features/admin/presenter/useMenteeHistoryModal.js
import { useState, useEffect } from "react";
import { getMenteeEngagements } from "../model/admin.api";
import logger from "@/shared/utils/logger";

export const useMenteeHistoryModal = (mentee) => {
  const [engagements, setEngagements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchEngagements = async () => {
      try {
        setLoading(true);
        const res = await getMenteeEngagements(mentee.name);
        const all = res.data.engagements || res.data || res.data || [];
        // Filter to only this mentee's engagements
        const filtered = all.filter(
          (e) =>
            e.mentee?._id === mentee._id || e.mentee?.email === mentee.email,
        );
        setEngagements(filtered);
      } catch (err) {
        logger.error("Failed to fetch engagements", { message: err.message });
      } finally {
        setLoading(false);
      }
    };
    if (mentee) fetchEngagements();
  }, [mentee]);

  const toggleExpand = (engId) => {
    setExpandedId((prev) => (prev === engId ? null : engId));
  };

  return { engagements, loading, expandedId, toggleExpand };
};
