import React, { useState } from "react";
import { motion } from "framer-motion";

export default function SprintPlanner() {
  const [activeSprint, setActiveSprint] = useState("current");
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  const availableStories = [
    {
      id: 1,
      title: "User Authentication",
      description: "As a user, I want to log in securely, so that my account is protected",
      priority: "High",
      estimate: "5 points",
      dependencies: ["Database Setup"],
      assignee: null
    },
    {
      id: 2,
      title: "Product Catalog",
      description: "As a user, I want to browse products, so that I can find what I need",
      priority: "Medium",
      estimate: "8 points",
      dependencies: ["User Authentication"],
      assignee: null
    },
    {
      id: 3,
      title: "Shopping Cart",
      description: "As a user, I want to add items to cart, so that I can purchase multiple items",
      priority: "High",
      estimate: "5 points",
      dependencies: ["Product Catalog"],
      assignee: null
    },
    {
      id: 4,
      title: "Payment Processing",
      description: "As a user, I want to pay securely, so that I can complete my purchase",
      priority: "High",
      estimate: "8 points",
      dependencies: ["Shopping Cart"],
      assignee: null
    },
    {
      id: 5,
      title: "Order History",
      description: "As a user, I want to view my orders, so that I can track my purchases",
      priority: "Low",
      estimate: "3 points",
      dependencies: ["Payment Processing"],
      assignee: null
    }
  ];

  const currentSprint = {
    id: "Sprint 24",
    startDate: "2024-12-16",
    endDate: "2024-12-30",
    capacity: 40,
    used: 18,
    stories: [
      {
        id: 1,
        title: "User Authentication",
        estimate: "5 points",
        assignee: "Sarah Chen",
        status: "In Progress",
        progress: 80
      },
      {
        id: 2,
        title: "Database Setup",
        estimate: "3 points",
        assignee: "Mike Johnson",
        status: "Completed",
        progress: 100
      },
      {
        id: 3,
        title: "API Foundation",
        estimate: "8 points",
        assignee: "Emma Davis",
        status: "In Progress",
        progress: 60
      },
      {
        id: 4,
        title: "UI Framework",
        estimate: "2 points",
        assignee: "Alex Rodriguez",
        status: "Ready",
        progress: 0
      }
    ]
  };

  const teamMembers = [
    { id: 1, name: "Sarah Chen", role: "Frontend Dev", capacity: 10, currentLoad: 5 },
    { id: 2, name: "Mike Johnson", role: "Backend Dev", capacity: 10, currentLoad: 3 },
    { id: 3, name: "Emma Davis", role: "Full Stack", capacity: 10, currentLoad: 8 },
    { id: 4, name: "Alex Rodriguez", role: "DevOps", capacity: 10, currentLoad: 2 }
  ];

  const aiSuggestions = [
    {
      type: "optimization",
      title: "Sprint Capacity Optimization",
      description: "Move 'Order History' to next sprint to balance current workload",
      impact: "Reduces risk of overcommitment by 15%",
      confidence: 92
    },
    {
      type: "dependency",
      title: "Dependency Alert",
      description: "Payment Processing depends on Shopping Cart completion",
      impact: "Consider parallel development to reduce blocking",
      confidence: 88
    },
    {
      type: "allocation",
      title: "Resource Rebalancing",
      description: "Reassign 2 points from Emma to Alex for better load distribution",
      impact: "Improves team velocity by 12%",
      confidence: 85
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed": return "bg-green-500/20 text-green-400";
      case "In Progress": return "bg-blue-500/20 text-blue-400";
      case "Ready": return "bg-gray-500/20 text-gray-400";
      case "Blocked": return "bg-red-500/20 text-red-400";
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
      {/* Sprint Tabs */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveSprint("current")}
          className={`px-6 py-3 rounded-lg transition-all ${
            activeSprint === "current"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          Current Sprint
        </button>
        <button
          onClick={() => setActiveSprint("planning")}
          className={`px-6 py-3 rounded-lg transition-all ${
            activeSprint === "planning"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          Plan Next Sprint
        </button>
        <button
          onClick={() => setShowAISuggestions(!showAISuggestions)}
          className={`px-6 py-3 rounded-lg transition-all ${
            showAISuggestions
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          🤖 AI Suggestions
        </button>
      </div>

      {/* AI Suggestions Panel */}
      {showAISuggestions && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-8 bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6"
        >
          <h2 className="text-xl font-bold text-sandTan mb-6">AI-Powered Suggestions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {aiSuggestions.map((suggestion, index) => (
              <div key={index} className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">
                    {suggestion.type === "optimization" ? "⚡" : 
                     suggestion.type === "dependency" ? "🔗" : "👥"}
                  </span>
                  <h3 className="text-sandTan font-semibold">{suggestion.title}</h3>
                </div>
                <p className="text-textMuted text-sm mb-3">{suggestion.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-textLight text-sm">{suggestion.impact}</span>
                  <span className="text-sandTan text-sm font-semibold">{suggestion.confidence}% confidence</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {activeSprint === "current" && (
        <div className="space-y-8">
          {/* Current Sprint Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-sandTan mb-2">{currentSprint.id}</h2>
                <p className="text-textMuted">
                  {currentSprint.startDate} - {currentSprint.endDate}
                </p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-sandTan">{currentSprint.used}/{currentSprint.capacity}</div>
                  <div className="text-textMuted text-sm">Points Used</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-sandTan">
                    {Math.round((currentSprint.used / currentSprint.capacity) * 100)}%
                  </div>
                  <div className="text-textMuted text-sm">Capacity</div>
                </div>
              </div>
            </div>

            {/* Capacity Bar */}
            <div className="w-full bg-nightBlueShadow rounded-full h-3 mb-6">
              <div
                className="bg-sandTan h-3 rounded-full transition-all duration-500"
                style={{ width: `${(currentSprint.used / currentSprint.capacity) * 100}%` }}
              />
            </div>

            {/* Sprint Stories */}
            <div className="space-y-4">
              {currentSprint.stories.map((story, index) => (
                <div key={story.id} className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-textLight font-semibold mb-1">{story.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-textMuted">
                        <span>Assigned to: {story.assignee}</span>
                        <span>Estimate: {story.estimate}</span>
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
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(story.status)}`}>
                        {story.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Team Capacity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold text-sandTan mb-6">Team Capacity</h2>
            <div className="space-y-4">
              {teamMembers.map((member, index) => (
                <div key={member.id} className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="text-textLight font-semibold">{member.name}</h3>
                      <p className="text-textMuted text-sm">{member.role}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sandTan font-semibold">{member.currentLoad}/{member.capacity}</span>
                      <div className="text-textMuted text-sm">points</div>
                    </div>
                  </div>
                  <div className="w-full bg-nightBlueShadow rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        member.currentLoad / member.capacity > 0.8 ? "bg-red-500" :
                        member.currentLoad / member.capacity > 0.6 ? "bg-yellow-500" : "bg-sandTan"
                      }`}
                      style={{ width: `${(member.currentLoad / member.capacity) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {activeSprint === "planning" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Available Stories */}
          <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-sandTan mb-6">Available User Stories</h2>
            <div className="space-y-4">
              {availableStories.map((story, index) => (
                <div key={story.id} className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-textLight font-semibold mb-2">{story.title}</h3>
                      <p className="text-textMuted text-sm mb-3">{story.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-textMuted">Estimate: {story.estimate}</span>
                        <span className="text-textMuted">Dependencies: {story.dependencies.join(", ")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(story.priority)}`}>
                        {story.priority}
                      </span>
                      <button className="bg-sandTan text-nightBlue px-4 py-2 rounded-lg hover:bg-sandTanShadow transition-all text-sm font-medium">
                        Add to Sprint
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sprint Planning Tools */}
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
    </div>
  );
}






