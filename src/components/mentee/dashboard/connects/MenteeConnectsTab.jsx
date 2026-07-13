// src/components/mentee/dashboard/connects/MenteeConnectsTab.jsx
import { useNavigate } from "react-router-dom";
import useOngoingConnects from "../../../../hooks/useOngoingConnects";
import ConnectsLayout from "../../../ui/connects/ConnectsLayout";
import ConnectCard from "../../../ui/connects/ConnectCard";

const MenteeConnectsTab = () => {
  const { ongoing, completed, loading, error } = useOngoingConnects();
  const navigate = useNavigate();

  return (
    <ConnectsLayout
      title="Active Connects"
      subtitle="Manage your ongoing mentorship sessions and review progress."
      count={ongoing.length}
      loading={loading}
      error={error}
      completedCount={completed.length}
      emptyState={{
        message: "No active connections yet",
        subMessage:
          "Once a mentor accepts your request and you complete escrow payment, your active sessions will appear here.",
        actionLabel: "Find Mentors",
        onAction: () =>
          globalThis.dispatchEvent(
            new CustomEvent("setDashboardTab", { detail: "findMentors" }),
          ),
      }}

      // ✅ Active session cards
      completedChildren={completed.map((c) => (
        <ConnectCard
          key={c._id}
          name={c.mentor?.name || "Mentor"}
          person={c.mentorProfile}
          session={c}
          tokenLabel={`${c.totalAmount} tokens released`}
          isCompleted={true}
          onDashboardClick={() => navigate(`/shared-dashboard/${c._id}`)}
        />
      ))}
    >
      {ongoing.map((c) => (
        <ConnectCard
          key={c._id}
          name={c.mentor?.name || "Mentor"}
          person={c.mentorProfile}
          session={c}
          tokenLabel={`${c.totalAmount} tokens in escrow`}
          isCompleted={false}
          onDashboardClick={() => navigate(`/shared-dashboard/${c._id}`)}
        />
      ))}
    </ConnectsLayout>
  );
};

export default MenteeConnectsTab;
