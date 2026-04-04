import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function StoryAllocationPanel({ isOpen, story, onClose, onSave }) {
  const [tasks, setTasks] = useState([]);
  const totalPoints = story?.storyPoints || 0;

  useEffect(() => {
    if (story && story.tasks) {
      setTasks(JSON.parse(JSON.stringify(story.tasks)));
    }
  }, [story, isOpen]);

  const allocatedPoints = tasks.reduce((sum, task) => sum + (task.allocatedPoints || 0), 0);
  const remainingPoints = totalPoints - allocatedPoints;

  const handlePointsChange = (taskId, points) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId ? { ...task, allocatedPoints: Math.max(0, points) } : task
      )
    );
  };

  const autoDistribute = () => {
    if (tasks.length === 0) return;
    const pointsPerTask = Math.floor(totalPoints / tasks.length);
    const remainder = totalPoints % tasks.length;
    
    const newTasks = tasks.map((task, idx) => ({
      ...task,
      allocatedPoints: pointsPerTask + (idx < remainder ? 1 : 0)
    }));
    setTasks(newTasks);
  };

  const clearAllocation = () => {
    setTasks(prev => prev.map(task => ({ ...task, allocatedPoints: 0 })));
  };

  const handleSave = () => {
    onSave({
      ...story,
      tasks
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl mx-auto px-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-textPrimary">
                  Story Points Allocation
                </h2>
                <button
                  onClick={onClose}
                  className="text-textSecondary hover:text-textPrimary transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-surface border border-border rounded-lg p-4">
                    <p className="text-xs text-textSecondary mb-1">Total Points</p>
                    <p className="text-2xl font-bold text-textPrimary">{totalPoints}</p>
                  </div>
                  <div className="bg-surface border border-border rounded-lg p-4">
                    <p className="text-xs text-textSecondary mb-1">Allocated</p>
                    <p className={`text-2xl font-bold ${allocatedPoints === totalPoints ? 'text-success' : 'text-warning'}`}>
                      {allocatedPoints}
                    </p>
                  </div>
                  <div className="bg-surface border border-border rounded-lg p-4">
                    <p className="text-xs text-textSecondary mb-1">Remaining</p>
                    <p className={`text-2xl font-bold ${remainingPoints === 0 ? 'text-success' : remainingPoints > 0 ? 'text-info' : 'text-error'}`}>
                      {remainingPoints}
                    </p>
                  </div>
                </div>

                {/* Status Messages */}
                {remainingPoints !== 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-4 rounded-lg border ${
                      remainingPoints > 0 
                        ? 'bg-info/20 border-info text-info' 
                        : 'bg-error/20 border-error text-error'
                    }`}
                  >
                    {remainingPoints > 0 
                      ? `⚠️ ${remainingPoints} points still unallocated`
                      : `⚠️ ${Math.abs(remainingPoints)} points overallocated - please adjust`
                    }
                  </motion.div>
                )}

                {allocatedPoints === totalPoints && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-4 rounded-lg border bg-success/20 border-success text-success"
                  >
                    ✓ Perfect! All points are allocated.
                  </motion.div>
                )}

                {/* Tasks Allocation */}
                <div className="space-y-3">
                  <h3 className="font-bold text-textPrimary">Distribute Points Among Tasks</h3>
                  {tasks.map((task, idx) => {
                    const percentage = totalPoints > 0 ? (task.allocatedPoints / totalPoints) * 100 : 0;
                    return (
                      <div key={task.id} className="bg-surface border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium text-textPrimary">{idx + 1}. {task.name}</p>
                            <p className="text-xs text-textSecondary mt-1">{percentage.toFixed(0)}% of total</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={task.allocatedPoints}
                              onChange={(e) => handlePointsChange(task.id, parseInt(e.target.value) || 0)}
                              min="0"
                              max={totalPoints}
                              className="w-16 px-3 py-2 border border-border rounded text-center focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <span className="text-textSecondary text-sm">/ {totalPoints}</span>
                          </div>
                        </div>
                        <div className="w-full bg-background rounded-full h-2">
                          <motion.div
                            layout
                            className="bg-primary rounded-full h-2 transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={autoDistribute}
                    className="flex-1 px-4 py-2 bg-secondary/20 text-secondary rounded-lg hover:bg-secondary/30 transition-colors font-medium text-sm"
                  >
                    🔀 Auto Distribute
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearAllocation}
                    className="flex-1 px-4 py-2 bg-textSecondary/20 text-textSecondary rounded-lg hover:bg-textSecondary/30 transition-colors font-medium text-sm"
                  >
                    🔄 Clear All
                  </motion.button>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 justify-end pt-6 border-t border-border mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 border border-border text-textPrimary rounded-lg hover:bg-surface transition-colors font-medium"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  disabled={remainingPoints !== 0}
                  className={`px-6 py-2 rounded-lg hover:shadow-lg transition-all font-medium ${
                    remainingPoints === 0
                      ? 'bg-gradient-to-r from-primary to-primaryLight text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {remainingPoints === 0 ? '✓ Save Allocation' : 'Allocate All Points First'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
