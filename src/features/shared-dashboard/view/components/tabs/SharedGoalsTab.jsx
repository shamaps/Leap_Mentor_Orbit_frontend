import { useState } from "react";
import useGoals from "@/features/shared-dashboard/presenter/useGoals";
import useSessions from "@/features/shared-dashboard/presenter/useSessions";
import useReport from "@/features/shared-dashboard/presenter/useReport";
import GoalForm from "./goals/GoalForm";
import TimelineTracker from "./goals/TimelineTracker";
import MilestoneList from "./goals/MilestoneList";
import SessionCard from "./goals/SessionCard";
import FeedbackModal from "./FeedbackModal";
import { useSelector } from "react-redux";
import PropTypes from "prop-types";
import { selectConnect } from "@/app/store/selectors";
const LoadingSkeleton = () => (
  <div className="flex flex-col gap-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 h-20 animate-pulse" />
    ))}
  </div>
);


const GoalCard = ({ goal, onEdit, milestones, saving, onAdd, onToggle, onDelete }) => {
  let statusClass = "bg-violet-50 text-violet-600 border-violet-200";
  if (goal.status === "completed") {
    statusClass = "bg-green-50 text-green-600 border-green-200";
  } else if (goal.status === "abandoned") {
    statusClass = "bg-red-50 text-red-500 border-red-200";
  }
  
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1.5">
            Primary Goal
          </p>
          <p className="text-lg font-extrabold text-slate-800 leading-snug mb-2">
            {goal.title}
          </p>
          {goal.description && (
            <p className="text-sm text-slate-500 leading-relaxed">{goal.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${statusClass}`}>
            {goal.status}
          </span>
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200
              bg-white text-xs font-semibold text-slate-600 cursor-pointer hover:border-blue-300
              hover:text-blue-900 hover:bg-blue-50 transition-all"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-slate-50">
        <MilestoneList
          goal={goal}
          milestones={milestones}
          saving={saving}
          onAdd={onAdd}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
};
GoalCard.propTypes = {
  goal: PropTypes.shape({
    _id: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    status: PropTypes.oneOf(["active", "completed", "abandoned"]),
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  milestones: PropTypes.array,
  saving: PropTypes.bool,
  onAdd: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};
const NoGoalState = ({ onSetGoal }) => (
  <div className="bg-white border border-dashed border-violet-200 rounded-2xl p-10
    flex flex-col items-center text-center gap-3">
    <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-200
      flex items-center justify-center">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    </div>
    <div>
      <p className="text-sm font-bold text-slate-800 mb-1">No goal set yet</p>
      <p className="text-xs text-slate-700 max-w-xs leading-relaxed">
        Set a primary goal to guide this mentorship session.
      </p>
    </div>
    <button
      onClick={onSetGoal}
      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-600
        border-none text-sm font-bold text-white cursor-pointer hover:bg-violet-700
        transition-colors mt-1"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      Set Goal
    </button>
  </div>
);
NoGoalState.propTypes = {
  onSetGoal: PropTypes.func.isRequired,
};
const OverallProgress = ({ completedSlots, totalSlots, progress, onLeaveFeedback, feedbackSubmitted }) => {
  const [showMessage, setShowMessage] = useState(false);

  const handleClick = () => {
    if (feedbackSubmitted) {
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
    } else {
      onLeaveFeedback();
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-slate-800">Overall Session Progress</p>
          <p className="text-xs text-slate-700 mt-0.5">
            {completedSlots} of {totalSlots} session{totalSlots === 1 ? "" : "s"} completed by both parties
          </p>
        </div>
        <p className="text-2xl font-black text-blue-900">{progress}%</p>
      </div>
      <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700
            ${progress >= 100 ? "bg-emerald-500" : "bg-blue-600"}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {progress >= 100 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between mt-3 py-2 px-4 rounded-xl
            bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            <div className="flex items-center gap-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              All sessions complete
            </div>
            <button
              onClick={handleClick}
              className={`ml-4 px-3 py-1.5 rounded-lg text-white text-xs font-bold transition-all
                ${feedbackSubmitted
                  ? "bg-slate-400 cursor-default"
                  : "bg-emerald-600 hover:bg-emerald-700"}`}
            >
              {feedbackSubmitted ? "Feedback Submitted" : "Leave Feedback"}
            </button>
          </div>
          {showMessage && (
            <div className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium">
              You've already submitted feedback for this session
            </div>
          )}
        </div>
      )}
    </div>
  );
};
OverallProgress.propTypes = {
  completedSlots: PropTypes.number.isRequired,
  totalSlots: PropTypes.number.isRequired,
  progress: PropTypes.number.isRequired,
  onLeaveFeedback: PropTypes.func.isRequired,
  feedbackSubmitted: PropTypes.bool,
};
// ── Main ──────────────────────────────────────────────────────
const SharedGoalsTab = ({ onAllComplete }) => {
  const connect = useSelector(selectConnect);
  const [isEditing, setIsEditing] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackSlotIndex, setFeedbackSlotIndex] = useState(null);
  const [showOverallFeedbackModal, setShowOverallFeedbackModal] = useState(false);
  const handleSessionComplete = (slotIndex) => {
    setFeedbackSlotIndex(slotIndex);
    setTimeout(() => setShowFeedbackModal(true), 1200);
  };
  const viewerRole = connect?.viewerRole || "mentee";
  const connectRequestId = connect?._id;

  const otherName = viewerRole === "mentee"
    ? connect?.mentor?.name || "Mentor"
    : connect?.mentee?.name || "Mentee";

  const {
    goal, milestones,
    loading: goalsLoading, error: goalsError, saving: goalsSaving,
    createGoal, updateGoal,
    addMilestone, toggleMilestone, deleteMilestone,
  } = useGoals(connectRequestId);

  const {
    slots, loading: slotsLoading, savingSlots, error: slotsError,
    completedSlots, totalSlots, progress,
    setMeetingLink, markSlotComplete,
    cancelSlot, rescheduleSlot,
  } = useSessions(connectRequestId, onAllComplete);

  const {
    myFeedback,
    loading: feedbackLoading,
    refetch: refetchFeedback,        // ← destructure refetch
  } = useReport(connectRequestId);

  const handleCreateGoal = async (fields) => {
    if (!connectRequestId) return;
    const result = await createGoal(fields);
    if (result?.success) setIsEditing(false);
  };
  const handleUpdateGoal = async (goalId, fields) => {
    const result = await updateGoal(goalId, fields);
    if (result?.success) setIsEditing(false);
  };

  // Called by FeedbackModal after successful submit
  const handleFeedbackSubmitted = () => {
    refetchFeedback();               // ← re-fetches myFeedback in this scope
    setShowFeedbackModal(false);
  };

  if (goalsLoading || slotsLoading || feedbackLoading) return <LoadingSkeleton />;

  const activeSlots = slots.filter((s) => !s.status || s.status !== "cancelled");

  let goalSectionContent;
  if (isEditing) {
    goalSectionContent = (
      <GoalForm
        initial={goal || {}}
        onSave={goal ? (fields) => handleUpdateGoal(goal._id, fields) : handleCreateGoal}
        onCancel={() => setIsEditing(false)}
        saving={goalsSaving}
      />
    );
  } else if (goal) {
    goalSectionContent = (
      <GoalCard
        goal={goal}
        onEdit={() => setIsEditing(true)}
        milestones={milestones}
        saving={goalsSaving}
        onAdd={addMilestone}
        onToggle={toggleMilestone}
        onDelete={deleteMilestone}
      />
    );
  } else {
    goalSectionContent = <NoGoalState onSetGoal={() => setIsEditing(true)} />;
  }
  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 m-0">Goals & Milestones</h1>
        <p className="text-sm text-blue-900 mt-1">
          Set your session goal, break it into milestones, and track progress together.
        </p>
      </div>

      {/* Error banners */}
      {(goalsError || slotsError) && (
        <div className="px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
          {goalsError || slotsError}
        </div>
      )}

      {/* Timeline */}
      {goal && (
        <TimelineTracker
          goal={goal}
          viewerRole={viewerRole}
          onUpdate={updateGoal}
          saving={goalsSaving}
        />
      )}

      {/* Goal section */}
      {goalSectionContent}

      {/* Overall progress */}
      {activeSlots.length > 0 && (
        <OverallProgress
          completedSlots={completedSlots}
          totalSlots={totalSlots}
          progress={progress}
          onLeaveFeedback={() => setShowOverallFeedbackModal(true)}
          feedbackSubmitted={!!myFeedback}
        />
      )}

      {/* Sessions */}
      {slots.length > 0 && (
        <div className="flex flex-col gap-4">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-widest">
            Sessions ({activeSlots.length} active
            {slots.length > activeSlots.length ? `, ${slots.length - activeSlots.length} cancelled` : ""})
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {slots.map((slot, index) => (
              <SessionCard
                key={`${slot.date}-${slot.startTime}-${index}`}
                slot={slot}
                slotIndex={index}
                viewerRole={viewerRole}
                otherName={otherName}
                savingSlots={savingSlots}
                onSetLink={setMeetingLink}
                onMarkComplete={markSlotComplete}
                onCancelSlot={cancelSlot}
                onRescheduleSlot={rescheduleSlot}
                allSlots={slots}
                connectRequestId={connectRequestId}
                onSessionComplete={handleSessionComplete}
                connect={connect}

              />
            ))}
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          connect={connect}
          slotIndex={feedbackSlotIndex}
          onClose={() => setShowFeedbackModal(false)}
          onFeedbackSubmitted={handleFeedbackSubmitted}
        />
      )}
      {showOverallFeedbackModal && (
        <FeedbackModal
          connect={connect}
          slotIndex={null}
          onClose={() => setShowOverallFeedbackModal(false)}
          onFeedbackSubmitted={() => {
            refetchFeedback();
            setShowOverallFeedbackModal(false);
          }}
        />
      )}

    </div>
  );
};
SharedGoalsTab.propTypes = {
  onAllComplete: PropTypes.func,
};
export default SharedGoalsTab;