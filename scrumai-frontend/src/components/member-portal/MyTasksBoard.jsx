import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";

const STATUS_LABELS = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
  blocked: "Blocked",
};

export default function MyTasksBoard({
  tasks = [],
  currentUser,
  onTaskClick,
  onStatusChange,
}) {
  const [view, setView] = useState("list"); // "list" | "board"
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sprintFilter, setSprintFilter] = useState("all");

  const myTasks = useMemo(
    () => tasks.filter((t) => t.assignedTo === currentUser?.id),
    [tasks, currentUser]
  );

  const allSprints = useMemo(
    () => Array.from(new Set(myTasks.map((t) => t.sprintId).filter(Boolean))),
    [myTasks]
  );

  const filteredTasks = myTasks.filter((task) => {
    if (statusFilter !== "all" && task.status !== statusFilter) return false;
    if (
      priorityFilter !== "all" &&
      task.priority?.toLowerCase() !== priorityFilter
    )
      return false;
    if (sprintFilter !== "all" && task.sprintId !== sprintFilter) return false;
    return true;
  });

  const groupedByStatus = filteredTasks.reduce(
    (acc, task) => {
      acc[task.status] = acc[task.status] || [];
      acc[task.status].push(task);
      return acc;
    },
    { todo: [], in_progress: [], done: [], blocked: [] }
  );

  const renderTaskCard = (task, index) => (
    <motion.div
      key={task.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className="bg-white border border-border rounded-xl p-4 hover:shadow-md transition-all cursor-pointer"
      onClick={() => onTaskClick?.(task)}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-textPrimary mb-1">
            {task.title}
          </h3>
          <p className="text-xs text-textMuted mb-2">
            Story:{" "}
            <span className="font-medium text-textSecondary">
              {task.storyId || "-"}
            </span>
          </p>
          <div className="flex flex-wrap gap-2 mb-2 text-xs">
            {task.priority && (
              <span
                className={`px-2 py-1 rounded-full border text-[11px] font-semibold ${
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
              <span className="px-2 py-1 rounded-full bg-surface text-textSecondary border border-border text-[11px]">
                ⏱ {task.effortHours}h
              </span>
            )}
            {task.category && (
              <span className="px-2 py-1 rounded-full bg-primary/5 text-primary border border-primary/30 text-[11px]">
                {task.category}
              </span>
            )}
          </div>
          {Array.isArray(task.requiredSkills) && task.requiredSkills.length > 0 && (
            <div className="mt-2">
              <p className="text-[11px] text-textMuted mb-1">Required skills</p>
              <div className="flex flex-wrap gap-1">
                {task.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2 py-1 rounded-md bg-primary/5 text-primary text-[11px] border border-primary/20"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {task.dueStatus && (
            <span
              className={`px-2 py-1 rounded-full text-[11px] font-semibold ${
                task.dueStatus === "overdue"
                  ? "bg-error/10 text-error"
                  : task.dueStatus === "today"
                  ? "bg-warning/10 text-warning"
                  : "bg-surface text-textSecondary"
              }`}
            >
              {task.dueStatus === "overdue"
                ? "Overdue"
                : task.dueStatus === "today"
                ? "Due today"
                : "Upcoming"}
            </span>
          )}
          <select
            value={task.status}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onStatusChange?.(task, e.target.value)}
            className="mt-1 px-2 py-1 border border-border rounded-md text-[11px] text-textSecondary bg-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="done">Done</option>
          </select>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header and view toggle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-textPrimary">My Tasks</h2>
          <p className="text-sm text-textSecondary">
            Tasks currently assigned to you, with quick filters and status
            updates.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button
            className={`px-3 py-2 rounded-lg text-xs font-medium border ${
              view === "list"
                ? "bg-primary text-white border-primary"
                : "bg-surface text-textSecondary border-border"
            }`}
            onClick={() => setView("list")}
          >
            List View
          </button>
          <button
            className={`px-3 py-2 rounded-lg text-xs font-medium border ${
              view === "board"
                ? "bg-primary text-white border-primary"
                : "bg-surface text-textSecondary border-border"
            }`}
            onClick={() => setView("board")}
          >
            Kanban Board
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-border rounded-lg bg-white text-textSecondary focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="all">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="blocked">Blocked</option>
          <option value="done">Done</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-border rounded-lg bg-white text-textSecondary focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="all">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select
          value={sprintFilter}
          onChange={(e) => setSprintFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-border rounded-lg bg-white text-textSecondary focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="all">All Sprints</option>
          {allSprints.map((sprintId) => (
            <option key={sprintId} value={sprintId}>
              {sprintId}
            </option>
          ))}
        </select>
        <span className="text-xs text-textMuted">
          Showing{" "}
          <span className="font-semibold text-textPrimary">
            {filteredTasks.length}
          </span>{" "}
          of {myTasks.length} tasks
        </span>
      </div>

      {/* Content */}
      {view === "list" ? (
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="bg-surface border border-border rounded-2xl p-8 text-center">
              <p className="text-4xl mb-2">✅</p>
              <p className="text-sm text-textMuted">
                No tasks match your filters. Adjust filters or check back later.
              </p>
            </div>
          ) : (
            filteredTasks.map((task, index) => renderTaskCard(task, index))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {["todo", "in_progress", "blocked", "done"].map((statusKey) => (
            <div
              key={statusKey}
              className="bg-surface border border-border rounded-2xl p-3 flex flex-col max-h-[70vh]"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-textSecondary uppercase tracking-wide">
                  {STATUS_LABELS[statusKey]}
                </h3>
                <span className="text-[11px] text-textMuted">
                  {groupedByStatus[statusKey]?.length || 0}
                </span>
              </div>
              <div className="space-y-3 overflow-y-auto pr-1">
                {(groupedByStatus[statusKey] || []).length === 0 ? (
                  <p className="text-[11px] text-textMuted text-center py-4">
                    No tasks in this column.
                  </p>
                ) : (
                  groupedByStatus[statusKey].map((task, index) =>
                    renderTaskCard(task, index)
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
