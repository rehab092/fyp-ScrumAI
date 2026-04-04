import React from "react";
import { motion } from "framer-motion";

export default function ProjectCard({ project, isSelected, onClick, showStoryCount = true }) {
  const storyCount = project.userStories?.length || 0;
  const completedCount = project.userStories?.filter(s => s.status === 'Completed').length || 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
        isSelected
          ? 'border-primary bg-primary/10 shadow-lg'
          : 'border-border bg-surface hover:border-primary/50'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-bold text-textPrimary">{project.projectName}</h3>
          <p className="text-xs text-textSecondary truncate">{project.projectDescription}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold flex-shrink-0 ml-2 ${
          project.status === 'Active' ? 'bg-success/20 text-success' :
          project.status === 'Planning' ? 'bg-warning/20 text-warning' :
          'bg-textSecondary/20 text-textSecondary'
        }`}>
          {project.status}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-textSecondary">
        <span className={`px-2 py-1 rounded ${
          project.priority === 'High' ? 'bg-error/20 text-error' :
          project.priority === 'Medium' ? 'bg-warning/20 text-warning' :
          'bg-success/20 text-success'
        }`}>
          {project.priority}
        </span>
      </div>

      {showStoryCount && (
        <div className="mt-3 pt-3 border-t border-border text-xs">
          <div className="flex items-center justify-between">
            <span className="text-textSecondary">{storyCount} stories</span>
            <span className="text-success font-semibold">{completedCount} done</span>
          </div>
          {storyCount > 0 && (
            <div className="w-full bg-background rounded-full h-1 mt-2">
              <div
                className="bg-success h-1 rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / storyCount) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
