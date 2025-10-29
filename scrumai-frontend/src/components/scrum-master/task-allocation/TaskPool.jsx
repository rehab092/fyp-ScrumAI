import React, { useState } from "react";
import { motion } from "framer-motion";

export default function TaskPool({ tasks, teamMembers, onTaskClick, onAssign }) {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-error/20 text-error border-error/30";
      case "medium":
        return "bg-warning/20 text-warning border-warning/30";
      case "low":
        return "bg-success/20 text-success border-success/30";
      default:
        return "bg-surface text-textSecondary border-border";
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || task.priority.toLowerCase() === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-textPrimary">Task Pool</h2>
          <p className="text-textSecondary text-sm">
            {filteredTasks.length} unassigned tasks
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-white border border-border rounded-xl">
            <span className="text-6xl">🎉</span>
            <p className="text-textMuted mt-4">No unassigned tasks found!</p>
          </div>
        ) : (
          filteredTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-border rounded-xl p-6 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => onTaskClick(task)}
            >
              <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                {/* Task Info */}
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">📝</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-textPrimary mb-2">
                        {task.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="text-textMuted">ID: {task.id}</span>
                        <span className="text-textMuted">Story: {task.storyId}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className="text-textMuted">⏱️ {task.effortHours}h</span>
                      </div>
                    </div>
                  </div>

                  {/* Required Skills */}
                  <div className="mt-4 pl-13">
                    <p className="text-xs text-textMuted mb-2">Required Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {task.requiredSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-primary/10 border border-primary/30 rounded-lg text-xs text-primary font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <select
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      if (e.target.value) {
                        onAssign(task.id, e.target.value);
                      }
                    }}
                    className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-all"
                  >
                    <option value="">Assign to...</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.assignedHours}h/{member.capacityHours}h)
                      </option>
                    ))}
                  </select>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskClick(task);
                    }}
                    className="px-4 py-2 border border-border text-textSecondary rounded-lg hover:bg-surface transition-all"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}



