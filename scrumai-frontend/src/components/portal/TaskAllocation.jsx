import React, { useState } from "react";
import { motion } from "framer-motion";

export default function TaskAllocation() {
  const [viewMode, setViewMode] = useState("allocation"); // 'allocation', 'capacity', 'skills'
  const [draggedTask, setDraggedTask] = useState(null);

  const teamMembers = [
    {
      id: 1,
      name: "Sarah Chen",
      role: "Frontend Developer",
      skills: ["React", "TypeScript", "CSS", "UI/UX"],
      capacity: 10,
      currentLoad: 5,
      tasks: [
        { id: 1, title: "User Authentication UI", estimate: 3, status: "In Progress" },
        { id: 2, title: "Dashboard Components", estimate: 2, status: "Ready" }
      ],
      availability: "Available",
      timezone: "PST"
    },
    {
      id: 2,
      name: "Mike Johnson",
      role: "Backend Developer",
      skills: ["Node.js", "Python", "Database", "API"],
      capacity: 10,
      currentLoad: 8,
      tasks: [
        { id: 3, title: "API Development", estimate: 5, status: "In Progress" },
        { id: 4, title: "Database Schema", estimate: 3, status: "Completed" }
      ],
      availability: "Busy",
      timezone: "EST"
    },
    {
      id: 3,
      name: "Emma Davis",
      role: "Full Stack Developer",
      skills: ["React", "Node.js", "Database", "DevOps"],
      capacity: 10,
      currentLoad: 6,
      tasks: [
        { id: 5, title: "Payment Integration", estimate: 4, status: "In Progress" },
        { id: 6, title: "Testing Suite", estimate: 2, status: "Ready" }
      ],
      availability: "Available",
      timezone: "GMT"
    },
    {
      id: 4,
      name: "Alex Rodriguez",
      role: "DevOps Engineer",
      skills: ["AWS", "Docker", "CI/CD", "Monitoring"],
      capacity: 10,
      currentLoad: 2,
      tasks: [
        { id: 7, title: "Deployment Pipeline", estimate: 2, status: "Ready" }
      ],
      availability: "Available",
      timezone: "PST"
    }
  ];

  const unassignedTasks = [
    {
      id: 8,
      title: "Search Functionality",
      description: "Implement advanced search with filters",
      estimate: 5,
      priority: "High",
      requiredSkills: ["React", "Database"],
      dependencies: ["API Development"]
    },
    {
      id: 9,
      title: "Performance Optimization",
      description: "Optimize application performance",
      estimate: 3,
      priority: "Medium",
      requiredSkills: ["React", "Node.js"],
      dependencies: []
    },
    {
      id: 10,
      title: "Security Audit",
      description: "Conduct security review and fixes",
      estimate: 4,
      priority: "High",
      requiredSkills: ["Security", "Node.js"],
      dependencies: ["User Authentication"]
    }
  ];

  const getAvailabilityColor = (availability) => {
    switch (availability) {
      case "Available": return "bg-green-500/20 text-green-400";
      case "Busy": return "bg-yellow-500/20 text-yellow-400";
      case "Unavailable": return "bg-red-500/20 text-red-400";
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

  const getLoadColor = (load, capacity) => {
    const percentage = (load / capacity) * 100;
    if (percentage > 80) return "bg-red-500";
    if (percentage > 60) return "bg-yellow-500";
    return "bg-sandTan";
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-sandTan mb-2">Task Allocation</h1>
        <p className="text-textMuted">Optimize task distribution across your team with AI-powered suggestions.</p>
      </div>

      {/* View Mode Selector */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setViewMode("allocation")}
          className={`px-6 py-3 rounded-lg transition-all ${
            viewMode === "allocation"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          👥 Team Allocation
        </button>
        <button
          onClick={() => setViewMode("capacity")}
          className={`px-6 py-3 rounded-lg transition-all ${
            viewMode === "capacity"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          📊 Capacity View
        </button>
        <button
          onClick={() => setViewMode("skills")}
          className={`px-6 py-3 rounded-lg transition-all ${
            viewMode === "skills"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          🎯 Skills Match
        </button>
      </div>

      {/* AI Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8 bg-sandTan/10 border border-sandTan/30 rounded-2xl p-6"
      >
        <h2 className="text-lg font-bold text-sandTan mb-4">🤖 AI Allocation Suggestions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
            <h3 className="text-sandTan font-semibold mb-2">Load Balancing</h3>
            <p className="text-textMuted text-sm mb-3">Move 2 points from Mike to Alex for optimal distribution</p>
            <button className="bg-sandTan text-nightBlue px-3 py-1 rounded text-sm hover:bg-sandTanShadow transition-all">
              Apply
            </button>
          </div>
          <div className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
            <h3 className="text-sandTan font-semibold mb-2">Skill Matching</h3>
            <p className="text-textMuted text-sm mb-3">Assign "Search Functionality" to Emma (95% skill match)</p>
            <button className="bg-sandTan text-nightBlue px-3 py-1 rounded text-sm hover:bg-sandTanShadow transition-all">
              Apply
            </button>
          </div>
          <div className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
            <h3 className="text-sandTan font-semibold mb-2">Dependency Optimization</h3>
            <p className="text-textMuted text-sm mb-3">Prioritize "Security Audit" after authentication completion</p>
            <button className="bg-sandTan text-nightBlue px-3 py-1 rounded text-sm hover:bg-sandTanShadow transition-all">
              Apply
            </button>
          </div>
        </div>
      </motion.div>

      {/* Team Allocation View */}
      {viewMode === "allocation" && (
        <div className="space-y-8">
          {/* Team Members */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teamMembers.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-sandTan">{member.name}</h3>
                    <p className="text-textMuted text-sm">{member.role}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAvailabilityColor(member.availability)}`}>
                      {member.availability}
                    </span>
                    <p className="text-textMuted text-xs mt-1">{member.timezone}</p>
                  </div>
                </div>

                {/* Capacity Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-textMuted">Capacity</span>
                    <span className="text-sm text-sandTan font-semibold">{member.currentLoad}/{member.capacity} points</span>
                  </div>
                  <div className="w-full bg-nightBlueShadow rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${getLoadColor(member.currentLoad, member.capacity)}`}
                      style={{ width: `${(member.currentLoad / member.capacity) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Skills */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-sandTan mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {member.skills.map((skill, skillIndex) => (
                      <span key={skillIndex} className="bg-sandTan/20 text-sandTan px-2 py-1 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Assigned Tasks */}
                <div>
                  <h4 className="text-sm font-semibold text-sandTan mb-2">Assigned Tasks</h4>
                  <div className="space-y-2">
                    {member.tasks.map((task) => (
                      <div key={task.id} className="bg-nightBlue/60 border border-sandTan/30 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-textLight text-sm font-medium">{task.title}</span>
                          <span className="text-sandTan text-sm font-semibold">{task.estimate} pts</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <span className={`px-2 py-1 rounded text-xs ${
                            task.status === "Completed" ? "bg-green-500/20 text-green-400" :
                            task.status === "In Progress" ? "bg-blue-500/20 text-blue-400" :
                            "bg-gray-500/20 text-gray-400"
                          }`}>
                            {task.status}
                          </span>
                          <button className="text-textMuted hover:text-sandTan transition-colors text-xs">
                            Reassign
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Unassigned Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold text-sandTan mb-6">Unassigned Tasks</h2>
            <div className="space-y-4">
              {unassignedTasks.map((task, index) => (
                <div key={task.id} className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-textLight font-semibold mb-1">{task.title}</h3>
                      <p className="text-textMuted text-sm mb-2">{task.description}</p>
                      <div className="flex items-center gap-4 text-sm text-textMuted">
                        <span>Estimate: {task.estimate} points</span>
                        <span>Skills: {task.requiredSkills.join(", ")}</span>
                        {task.dependencies.length > 0 && (
                          <span>Dependencies: {task.dependencies.join(", ")}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <button className="bg-sandTan text-nightBlue px-4 py-2 rounded-lg hover:bg-sandTanShadow transition-all text-sm font-medium">
                        Assign
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Capacity View */}
      {viewMode === "capacity" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Capacity Overview */}
          <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-sandTan mb-6">Team Capacity Overview</h2>
            <div className="space-y-4">
              {teamMembers.map((member, index) => (
                <div key={member.id} className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-textLight font-semibold">{member.name}</h3>
                      <p className="text-textMuted text-sm">{member.role}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sandTan font-semibold">{member.currentLoad}/{member.capacity}</span>
                      <div className="text-textMuted text-sm">points</div>
                    </div>
                  </div>
                  <div className="w-full bg-nightBlueShadow rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${getLoadColor(member.currentLoad, member.capacity)}`}
                      style={{ width: `${(member.currentLoad / member.capacity) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2 text-sm">
                    <span className="text-textMuted">
                      {Math.round((member.currentLoad / member.capacity) * 100)}% utilized
                    </span>
                    <span className="text-textMuted">
                      {member.capacity - member.currentLoad} points available
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Capacity Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-sandTan mb-2">40</div>
              <div className="text-textMuted">Total Capacity</div>
            </div>
            <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-sandTan mb-2">21</div>
              <div className="text-textMuted">Current Load</div>
            </div>
            <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-sandTan mb-2">19</div>
              <div className="text-textMuted">Available</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Skills Match View */}
      {viewMode === "skills" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Skills Matrix */}
          <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-sandTan mb-6">Skills & Task Matching</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-sandTan/20">
                    <th className="text-left py-3 text-sandTan font-semibold">Task</th>
                    {teamMembers.map((member) => (
                      <th key={member.id} className="text-center py-3 text-sandTan font-semibold text-sm">
                        {member.name.split(' ')[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {unassignedTasks.map((task) => (
                    <tr key={task.id} className="border-b border-sandTan/10">
                      <td className="py-3 text-textLight font-medium">{task.title}</td>
                      {teamMembers.map((member) => {
                        const matchScore = task.requiredSkills.filter(skill => 
                          member.skills.includes(skill)
                        ).length / task.requiredSkills.length * 100;
                        
                        return (
                          <td key={member.id} className="py-3 text-center">
                            <div className={`inline-flex items-center justify-center w-12 h-8 rounded text-xs font-semibold ${
                              matchScore >= 80 ? "bg-green-500/20 text-green-400" :
                              matchScore >= 60 ? "bg-yellow-500/20 text-yellow-400" :
                              matchScore >= 40 ? "bg-orange-500/20 text-orange-400" :
                              "bg-red-500/20 text-red-400"
                            }`}>
                              {Math.round(matchScore)}%
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Skill Recommendations */}
          <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-sandTan mb-6">Skill Development Recommendations</h2>
            <div className="space-y-4">
              {teamMembers.map((member) => {
                const missingSkills = unassignedTasks
                  .flatMap(task => task.requiredSkills)
                  .filter(skill => !member.skills.includes(skill))
                  .filter((skill, index, arr) => arr.indexOf(skill) === index);
                
                return missingSkills.length > 0 ? (
                  <div key={member.id} className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
                    <h3 className="text-sandTan font-semibold mb-2">{member.name}</h3>
                    <p className="text-textMuted text-sm mb-2">Consider learning these skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {missingSkills.map((skill, index) => (
                        <span key={index} className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}



