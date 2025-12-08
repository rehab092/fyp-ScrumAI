import React from "react";
import { motion } from "framer-motion";

export default function TaskAssignmentBoard({ tasks, teamMembers, onTaskAssign }) {
  const [draggedTask, setDraggedTask] = React.useState(null);

  const unassignedTasks = tasks.filter(t => !t.assignedTo);
  
  const getTasksForDeveloper = (devId) => {
    return tasks.filter(t => t.assignedTo === devId);
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, developerId) => {
    e.preventDefault();
    if (draggedTask && draggedTask.assignedTo !== developerId) {
      onTaskAssign(draggedTask.id, developerId);
    }
    setDraggedTask(null);
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high": return "border-l-error";
      case "medium": return "border-l-warning";
      case "low": return "border-l-success";
      default: return "border-l-border";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-textPrimary">Assignment Board</h2>
        <p className="text-textSecondary text-sm">Drag tasks to assign them to developers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Unassigned Tasks Column */}
        <div className="lg:col-span-1 bg-white border-2 border-dashed border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-textPrimary">Unassigned</h3>
            <span className="px-2 py-1 bg-warning/20 text-warning text-xs font-semibold rounded-full">
              {unassignedTasks.length}
            </span>
          </div>
          
          <div className="space-y-3 min-h-[400px]">
            {unassignedTasks.map(task => (
              <motion.div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
                className={`bg-white border-l-4 ${getPriorityColor(task.priority)} border border-border rounded-lg p-3 cursor-move hover:shadow-lg transition-all`}
                whileHover={{ scale: 1.02 }}
              >
                <p className="font-semibold text-sm text-textPrimary mb-1">{task.title}</p>
                <div className="flex items-center gap-2 text-xs text-textMuted">
                  <span>⏱️ {task.effortHours}h</span>
                  <span>•</span>
                  <span className="capitalize">{task.priority}</span>
                </div>
              </motion.div>
            ))}
            {unassignedTasks.length === 0 && (
              <p className="text-center text-textMuted text-sm py-8">No unassigned tasks</p>
            )}
          </div>
        </div>

        {/* Developer Columns */}
        <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {teamMembers.map(developer => {
            const assignedTasks = getTasksForDeveloper(developer.id);
            const percentage = Math.round((developer.assignedHours / developer.capacityHours) * 100);
            const isOverloaded = percentage >= 100;
            
            return (
              <div
                key={developer.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, developer.id)}
                className={`bg-gradient-to-br ${
                  isOverloaded 
                    ? "from-error/10 to-error/5 border-error/30" 
                    : "from-primary/5 to-primary/0 border-primary/20"
                } border-2 rounded-xl p-4 ${isOverloaded ? "ring-2 ring-error/30" : ""}`}
              >
                {/* Developer Header */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-xs">
                      {developer.avatar}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-sm text-textPrimary">{developer.name}</h3>
                      <p className="text-xs text-textMuted">{developer.role}</p>
                    </div>
                  </div>
                  
                  {/* Capacity Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-textMuted">{developer.assignedHours}h / {developer.capacityHours}h</span>
                      <span className={`font-semibold ${isOverloaded ? "text-error" : "text-success"}`}>
                        {percentage}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${isOverloaded ? "bg-error" : "bg-success"} transition-all`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Assigned Tasks */}
                <div className="space-y-2 min-h-[300px]">
                  {assignedTasks.map(task => (
                    <motion.div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      layout
                      className={`bg-white border-l-4 ${getPriorityColor(task.priority)} border border-border rounded-lg p-3 cursor-move hover:shadow-lg transition-all`}
                      whileHover={{ scale: 1.02 }}
                    >
                      <p className="font-semibold text-xs text-textPrimary mb-1">{task.title}</p>
                      <div className="flex items-center gap-2 text-xs text-textMuted">
                        <span>⏱️ {task.effortHours}h</span>
                        <span>•</span>
                        <span className="capitalize">{task.priority}</span>
                      </div>
                    </motion.div>
                  ))}
                  {assignedTasks.length === 0 && (
                    <p className="text-center text-textMuted text-xs py-8">
                      Drag tasks here
                    </p>
                  )}
                </div>

                {/* Task Count */}
                <div className="mt-3 pt-3 border-t border-white/30">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-textMuted">Tasks</span>
                    <span className="font-bold text-textPrimary">{assignedTasks.length}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
















