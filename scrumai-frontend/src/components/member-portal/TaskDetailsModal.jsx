import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function TaskDetailsModal({
  open,
  task,
  onClose,
  onStatusChange,
  onLogWork,
}) {
  const [status, setStatus] = useState(task?.status || "todo");
  const [blockedReason, setBlockedReason] = useState(task?.blockedReason || "");
  const [workLogHours, setWorkLogHours] = useState("");

  useEffect(() => {
    if (task) {
      setStatus(task.status || "todo");
      setBlockedReason(task.blockedReason || "");
      setWorkLogHours("");
    }
  }, [task]);

  if (!open || !task) return null;

  const handleStatusUpdate = (nextStatus) => {
    setStatus(nextStatus);
    onStatusChange?.(task, nextStatus, blockedReason);
  };

  const handleLogWork = () => {
    const hours = parseFloat(workLogHours);
    if (!Number.isFinite(hours) || hours <= 0) return;
    onLogWork?.(task, hours);
    setWorkLogHours("");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 border border-border"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between px-6 py-4 border-b border-border">
            <div>
              <p className="text-xs text-textMuted mb-1">
                Story {task.storyId || "-"}
              </p>
              <h2 className="text-lg font-semibold text-textPrimary">
                {task.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-textMuted hover:text-textPrimary text-xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Meta info */}
            <div className="flex flex-wrap gap-2 text-xs">
              {task.priority && (
                <span
                  className={`px-2 py-1 rounded-full border font-semibold ${
                    task.priority.toLowerCase() === "high"
                      ? "bg-error/10 text-error border-error/40"
                      : task.priority.toLowerCase() === "medium"
                      ? "bg-warning/10 text-warning border-warning/40"
                      : "bg-success/10 text-success border-success/40"
                  }`}
                >
                  {task.priority} Priority
                </span>
              )}
              {task.effortHours != null && (
                <span className="px-2 py-1 rounded-full bg-surface text-textSecondary border border-border">
                  ⏱ Estimate: {task.effortHours}h
                </span>
              )}
              {task.sprintId && (
                <span className="px-2 py-1 rounded-full bg-primary/5 text-primary border border-primary/30">
                  Sprint: {task.sprintId}
                </span>
              )}
              {task.category && (
                <span className="px-2 py-1 rounded-full bg-surface text-textSecondary border border-border">
                  {task.category}
                </span>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-1">
                Description
              </h3>
              <p className="text-sm text-textSecondary whitespace-pre-wrap">
                {task.description || "No description provided for this task."}
              </p>
            </div>

            {/* Skills */}
            {Array.isArray(task.requiredSkills) &&
              task.requiredSkills.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-1">
                    Required Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {task.requiredSkills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-1 rounded-md bg-primary/5 text-primary text-xs border border-primary/20"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Status controls */}
            <div className="border border-border rounded-xl p-4 bg-surface">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div>
                  <p className="text-xs text-textMuted mb-1">Current Status</p>
                  <p className="text-sm font-semibold text-textPrimary capitalize">
                    {status.replace("_", " ")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="px-3 py-2 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primaryDark transition-colors"
                    onClick={() => handleStatusUpdate("in_progress")}
                  >
                    Start work
                  </button>
                  <button
                    className="px-3 py-2 rounded-lg text-xs font-medium bg-success text-white hover:bg-success/90 transition-colors"
                    onClick={() => handleStatusUpdate("done")}
                  >
                    Mark as done
                  </button>
                  <button
                    className="px-3 py-2 rounded-lg text-xs font-medium bg-error/10 text-error border border-error/40 hover:bg-error/20 transition-colors"
                    onClick={() => handleStatusUpdate("blocked")}
                  >
                    Mark as blocked
                  </button>
                </div>
              </div>

              {status === "blocked" && (
                <div className="mt-3">
                  <label className="text-xs text-textMuted mb-1 block">
                    Reason for blockage (helps your Scrum Master unblock you)
                  </label>
                  <textarea
                    rows={3}
                    value={blockedReason}
                    onChange={(e) => setBlockedReason(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-error/40"
                    placeholder="Describe what is blocking you..."
                  />
                </div>
              )}
            </div>

            {/* Work log */}
            <div className="border border-border rounded-xl p-4">
              <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wide mb-2">
                Log Work (optional)
              </h3>
              <p className="text-xs text-textMuted mb-2">
                Track how many hours you spent today on this task. This will feed
                into your personal workload and burndown analytics.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={workLogHours}
                  onChange={(e) => setWorkLogHours(e.target.value)}
                  className="w-24 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="0"
                />
                <span className="text-xs text-textSecondary">hours</span>
                <button
                  onClick={handleLogWork}
                  className="px-3 py-2 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primaryDark transition-colors"
                >
                  Log work
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-3 border-t border-border flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-textSecondary hover:text-textPrimary"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}












