import React from "react";
import { motion } from "framer-motion";

export default function MemberDashboard({ currentUser, tasks = [], sprint }) {
  const userName = currentUser?.name || "Team Member";

  const myTasks = tasks.filter((t) => t.assignedTo === currentUser?.id);
  const myTotalTasks = myTasks.length;
  const myCompletedTasks = myTasks.filter((t) => t.status === "done").length;

  const statusCounts = myTasks.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    },
    { todo: 0, in_progress: 0, done: 0, blocked: 0 }
  );

  const capacityHours = currentUser?.capacityHours ?? 40;
  const assignedHours = myTasks.reduce((sum, t) => sum + (t.effortHours || 0), 0);
  const capacityPct = capacityHours ? Math.round((assignedHours / capacityHours) * 100) : 0;

  const overloadedLevel =
    capacityPct > 100 ? "over" : capacityPct >= 80 ? "high" : "normal";

  const dueToday = myTasks.filter((t) => t.dueStatus === "today");
  const overdue = myTasks.filter((t) => t.dueStatus === "overdue");
  const blocked = myTasks.filter((t) => t.status === "blocked");

  const getCapacityColor = () => {
    if (capacityPct > 100) return "bg-error";
    if (capacityPct >= 80) return "bg-warning";
    return "bg-success";
  };

  const getCapacityLabelColor = () => {
    if (capacityPct > 100) return "text-error";
    if (capacityPct >= 80) return "text-warning";
    return "text-success";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header / Sprint Context */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-gradient-to-r from-primary to-secondary text-white rounded-2xl p-6 border border-primary/40 shadow-lg"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-white/80 mb-1">My Sprint Overview</p>
            <h2 className="text-2xl md:text-3xl font-bold">
              {sprint?.name || "Current Sprint"}
            </h2>
            <p className="text-sm text-white/80 mt-1">
              {sprint
                ? `${sprint.startDate} → ${sprint.endDate}`
                : "Dates not available"}
            </p>
            {sprint?.goal && (
              <p className="mt-3 text-sm text-white/90 max-w-2xl">
                <span className="font-semibold">Sprint goal: </span>
                {sprint.goal}
              </p>
            )}
          </div>
          <div className="space-y-3 w-full md:w-64">
            <div>
              <p className="text-xs text-white/80 mb-1">
                My Progress ({myCompletedTasks}/{myTotalTasks} tasks)
              </p>
              <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{
                    width: `${myTotalTasks ? Math.round(
                      (myCompletedTasks / myTotalTasks) * 100
                    ) : 0}%`,
                  }}
                />
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/80">Assigned hours</span>
              <span className="font-semibold">
                {assignedHours}h / {capacityHours}h
              </span>
            </div>
            <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className={`h-full ${getCapacityColor()} rounded-full transition-all`}
                style={{ width: `${Math.min(capacityPct, 120)}%` }}
              />
            </div>
            <p className={`text-xs font-semibold ${getCapacityLabelColor()}`}>
              {capacityPct}% of capacity
            </p>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-border rounded-2xl p-4 shadow-sm"
        >
          <p className="text-xs text-textMuted mb-1">Tasks Summary</p>
          <p className="text-2xl font-bold text-textPrimary">{myTotalTasks}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <span className="text-textSecondary">
              To Do:{" "}
              <span className="font-semibold text-textPrimary">
                {statusCounts.todo}
              </span>
            </span>
            <span className="text-textSecondary">
              In Progress:{" "}
              <span className="font-semibold text-primary">
                {statusCounts.in_progress}
              </span>
            </span>
            <span className="text-textSecondary">
              Done:{" "}
              <span className="font-semibold text-success">
                {statusCounts.done}
              </span>
            </span>
            <span className="text-textSecondary">
              Blocked:{" "}
              <span className="font-semibold text-error">
                {statusCounts.blocked}
              </span>
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white border border-border rounded-2xl p-4 shadow-sm"
        >
          <p className="text-xs text-textMuted mb-1">Due Today</p>
          <p className="text-2xl font-bold text-textPrimary">
            {dueToday.length}
          </p>
          <p className="text-xs text-textSecondary mt-2">
            Tasks that should be completed today.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-error/30 rounded-2xl p-4 shadow-sm"
        >
          <p className="text-xs text-error mb-1">Overdue</p>
          <p className="text-2xl font-bold text-error">
            {overdue.length}
          </p>
          <p className="text-xs text-textSecondary mt-2">
            Tasks past their due date.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white border border-warning/30 rounded-2xl p-4 shadow-sm"
        >
          <p className="text-xs text-warning mb-1">Blocked</p>
          <p className="text-2xl font-bold text-warning">
            {blocked.length}
          </p>
          <p className="text-xs text-textSecondary mt-2">
            Tasks where you are waiting on something.
          </p>
        </motion.div>
      </div>

      {/* Personal Workload Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-border rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-textPrimary mb-4">
            Personal Workload & Capacity
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-textSecondary">Total assigned hours</span>
              <span className="font-semibold text-textPrimary">
                {assignedHours}h
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-textSecondary">Capacity</span>
              <span className="font-semibold text-textPrimary">
                {capacityHours}h
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-textSecondary">Load level</span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  overloadedLevel === "over"
                    ? "bg-error/10 text-error"
                    : overloadedLevel === "high"
                    ? "bg-warning/10 text-warning"
                    : "bg-success/10 text-success"
                }`}
              >
                {overloadedLevel === "over"
                  ? "Overloaded"
                  : overloadedLevel === "high"
                  ? "Near capacity"
                  : "Healthy load"}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-surface border border-border rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-textPrimary mb-4">
            Sprint Context
          </h3>
          <p className="text-sm text-textSecondary mb-3">
            You are currently working in{" "}
            <span className="font-semibold text-textPrimary">
              {sprint?.id || "the active sprint"}
            </span>
            . This view helps you understand how your work contributes to the
            overall sprint goal.
          </p>
          <ul className="text-sm text-textSecondary space-y-2 list-disc list-inside">
            <li>
              Focus on completing <span className="font-semibold">high priority</span>{" "}
              items first.
            </li>
            <li>
              Keep your status up to date so your Scrum Master can{" "}
              <span className="font-semibold">remove blockers</span>.
            </li>
            <li>
              Watch for <span className="font-semibold">overload alerts</span> to
              keep your workload healthy.
            </li>
          </ul>
        </motion.div>
      </div>

      {/* Simple history snippet (for self-reflection) */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white border border-border rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-textPrimary mb-4">
          Recent Personal Activity
        </h3>
        <p className="text-sm text-textSecondary">
          This space is ready for your FYP enhancements like{" "}
          <span className="font-semibold">tasks completed per sprint</span> or{" "}
          <span className="font-semibold">hours delivered vs capacity</span> over
          the last few sprints. For now, it demonstrates how the{" "}
          <span className="font-semibold">team-member portal</span> can support
          self-reflection and continuous improvement for {userName}.
        </p>
      </motion.div>
    </div>
  );
}
