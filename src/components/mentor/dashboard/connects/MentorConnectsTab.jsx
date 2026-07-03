// src/components/mentor/dashboard/connects/MentorConnectsTab.jsx
import { useNavigate } from "react-router-dom";
import useOngoingConnects from "../../../../hooks/useOngoingConnects";
import ConnectsLayout from "../../../ui/connects/ConnectsLayout";
import ConnectCard from "../../../ui/connects/ConnectCard";

const MentorConnectsTab = () => {
  const { ongoing, completed, loading, error } = useOngoingConnects();
  const navigate = useNavigate();

  return (
    <ConnectsLayout
      title="Active Connects"
      subtitle="Manage your ongoing mentee sessions and track their progress."
      count={ongoing.length}
      loading={loading}
      error={error}
      completedCount={completed.length}
      emptyState={{
        message: "No active mentees yet",
        subMessage:
          "Sessions appear here once a mentee completes escrow payment for an accepted request.",
      }}

      // ✅ Completed session cards
      completedChildren={completed.map((c) => (
        <ConnectCard
          key={c._id}
          name={c.mentee?.name || "Mentee"}
          person={c.menteeProfile}
          session={c}
          tokenLabel={`${c.totalAmount} tokens received`}
          isCompleted={true}
          onDashboardClick={() => navigate(`/shared-dashboard/${c._id}`)}
        />
      ))}
    >
      {ongoing.map((c) => (
        <ConnectCard
          key={c._id}
          name={c.mentee?.name || "Mentee"}
          person={c.menteeProfile}
          session={c}
          tokenLabel={`${c.totalAmount} tokens pending release`}
          isCompleted={false}
          onDashboardClick={() => navigate(`/shared-dashboard/${c._id}`)}
        />
      ))}
    </ConnectsLayout>
  );
};

export default MentorConnectsTab;
