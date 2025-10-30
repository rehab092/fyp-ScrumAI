import React, { useState } from "react";
import { motion } from "framer-motion";

export default function SprintManagement() {
  const [activeView, setActiveView] = useState("current"); // 'current', 'planning', 'history'

  const currentSprint = {
    id: "Sprint 24",
    name: "Q4 Feature Release",
    startDate: "2024-12-16",
    endDate: "2024-12-30",
    duration: 14,
    status: "Active",
    progress: 87,
    teamSize: 5,
    capacity: 40,
    used: 35,
    stories: [
      {
        id: 1,
        title: "User Authentication System",
        description: "Implement secure user login and registration",
        priority: "High",
        estimate: 8,
        assignee: "Sarah Chen",
        status: "In Progress",
        progress: 80,
        dependencies: []
      },
      {
        id: 2,
        title: "API Integration Layer",
        description: "Create RESTful API endpoints for core functionality",
        priority: "High",
        estimate: 13,
        assignee: "Mike Johnson",
        status: "In Progress",
        progress: 60,
        dependencies: [1]
      },
      {
        id: 3,
        title: "Database Schema Design",
        description: "Design and implement database structure",
        priority: "High",
        estimate: 5,
        assignee: "Emma Davis",
        status: "Completed",
        progress: 100,
        dependencies: []
      },
      {
        id: 4,
        title: "UI Component Library",
        description: "Build reusable UI components",
        priority: "Medium",
        estimate: 8,
        assignee: "Alex Rodriguez",
        status: "Ready",
        progress: 0,
        dependencies: [1, 2]
      }
    ]
  };

  const upcomingSprint = {
    id: "Sprint 25",
    name: "Performance Optimization",
    startDate: "2024-12-31",
    endDate: "2025-01-14",
    duration: 14,
    status: "Planning",
    capacity: 40,
    plannedStories: [
      {
        id: 5,
        title: "Performance Monitoring",
        description: "Implement application performance tracking",
        priority: "High",
        estimate: 5,
        assignee: null,
        status: "Ready"
      },
      {
        id: 6,
        title: "Caching Implementation",
        description: "Add Redis caching for improved performance",
        priority: "Medium",
        estimate: 8,
        assignee: null,
        status: "Ready"
      },
      {
        id: 7,
        title: "Database Optimization",
        description: "Optimize database queries and indexes",
        priority: "High",
        estimate: 13,
        assignee: null,
        status: "Ready"
      }
    ]
  };

  const sprintHistory = [
    {
      id: "Sprint 23",
      name: "Bug Fixes & Improvements",
      startDate: "2024-12-02",
      endDate: "2024-12-15",
      status: "Completed",
      velocity: 38,
      planned: 40,
      completed: 38,
      teamSize: 5
    },
    {
      id: "Sprint 22",
      name: "Core Features Development",
      startDate: "2024-11-18",
      endDate: "2024-12-01",
      status: "Completed",
      velocity: 42,
      planned: 45,
      completed: 42,
      teamSize: 5
    },
    {
      id: "Sprint 21",
      name: "Foundation Setup",
      startDate: "2024-11-04",
      endDate: "2024-11-17",
      status: "Completed",
      velocity: 35,
      planned: 40,
      completed: 35,
      teamSize: 4
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "Active": return "bg-green-500/20 text-green-400";
      case "Planning": return "bg-blue-500/20 text-blue-400";
      case "Completed": return "bg-gray-500/20 text-gray-400";
      case "In Progress": return "bg-blue-500/20 text-blue-400";
      case "Ready": return "bg-gray-500/20 text-gray-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High": return "bg-red-500/20 text-red-400";
      case "Medium": return "bg-yellow-500/20 text-yellow-400";
      case "Low": return "bg-green-500/20 text-green-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* View Selector */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveView("current")}
          className={`px-6 py-3 rounded-lg transition-all ${
            activeView === "current"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          🏃 Current Sprint
        </button>
        <button
          onClick={() => setActiveView("planning")}
          className={`px-6 py-3 rounded-lg transition-all ${
            activeView === "planning"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          📋 Sprint Planning
        </button>
        <button
          onClick={() => setActiveView("history")}
          className={`px-6 py-3 rounded-lg transition-all ${
            activeView === "history"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          📊 Sprint History
        </button>
      </div>

      {/* Current Sprint View */}
      {activeView === "current" && (
        <div className="space-y-8">
          {/* Sprint Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-sandTan mb-2">{currentSprint.id}</h2>
                <p className="text-textMuted text-lg">{currentSprint.name}</p>
                <p className="text-textMuted text-sm">
                  {currentSprint.startDate} - {currentSprint.endDate} ({currentSprint.duration} days)
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-sandTan">{currentSprint.progress}%</div>
                  <div className="text-textMuted text-sm">Complete</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-sandTan">{currentSprint.used}/{currentSprint.capacity}</div>
                  <div className="text-textMuted text-sm">Points</div>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(currentSprint.status)}`}>
                  {currentSprint.status}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-nightBlueShadow rounded-full h-4 mb-6">
              <div
                className="bg-sandTan h-4 rounded-full transition-all duration-500"
                style={{ width: `${currentSprint.progress}%` }}
              />
            </div>

            {/* Sprint Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4 text-center">
                <div className="text-lg font-bold text-textLight">{currentSprint.teamSize}</div>
                <div className="text-textMuted text-sm">Team Members</div>
              </div>
              <div className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4 text-center">
                <div className="text-lg font-bold text-textLight">{currentSprint.stories.length}</div>
                <div className="text-textMuted text-sm">User Stories</div>
              </div>
              <div className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4 text-center">
                <div className="text-lg font-bold text-textLight">
                  {currentSprint.stories.filter(s => s.status === "Completed").length}
                </div>
                <div className="text-textMuted text-sm">Completed</div>
              </div>
              <div className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4 text-center">
                <div className="text-lg font-bold text-textLight">
                  {currentSprint.stories.filter(s => s.status === "In Progress").length}
                </div>
                <div className="text-textMuted text-sm">In Progress</div>
              </div>
            </div>
          </motion.div>

          {/* Sprint Stories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold text-sandTan mb-6">Sprint Stories</h2>
            
            <div className="space-y-4">
              {currentSprint.stories.map((story, index) => (
                <div key={story.id} className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-textLight font-semibold mb-1">{story.title}</h3>
                      <p className="text-textMuted text-sm mb-2">{story.description}</p>
                      <div className="flex items-center gap-4 text-sm text-textMuted">
                        <span>Assigned to: {story.assignee}</span>
                        <span>Estimate: {story.estimate} points</span>
                        {story.dependencies.length > 0 && (
                          <span>Dependencies: {story.dependencies.length}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-nightBlueShadow rounded-full h-2">
                          <div
                            className="bg-sandTan h-2 rounded-full transition-all duration-500"
                            style={{ width: `${story.progress}%` }}
                          />
                        </div>
                        <span className="text-sandTan text-sm font-semibold">{story.progress}%</span>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(story.priority)}`}>
                          {story.priority}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(story.status)}`}>
                          {story.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Sprint Planning View */}
      {activeView === "planning" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Next Sprint Overview */}
          <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-sandTan mb-2">{upcomingSprint.id}</h2>
                <p className="text-textMuted text-lg">{upcomingSprint.name}</p>
                <p className="text-textMuted text-sm">
                  {upcomingSprint.startDate} - {upcomingSprint.endDate} ({upcomingSprint.duration} days)
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-sandTan">{upcomingSprint.capacity}</div>
                  <div className="text-textMuted text-sm">Capacity</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-sandTan">
                    {upcomingSprint.plannedStories.reduce((sum, story) => sum + story.estimate, 0)}
                  </div>
                  <div className="text-textMuted text-sm">Planned Points</div>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(upcomingSprint.status)}`}>
                  {upcomingSprint.status}
                </span>
              </div>
            </div>
          </div>

          {/* Planned Stories */}
          <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-sandTan mb-6">Planned Stories</h2>
            
            <div className="space-y-4">
              {upcomingSprint.plannedStories.map((story, index) => (
                <div key={story.id} className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-textLight font-semibold mb-1">{story.title}</h3>
                      <p className="text-textMuted text-sm mb-2">{story.description}</p>
                      <div className="flex items-center gap-4 text-sm text-textMuted">
                        <span>Estimate: {story.estimate} points</span>
                        <span>Assignee: {story.assignee || "Unassigned"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(story.priority)}`}>
                        {story.priority}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(story.status)}`}>
                        {story.status}
                      </span>
                      <button className="bg-sandTan text-nightBlue px-3 py-1 rounded text-sm hover:bg-sandTanShadow transition-all">
                        Assign
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Planning Tools */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-sandTan mb-4">Sprint Goals</h3>
              <textarea
                placeholder="Define your sprint goals and objectives..."
                className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-3 text-textLight focus:outline-none focus:border-sandTan h-32 resize-none"
              />
            </div>
            <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-sandTan mb-4">Sprint Notes</h3>
              <textarea
                placeholder="Add any important notes or considerations..."
                className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-3 text-textLight focus:outline-none focus:border-sandTan h-32 resize-none"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Sprint History View */}
      {activeView === "history" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-sandTan mb-6">Sprint History</h2>
            
            <div className="space-y-4">
              {sprintHistory.map((sprint, index) => (
                <div key={sprint.id} className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-sandTan mb-1">{sprint.id}</h3>
                      <p className="text-textMuted text-sm mb-2">{sprint.name}</p>
                      <p className="text-textMuted text-xs">
                        {sprint.startDate} - {sprint.endDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-lg font-bold text-textLight">{sprint.velocity}</div>
                        <div className="text-textMuted text-sm">Velocity</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-textLight">{sprint.completed}/{sprint.planned}</div>
                        <div className="text-textMuted text-sm">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-textLight">
                          {Math.round((sprint.completed / sprint.planned) * 100)}%
                        </div>
                        <div className="text-textMuted text-sm">Success Rate</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(sprint.status)}`}>
                        {sprint.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Velocity Trend */}
          <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-sandTan mb-6">Velocity Trend</h2>
            
            <div className="space-y-4">
              {sprintHistory.map((sprint, index) => (
                <div key={sprint.id} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-textMuted">{sprint.id}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4 bg-sandTan rounded"></div>
                      <span className="text-sm text-textLight">Velocity: {sprint.velocity}</span>
                    </div>
                    <div className="w-full bg-nightBlueShadow rounded-full h-2">
                      <div
                        className="bg-sandTan h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(sprint.velocity / 50) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}






