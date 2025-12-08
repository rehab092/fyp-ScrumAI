import React, { useState } from "react";
import { motion } from "framer-motion";

export default function TaskDetailModal({ task, teamMembers, onClose, onAssign }) {
  const [selectedDeveloper, setSelectedDeveloper] = useState(task.assignedTo || "");

  const handleSave = () => {
    if (selectedDeveloper && selectedDeveloper !== task.assignedTo) {
      onAssign(task.id, selectedDeveloper);
    }
    onClose();
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high": return "bg-error/20 text-error border-error/30";
      case "medium": return "bg-warning/20 text-warning border-warning/30";
      case "low": return "bg-success/20 text-success border-success/30";
      default: return "bg-surface text-textSecondary border-border";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primaryDark to-primary p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Task Details</h2>
              <p className="text-white/80 text-sm mt-1">ID: {task.id}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-all flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="text-sm font-semibold text-textMuted mb-2 block">Task Title</label>
            <p className="text-lg font-bold text-textPrimary">{task.title}</p>
          </div>

          {/* Basic Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-textMuted mb-2 block">Priority</label>
              <span className={`px-4 py-2 rounded-lg text-sm font-semibold border inline-block ${getPriorityColor(task.priority)}`}>
                {task.priority}
              </span>
            </div>

            <div>
              <label className="text-sm font-semibold text-textMuted mb-2 block">Estimated Effort</label>
              <p className="text-lg font-bold text-textPrimary">⏱️ {task.effortHours} hours</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-textMuted mb-2 block">Story ID</label>
              <p className="text-lg font-bold text-textPrimary">{task.storyId}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-textMuted mb-2 block">Status</label>
              <p className="text-lg font-bold text-textPrimary">{task.status}</p>
            </div>
          </div>

          {/* Required Skills */}
          <div>
            <label className="text-sm font-semibold text-textMuted mb-2 block">Required Skills</label>
            <div className="flex flex-wrap gap-2">
              {task.requiredSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-2 bg-primary/10 border border-primary/30 rounded-lg text-sm text-primary font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Assign Developer */}
          <div>
            <label className="text-sm font-semibold text-textMuted mb-2 block">
              {task.assignedTo ? "Reassign to" : "Assign to Developer"}
            </label>
            <select
              value={selectedDeveloper}
              onChange={(e) => setSelectedDeveloper(e.target.value)}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white"
            >
              <option value="">-- Select Developer --</option>
              {teamMembers.map(member => {
                const percentage = Math.round((member.assignedHours / member.capacityHours) * 100);
                const isOverloaded = percentage >= 100;
                
                return (
                  <option key={member.id} value={member.id}>
                    {member.name} - {member.assignedHours}h/{member.capacityHours}h ({percentage}%)
                    {isOverloaded ? " ⚠️ OVERLOADED" : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Selected Developer Preview */}
          {selectedDeveloper && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-surface to-surfaceLight border border-border rounded-xl p-4"
            >
              {(() => {
                const developer = teamMembers.find(m => m.id === selectedDeveloper);
                if (!developer) return null;

                const skillMatch = task.requiredSkills.filter(skill => 
                  developer.skills.includes(skill)
                );
                const matchPercentage = Math.round((skillMatch.length / task.requiredSkills.length) * 100);

                return (
                  <>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold">
                        {developer.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-textPrimary">{developer.name}</p>
                        <p className="text-sm text-textSecondary">{developer.role}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className={`text-sm font-semibold ${
                          matchPercentage >= 80 ? "text-success" :
                          matchPercentage >= 50 ? "text-warning" :
                          "text-error"
                        }`}>
                          {matchPercentage}% Match
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-textMuted">Current Workload</span>
                        <span className="font-semibold text-textPrimary">
                          {developer.assignedHours}h / {developer.capacityHours}h
                        </span>
                      </div>
                      <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            developer.assignedHours >= developer.capacityHours ? "bg-error" :
                            developer.assignedHours >= developer.capacityHours * 0.8 ? "bg-warning" :
                            "bg-success"
                          }`}
                          style={{ width: `${Math.min((developer.assignedHours / developer.capacityHours) * 100, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-white">
                      <p className="text-xs text-textMuted mb-2">Skill Match:</p>
                      <div className="flex flex-wrap gap-2">
                        {task.requiredSkills.map((skill, idx) => {
                          const hasSkill = developer.skills.includes(skill);
                          return (
                            <span
                              key={idx}
                              className={`px-2 py-1 rounded-md text-xs font-medium ${
                                hasSkill
                                  ? "bg-success/20 text-success border border-success/30"
                                  : "bg-error/20 text-error border border-error/30"
                              }`}
                            >
                              {hasSkill ? "✓" : "✗"} {skill}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border p-6 bg-surface flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-border text-textSecondary rounded-lg hover:bg-white transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedDeveloper}
            className={`px-6 py-2 rounded-lg transition-all ${
              selectedDeveloper
                ? "bg-gradient-to-r from-primaryDark to-primary text-white hover:shadow-lg"
                : "bg-surface text-textMuted cursor-not-allowed"
            }`}
          >
            Save Assignment
          </button>
        </div>
      </motion.div>
    </div>
  );
}
















