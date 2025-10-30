import React, { useState } from "react";
import { motion } from "framer-motion";
import TeamCapacityOverview from "./task-allocation/TeamCapacityOverview";
import TaskPool from "./task-allocation/TaskPool";
import AutoAssignModal from "./task-allocation/AutoAssignModal";
import TaskAssignmentBoard from "./task-allocation/TaskAssignmentBoard";
import WorkloadCharts from "./task-allocation/WorkloadCharts";
import AlertsPanel from "./task-allocation/AlertsPanel";
import TaskDetailModal from "./task-allocation/TaskDetailModal";

export default function TaskAllocationHelper() {
  const [viewMode, setViewMode] = useState("overview"); // overview, pool, board, charts
  const [showAutoAssign, setShowAutoAssign] = useState(false);
  const [showTaskDetail, setShowTaskDetail] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAlerts, setShowAlerts] = useState(false);

  // Mock data - replace with actual API calls
  const [teamMembers, setTeamMembers] = useState([
    {
      id: "dev01",
      name: "Ayesha Khan",
      role: "Frontend Developer",
      skills: ["React", "Tailwind", "TypeScript"],
      capacityHours: 40,
      assignedHours: 28,
      avatar: "AK",
      status: "active"
    },
    {
      id: "dev02",
      name: "Ahmed Ali",
      role: "Backend Developer",
      skills: ["Node.js", "MongoDB", "Express"],
      capacityHours: 40,
      assignedHours: 35,
      avatar: "AA",
      status: "high"
    },
    {
      id: "dev03",
      name: "Fatima Hassan",
      role: "Full Stack Developer",
      skills: ["React", "Node.js", "MongoDB", "AWS"],
      capacityHours: 40,
      assignedHours: 15,
      avatar: "FH",
      status: "free"
    },
    {
      id: "dev04",
      name: "Omar Malik",
      role: "DevOps Engineer",
      skills: ["Docker", "Kubernetes", "AWS", "CI/CD"],
      capacityHours: 40,
      assignedHours: 42,
      avatar: "OM",
      status: "overloaded"
    }
  ]);

  const [tasks, setTasks] = useState([
    {
      id: "task101",
      storyId: "story1",
      title: "Implement Login UI",
      requiredSkills: ["React", "Tailwind"],
      effortHours: 8,
      priority: "High",
      status: "Unassigned",
      assignedTo: null
    },
    {
      id: "task102",
      storyId: "story1",
      title: "Create Authentication API",
      requiredSkills: ["Node.js", "MongoDB"],
      effortHours: 12,
      priority: "High",
      status: "Unassigned",
      assignedTo: null
    },
    {
      id: "task103",
      storyId: "story2",
      title: "Dashboard Analytics Component",
      requiredSkills: ["React", "Charts"],
      effortHours: 10,
      priority: "Medium",
      status: "Unassigned",
      assignedTo: null
    },
    {
      id: "task104",
      storyId: "story2",
      title: "Setup CI/CD Pipeline",
      requiredSkills: ["Docker", "CI/CD"],
      effortHours: 6,
      priority: "Low",
      status: "Unassigned",
      assignedTo: null
    }
  ]);

  const [alerts, setAlerts] = useState([
    {
      id: "alert1",
      type: "overload",
      severity: "high",
      message: "Omar Malik is over capacity (42h / 40h)",
      developer: "dev04",
      action: "reassign"
    },
    {
      id: "alert2",
      type: "unassigned",
      severity: "medium",
      message: "4 high-priority tasks remain unassigned",
      taskCount: 4,
      action: "assign"
    },
    {
      id: "alert3",
      type: "skill_mismatch",
      severity: "low",
      message: "Task 'Setup CI/CD Pipeline' has no matching developer skills",
      task: "task104",
      action: "review"
    }
  ]);

  const handleAutoAssign = () => {
    setShowAutoAssign(true);
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskDetail(true);
  };

  const handleTaskAssign = (taskId, developerId) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, assignedTo: developerId, status: "Assigned" } : task
    ));
    
    // Update developer's assigned hours
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setTeamMembers(teamMembers.map(dev => 
        dev.id === developerId 
          ? { ...dev, assignedHours: dev.assignedHours + task.effortHours }
          : dev
      ));
    }
  };

  const handleExport = () => {
    // Export functionality - generate PDF/CSV
    alert("Export functionality - Generate PDF/CSV report");
  };

  const unassignedTasks = tasks.filter(t => !t.assignedTo);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleAutoAssign}
            className="flex items-center gap-2 bg-gradient-to-r from-secondary to-accent text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all"
          >
            <span>🧠</span>
            Auto-Assign Tasks
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-white border border-border text-textPrimary px-4 py-2 rounded-lg hover:bg-surface transition-all"
          >
            <span>📊</span>
            Export Report
          </button>
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="relative flex items-center gap-2 bg-white border border-border text-textPrimary px-4 py-2 rounded-lg hover:bg-surface transition-all"
          >
            <span>🔔</span>
            Alerts
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-error text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {alerts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-textMuted text-sm">Total Tasks</p>
              <p className="text-3xl font-bold text-textPrimary mt-1">{tasks.length}</p>
            </div>
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-textMuted text-sm">Unassigned</p>
              <p className="text-3xl font-bold text-textPrimary mt-1">{unassignedTasks.length}</p>
            </div>
            <div className="w-12 h-12 bg-warning/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-success/10 to-success/5 border border-success/20 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-textMuted text-sm">Team Members</p>
              <p className="text-3xl font-bold text-textPrimary mt-1">{teamMembers.length}</p>
            </div>
            <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-error/10 to-error/5 border border-error/20 rounded-xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-textMuted text-sm">Overloaded</p>
              <p className="text-3xl font-bold text-textPrimary mt-1">
                {teamMembers.filter(m => m.status === "overloaded").length}
              </p>
            </div>
            <div className="w-12 h-12 bg-error/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2 bg-white border border-border rounded-lg p-1">
        {[
          { id: "overview", label: "Team Overview", icon: "👥" },
          { id: "pool", label: "Task Pool", icon: "📋" },
          { id: "board", label: "Assignment Board", icon: "📌" },
          { id: "charts", label: "Analytics", icon: "📊" }
        ].map(mode => (
          <button
            key={mode.id}
            onClick={() => setViewMode(mode.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all ${
              viewMode === mode.id
                ? "bg-gradient-to-r from-primaryDark to-primary text-white shadow-md"
                : "text-textSecondary hover:bg-surface"
            }`}
          >
            <span>{mode.icon}</span>
            <span className="hidden md:inline">{mode.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <motion.div
        key={viewMode}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {viewMode === "overview" && (
          <TeamCapacityOverview 
            teamMembers={teamMembers} 
            onMemberClick={(member) => console.log("Member clicked:", member)}
          />
        )}
        {viewMode === "pool" && (
          <TaskPool 
            tasks={unassignedTasks}
            teamMembers={teamMembers}
            onTaskClick={handleTaskClick}
            onAssign={handleTaskAssign}
          />
        )}
        {viewMode === "board" && (
          <TaskAssignmentBoard 
            tasks={tasks}
            teamMembers={teamMembers}
            onTaskAssign={handleTaskAssign}
          />
        )}
        {viewMode === "charts" && (
          <WorkloadCharts 
            teamMembers={teamMembers}
            tasks={tasks}
          />
        )}
      </motion.div>

      {/* Modals */}
      {showAutoAssign && (
        <AutoAssignModal 
          tasks={unassignedTasks}
          teamMembers={teamMembers}
          onClose={() => setShowAutoAssign(false)}
          onAssign={handleTaskAssign}
        />
      )}

      {showTaskDetail && selectedTask && (
        <TaskDetailModal 
          task={selectedTask}
          teamMembers={teamMembers}
          onClose={() => setShowTaskDetail(false)}
          onAssign={handleTaskAssign}
        />
      )}

      {showAlerts && (
        <AlertsPanel 
          alerts={alerts}
          onClose={() => setShowAlerts(false)}
          onResolve={(alertId) => setAlerts(alerts.filter(a => a.id !== alertId))}
        />
      )}
    </div>
  );
}





