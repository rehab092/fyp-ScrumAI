import React from "react";
import { motion } from "framer-motion";

export default function UserStoryCard({ story, isSelected, onClick, isDragging = false }) {
  const priorityColors = {
    'High': 'bg-error/20 text-error',
    'Medium': 'bg-warning/20 text-warning',
    'Low': 'bg-success/20 text-success'
  };

  const statusColors = {
    'Ready': 'bg-blue-500/20 text-blue-500',
    'In Progress': 'bg-warning/20 text-warning',
    'Completed': 'bg-success/20 text-success'
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      draggable
      className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
        isDragging ? 'opacity-50' : ''
      } ${
        isSelected
          ? 'border-primary bg-primary/10 shadow-lg'
          : 'border-border bg-surface hover:border-primary/50'
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-textPrimary line-clamp-2">{story.title}</h4>
          <p className="text-xs text-textSecondary truncate">{story.description}</p>
        </div>
        <div className="flex-shrink-0 ml-2">
          {story.storyPoints && (
            <div className="w-8 h-8 bg-primary/20 text-primary rounded flex items-center justify-center text-xs font-bold">
              {story.storyPoints}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className={`px-2 py-1 rounded text-xs font-semibold ${priorityColors[story.priority] || priorityColors['Medium']}`}>
          {story.priority}
        </span>
        <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[story.status] || statusColors['Ready']}`}>
          {story.status}
        </span>
      </div>

      {story.acceptanceCriteria && story.acceptanceCriteria.length > 0 && (
        <div className="text-xs text-textSecondary mt-2">
          <p className="font-semibold mb-1">{story.acceptanceCriteria.length} criteria</p>
        </div>
      )}

      {story.tasks && story.tasks.length > 0 && (
        <div className="text-xs text-textSecondary mt-2 pt-2 border-t border-border">
          <p className="font-semibold">{story.tasks.length} tasks</p>
        </div>
      )}
    </motion.div>
  );
}
