import React from "react";
import { motion } from "framer-motion";

export default function TeamCapacityOverview({ teamMembers, onMemberClick }) {
  const getStatusColor = (status) => {
    switch (status) {
      case "free":
        return "from-success/20 to-success/10 border-success/30";
      case "active":
        return "from-primary/20 to-primary/10 border-primary/30";
      case "high":
        return "from-warning/20 to-warning/10 border-warning/30";
      case "overloaded":
        return "from-error/20 to-error/10 border-error/30";
      default:
        return "from-surface to-surfaceLight border-border";
    }
  };

  const getCapacityPercentage = (assignedHours, capacityHours) => {
    return Math.round((assignedHours / capacityHours) * 100);
  };

  const getCapacityColor = (percentage) => {
    if (percentage >= 100) return "bg-error";
    if (percentage >= 80) return "bg-warning";
    if (percentage >= 60) return "bg-primary";
    return "bg-success";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-textPrimary">Team Capacity Overview</h2>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success"></div>
            <span className="text-textMuted">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning"></div>
            <span className="text-textMuted">High Load</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-error"></div>
            <span className="text-textMuted">Overloaded</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamMembers.map((member, index) => {
          const percentage = getCapacityPercentage(member.assignedHours, member.capacityHours);
          
          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onMemberClick(member)}
              className={`bg-gradient-to-br ${getStatusColor(member.status)} border rounded-2xl p-6 cursor-pointer hover:shadow-xl transition-all transform hover:-translate-y-1`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {member.avatar}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-textPrimary">{member.name}</h3>
                    <p className="text-sm text-textSecondary">{member.role}</p>
                  </div>
                </div>
                {member.status === "overloaded" && (
                  <span className="px-2 py-1 bg-error/20 text-error text-xs font-semibold rounded-full">
                    ⚠️ Overload
                  </span>
                )}
                {member.status === "free" && (
                  <span className="px-2 py-1 bg-success/20 text-success text-xs font-semibold rounded-full">
                    ✓ Free
                  </span>
                )}
              </div>

              {/* Skills */}
              <div className="mb-4">
                <p className="text-xs text-textMuted mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {member.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-white/50 border border-border rounded-md text-xs text-textPrimary font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Capacity Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-textMuted">Workload</span>
                  <span className="text-sm font-bold text-textPrimary">
                    {member.assignedHours}h / {member.capacityHours}h
                  </span>
                </div>
                <div className="relative w-full h-3 bg-white/50 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentage, 100)}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className={`absolute left-0 top-0 h-full ${getCapacityColor(percentage)} rounded-full`}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-semibold ${
                    percentage >= 100 ? "text-error" : 
                    percentage >= 80 ? "text-warning" : 
                    "text-success"
                  }`}>
                    {percentage}% Capacity
                  </span>
                  <span className="text-xs text-textMuted">
                    {member.capacityHours - member.assignedHours}h remaining
                  </span>
                </div>
              </div>

              {/* Tasks Count */}
              <div className="mt-4 pt-4 border-t border-white/30">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-textMuted">Tasks Assigned</span>
                  <span className="font-bold text-textPrimary">
                    {Math.floor(member.assignedHours / 8)} tasks
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
















