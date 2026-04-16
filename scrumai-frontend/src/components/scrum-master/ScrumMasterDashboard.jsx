import React from "react";
import { motion } from "framer-motion";

export default function ScrumMasterDashboard({ sprints, selectedSprintId, setSelectedSprintId, onStartNewSprint }) {
  const kpiMetrics = [
    {
      title: "Sprint Health",
      value: "Excellent",
      change: "+5%",
      trend: "up",
      icon: "💚",
      color: "text-green-400"
    },
    {
      title: "Team Velocity",
      value: "42 pts",
      change: "+8%",
      trend: "up",
      icon: "🚀",
      color: "text-textPrimary"
    },
    {
      title: "On-Time Delivery",
      value: "95%",
      change: "+12%",
      trend: "up",
      icon: "⏰",
      color: "text-green-400"
    },
    {
      title: "Risk Level",
      value: "Low",
      change: "-3%",
      trend: "down",
      icon: "⚠️",
      color: "text-yellow-400"
    }
  ];

  const activeSprints = sprints && sprints.length > 0 ? sprints.map((sprint) => ({
    id: sprint.id,
    name: sprint.name || sprint.sprint_name || `Sprint ${sprint.id}`,
    progress: sprint.progress || 0,
    startDate: sprint.start_date || sprint.startDate || '',
    endDate: sprint.end_date || sprint.endDate || '',
    teamSize: sprint.team_size || sprint.teamSize || 0,
    completedTasks: sprint.completed_tasks || sprint.completedTasks || 0,
    totalTasks: sprint.total_tasks || sprint.totalTasks || 0,
    blockers: sprint.blockers || sprint.blocker_count || 0,
    status: sprint.is_active ? 'On Track' : 'Inactive'
  })) : [
    {
      id: "Sprint 24",
      name: "Q4 Feature Release",
      progress: 87,
      startDate: "2024-12-16",
      endDate: "2024-12-30",
      teamSize: 5,
      completedTasks: 24,
      totalTasks: 28,
      blockers: 1,
      status: "On Track"
    },
    {
      id: "Sprint 25",
      name: "Performance Optimization",
      progress: 0,
      startDate: "2024-12-31",
      endDate: "2025-01-14",
      teamSize: 5,
      completedTasks: 0,
      totalTasks: 32,
      blockers: 0,
      status: "Planning"
    }
  ];

  const teamPerformance = [
    {
      name: "Sarah Chen",
      role: "Frontend Dev",
      velocity: 8.5,
      capacity: 10,
      efficiency: 85,
      tasksCompleted: 12,
      status: "Excellent"
    },
    {
      name: "Mike Johnson",
      role: "Backend Dev",
      velocity: 9.2,
      capacity: 10,
      efficiency: 92,
      tasksCompleted: 15,
      status: "Excellent"
    },
    {
      name: "Emma Davis",
      role: "Full Stack",
      velocity: 7.8,
      capacity: 10,
      efficiency: 78,
      tasksCompleted: 10,
      status: "Good"
    },
    {
      name: "Alex Rodriguez",
      role: "DevOps",
      velocity: 6.5,
      capacity: 10,
      efficiency: 65,
      tasksCompleted: 8,
      status: "Needs Attention"
    }
  ];

  const riskAlerts = [
    {
      id: 1,
      type: "dependency",
      severity: "High",
      title: "Payment Integration Blocked",
      description: "Shopping cart completion is blocking payment processing",
      impact: "2-day delay risk",
      suggestedAction: "Consider parallel development approach"
    },
    {
      id: 2,
      type: "capacity",
      severity: "Medium",
      title: "Alex Underutilized",
      description: "DevOps engineer at 65% capacity",
      impact: "Resource inefficiency",
      suggestedAction: "Reassign additional tasks or cross-training"
    },
    {
      id: 3,
      type: "timeline",
      severity: "Low",
      title: "Sprint 25 Planning",
      description: "Next sprint planning session scheduled",
      impact: "Planning efficiency",
      suggestedAction: "Prepare backlog refinement"
    }
  ];

  const recentActivities = [
    {
      type: "sprint_update",
      message: "Sprint 24 progress updated to 87%",
      time: "2 hours ago",
      icon: "📊"
    },
    {
      type: "task_completed",
      message: "Sarah completed 'User Authentication UI' task",
      time: "3 hours ago",
      icon: "✅"
    },
    {
      type: "blocker_resolved",
      message: "API dependency blocker resolved",
      time: "5 hours ago",
      icon: "🔓"
    },
    {
      type: "team_meeting",
      message: "Daily standup completed",
      time: "6 hours ago",
      icon: "👥"
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "Excellent": return "bg-success/20 text-success";
      case "Good": return "bg-primary/20 text-primary";
      case "Needs Attention": return "bg-warning/20 text-warning";
      case "On Track": return "bg-success/20 text-success";
      case "Planning": return "bg-textMuted/20 text-textMuted";
      default: return "bg-surface text-textSecondary";
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "High": return "bg-error/20 text-error border-error/30";
      case "Medium": return "bg-warning/20 text-warning border-warning/30";
      case "Low": return "bg-success/20 text-success border-success/30";
      default: return "bg-surface text-textSecondary border-border";
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <button onClick={onStartNewSprint} className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-primary to-primaryDark text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105">
          <span className="text-2xl">🚀</span>
          <div className="text-left">
            <div className="font-semibold">Start New Sprint</div>
            <div className="text-xs text-white/80">Begin sprint planning</div>
          </div>
        </button>
        <button className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-secondary to-accent text-white rounded-xl hover:shadow-lg transition-all duration-300 transform hover:scale-105">
          <span className="text-2xl">📊</span>
          <div className="text-left">
            <div className="font-semibold">Generate Report</div>
            <div className="text-xs text-white/80">Create sprint report</div>
          </div>
        </button>
      </motion.div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpiMetrics.map((metric, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className="bg-white border border-border rounded-2xl p-6 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="text-2xl">{metric.icon}</div>
              <div className={`text-sm font-medium ${
                metric.trend === "up" ? "text-success" : "text-error"
              }`}>
                {metric.change}
              </div>
            </div>
            <div className="text-2xl font-bold mb-1 text-textPrimary">{metric.value}</div>
            <div className="text-textSecondary text-sm">{metric.title}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Sprints */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="lg:col-span-2 bg-white border border-border rounded-2xl p-6"
        >
          <div className="space-y-6">
            {activeSprints.map((sprint, index) => (
              <div key={sprint.id} className="bg-surface border border-border rounded-xl p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-textPrimary">{sprint.id}</h3>
                    <p className="text-textSecondary text-sm">{sprint.name}</p>
                    <p className="text-textMuted text-xs">
                      {sprint.startDate} - {sprint.endDate}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(sprint.status)}`}>
                      {sprint.status}
                    </span>
                    <div className="text-right">
                      <div className="text-textPrimary font-semibold">{sprint.progress}%</div>
                      <div className="text-textSecondary text-sm">Complete</div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-surfaceDark rounded-full h-3 mb-4">
                  <div
                    className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-500"
                    style={{ width: `${sprint.progress}%` }}
                  />
                </div>

                {/* Sprint Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-textLight">{sprint.teamSize}</div>
                    <div className="text-textMuted text-sm">Team Size</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-textLight">{sprint.completedTasks}/{sprint.totalTasks}</div>
                    <div className="text-textMuted text-sm">Tasks</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-textLight">{sprint.blockers}</div>
                    <div className="text-textMuted text-sm">Blockers</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-textLight">
                      {Math.round((sprint.completedTasks / sprint.totalTasks) * 100)}%
                    </div>
                    <div className="text-textMuted text-sm">Completion</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Risk Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-white/60 border border-sandTan/20 rounded-2xl p-6"
        >
          <div className="space-y-4">
            {riskAlerts.map((alert, index) => (
              <div key={alert.id} className={`border rounded-xl p-4 ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm">{alert.title}</h3>
                  <span className="text-xs font-medium">{alert.severity}</span>
                </div>
                <p className="text-xs mb-2">{alert.description}</p>
                <p className="text-xs mb-3 font-medium">Impact: {alert.impact}</p>
                <div className="flex gap-2">
                  <button className="bg-sandTan text-nightBlue px-2 py-1 rounded text-xs hover:bg-sandTanShadow transition-all">
                    Action
                  </button>
                  <button className="border border-current px-2 py-1 rounded text-xs hover:bg-current/10 transition-all">
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Team Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mt-8 bg-white/60 border border-sandTan/20 rounded-2xl p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {teamPerformance.map((member, index) => (
            <div key={index} className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-textLight font-semibold">{member.name}</h3>
                  <p className="text-textMuted text-sm">{member.role}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                  {member.status}
                </span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-textMuted text-sm">Velocity</span>
                    <span className="text-textPrimary text-sm font-semibold">{member.velocity}/10</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-2">
                    <div
                      className="bg-sandTan h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(member.velocity / 10) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-textMuted text-sm">Efficiency</span>
                    <span className="text-textPrimary text-sm font-semibold">{member.efficiency}%</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        member.efficiency >= 80 ? "bg-green-500" :
                        member.efficiency >= 60 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: `${member.efficiency}%` }}
                    />
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-textLight">{member.tasksCompleted}</div>
                  <div className="text-textMuted text-sm">Tasks Completed</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="mt-8 bg-white/60 border border-sandTan/20 rounded-2xl p-6"
      >
        <div className="space-y-4">
          {recentActivities.map((activity, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="text-lg">{activity.icon}</div>
              <div className="flex-1">
                <p className="text-textLight text-sm">{activity.message}</p>
                <p className="text-textMuted text-xs mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}