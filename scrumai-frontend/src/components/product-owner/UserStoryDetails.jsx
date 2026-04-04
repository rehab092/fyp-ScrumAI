import React from "react";
import { motion } from "framer-motion";

export default function UserStoryDetails({ story, onEdit, onDelete, onEditAllocation }) {
  const formattedDate = new Date(story.createdDate).toLocaleDateString();
  const allocatedPoints = story.tasks?.reduce((sum, task) => sum + (task.allocatedPoints || 0), 0) || 0;
  const remainingPoints = story.storyPoints - allocatedPoints;

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
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full overflow-y-auto"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-start justify-between mb-3">
            <h2 className="text-3xl font-bold text-textPrimary flex-1">{story.title}</h2>
            <div className="flex-shrink-0">
              {story.storyPoints && (
                <div className="w-12 h-12 bg-primary/20 text-primary rounded-lg flex items-center justify-center font-bold text-lg">
                  {story.storyPoints}
                </div>
              )}
            </div>
          </div>
          <p className="text-textSecondary mb-3">{story.description}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-3 py-1 rounded text-sm font-semibold ${priorityColors[story.priority] || priorityColors['Medium']}`}>
              {story.priority}
            </span>
            <span className={`px-3 py-1 rounded text-sm font-semibold ${statusColors[story.status] || statusColors['Ready']}`}>
              {story.status}
            </span>
            <span className="text-xs text-textSecondary px-3 py-1">📅 {formattedDate}</span>
          </div>
        </div>

        {/* Acceptance Criteria */}
        {story.acceptanceCriteria && story.acceptanceCriteria.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-textPrimary mb-3">Acceptance Criteria</h3>
            <ul className="space-y-2">
              {story.acceptanceCriteria.map((criteria, idx) => (
                <li key={idx} className="flex items-start gap-2 text-textSecondary">
                  <span className="text-primary font-bold mt-1">✓</span>
                  <span>{criteria}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Story Points Allocation */}
        {story.storyPoints && story.tasks && story.tasks.length > 0 && (
          <div className="bg-surface border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-textPrimary">Story Points Allocation</h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onEditAllocation}
                className="px-3 py-1 bg-primary/20 text-primary rounded text-sm hover:bg-primary/30 transition-colors font-medium"
              >
                ⚙️ Adjust
              </motion.button>
            </div>

            <div className="space-y-2 mb-4">
              {story.tasks.map((task, idx) => (
                <div key={task.id} className="flex items-center justify-between text-sm">
                  <span className="text-textPrimary flex-1">{task.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-background rounded h-2">
                      <div
                        className="bg-primary rounded h-2 transition-all duration-300"
                        style={{ width: `${(task.allocatedPoints / story.storyPoints) * 100}%` }}
                      />
                    </div>
                    <span className="text-textSecondary font-semibold w-12 text-right">{task.allocatedPoints}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-3 grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-textSecondary text-xs mb-1">Total</p>
                <p className="font-bold text-textPrimary">{story.storyPoints}</p>
              </div>
              <div>
                <p className="text-textSecondary text-xs mb-1">Allocated</p>
                <p className={`font-bold ${remainingPoints === 0 ? 'text-success' : 'text-warning'}`}>
                  {allocatedPoints}
                </p>
              </div>
              <div>
                <p className="text-textSecondary text-xs mb-1">Remaining</p>
                <p className={`font-bold ${remainingPoints === 0 ? 'text-success' : remainingPoints > 0 ? 'text-info' : 'text-error'}`}>
                  {remainingPoints}
                </p>
              </div>
            </div>

            {remainingPoints !== 0 && (
              <div className={`mt-3 text-xs p-2 rounded ${
                remainingPoints > 0 ? 'bg-info/20 text-info' : 'bg-error/20 text-error'
              }`}>
                {remainingPoints > 0 ? `⚠️ ${remainingPoints} points unallocated` : `⚠️ ${Math.abs(remainingPoints)} points overallocated`}
              </div>
            )}
          </div>
        )}

        {/* Tasks List */}
        {story.tasks && story.tasks.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-textPrimary mb-3">Tasks ({story.tasks.length})</h3>
            <div className="space-y-2">
              {story.tasks.map((task) => (
                <div key={task.id} className="p-3 bg-surface rounded-lg border border-border text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-textPrimary font-medium">{task.name}</span>
                    {task.allocatedPoints && (
                      <span className="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-bold">
                        {task.allocatedPoints} pts
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
