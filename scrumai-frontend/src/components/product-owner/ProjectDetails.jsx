import React from "react";
import { motion } from "framer-motion";

export default function ProjectDetails({ project, onEdit, onDelete }) {
  const storyCount = project.userStories?.length || 0;
  const completedCount = project.userStories?.filter(s => s.status === 'Completed').length || 0;
  const inProgressCount = project.userStories?.filter(s => s.status === 'In Progress').length || 0;

  const formattedStartDate = new Date(project.startDate).toLocaleDateString();
  const formattedEndDate = new Date(project.endDate).toLocaleDateString();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full overflow-y-auto"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold text-textPrimary">{project.projectName}</h2>
              <p className="text-textSecondary mt-1">{project.projectDescription}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold flex-shrink-0 ${
              project.status === 'Active' ? 'bg-success/20 text-success' :
              project.status === 'Planning' ? 'bg-warning/20 text-warning' :
              'bg-textSecondary/20 text-textSecondary'
            }`}>
              {project.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold inline-block ${
              project.priority === 'High' ? 'bg-error/20 text-error' :
              project.priority === 'Medium' ? 'bg-warning/20 text-warning' :
              'bg-success/20 text-success'
            }`}>
              {project.priority} Priority
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-surface rounded-lg p-4 border border-border">
            <p className="text-xs text-textSecondary mb-1">Total Stories</p>
            <p className="text-2xl font-bold text-textPrimary">{storyCount}</p>
          </div>
          <div className="bg-surface rounded-lg p-4 border border-border">
            <p className="text-xs text-textSecondary mb-1">In Progress</p>
            <p className="text-2xl font-bold text-warning">{inProgressCount}</p>
          </div>
          <div className="bg-surface rounded-lg p-4 border border-border">
            <p className="text-xs text-textSecondary mb-1">Completed</p>
            <p className="text-2xl font-bold text-success">{completedCount}</p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-textSecondary mb-1 block">Goal</label>
            <p className="text-textPrimary">{project.projectGoal}</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-textSecondary mb-1 block">Timeline</label>
            <p className="text-textPrimary">{formattedStartDate} → {formattedEndDate}</p>
          </div>

          {project.userStories && project.userStories.length > 0 && (
            <div>
              <label className="text-sm font-semibold text-textSecondary mb-2 block">User Stories ({storyCount})</label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {project.userStories.map((story, idx) => (
                  <div key={story.storyId} className="p-3 bg-surface rounded-lg border border-border text-sm">
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-textPrimary flex-1">{story.title}</p>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold flex-shrink-0 ml-2 ${
                        story.status === 'Completed' ? 'bg-success/20 text-success' :
                        story.status === 'In Progress' ? 'bg-warning/20 text-warning' :
                        'bg-blue-500/20 text-blue-500'
                      }`}>
                        {story.status}
                      </span>
                    </div>
                    <p className="text-xs text-textSecondary mt-1">{story.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4 border-t border-border">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onEdit}
            className="px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors font-medium text-sm"
          >
            ✏️ Edit
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDelete}
            className="px-4 py-2 bg-error/20 text-error rounded-lg hover:bg-error/30 transition-colors font-medium text-sm"
          >
            🗑️ Delete
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
