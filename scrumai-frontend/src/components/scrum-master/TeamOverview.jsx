import React, { useState } from "react";
import { motion } from "framer-motion";

export default function TeamOverview() {
  const [viewMode, setViewMode] = useState("overview"); // 'overview', 'performance', 'capacity'

  const teamMembers = [
    {
      id: 1,
      name: "Sarah Chen",
      role: "Frontend Developer",
      email: "sarah@example.com",
      avatar: "SC",
      skills: ["React", "TypeScript", "CSS", "UI/UX"],
      capacity: 10,
      currentLoad: 8,
      velocity: 8.5,
      efficiency: 85,
      availability: "Available",
      timezone: "PST",
      joinDate: "2024-01-15",
      tasksCompleted: 45,
      averageTaskTime: "2.3 days",
      lastActive: "2 hours ago"
    },
    {
      id: 2,
      name: "Mike Johnson",
      role: "Backend Developer",
      email: "mike@example.com",
      avatar: "MJ",
      skills: ["Node.js", "Python", "Database", "API"],
      capacity: 10,
      currentLoad: 9,
      velocity: 9.2,
      efficiency: 92,
      availability: "Busy",
      timezone: "EST",
      joinDate: "2023-11-20",
      tasksCompleted: 52,
      averageTaskTime: "1.8 days",
      lastActive: "1 hour ago"
    },
    {
      id: 3,
      name: "Emma Davis",
      role: "Full Stack Developer",
      email: "emma@example.com",
      avatar: "ED",
      skills: ["React", "Node.js", "Database", "DevOps"],
      capacity: 10,
      currentLoad: 7,
      velocity: 7.8,
      efficiency: 78,
      availability: "Available",
      timezone: "GMT",
      joinDate: "2024-03-10",
      tasksCompleted: 38,
      averageTaskTime: "2.7 days",
      lastActive: "30 minutes ago"
    },
    {
      id: 4,
      name: "Alex Rodriguez",
      role: "DevOps Engineer",
      email: "alex@example.com",
      avatar: "AR",
      skills: ["AWS", "Docker", "CI/CD", "Monitoring"],
      capacity: 10,
      currentLoad: 5,
      velocity: 6.5,
      efficiency: 65,
      availability: "Available",
      timezone: "PST",
      joinDate: "2024-06-01",
      tasksCompleted: 28,
      averageTaskTime: "3.2 days",
      lastActive: "4 hours ago"
    }
  ];

  const teamMetrics = {
    totalMembers: 4,
    averageVelocity: 8.0,
    totalCapacity: 40,
    utilizedCapacity: 29,
    averageEfficiency: 80,
    totalTasksCompleted: 163,
    averageTaskTime: "2.5 days"
  };

  const getAvailabilityColor = (availability) => {
    switch (availability) {
      case "Available": return "bg-green-500/20 text-green-400";
      case "Busy": return "bg-yellow-500/20 text-yellow-400";
      case "Unavailable": return "bg-red-500/20 text-red-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 80) return "text-green-400";
    if (efficiency >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-sandTan mb-2">Team Overview</h1>
        <p className="text-textMuted">Monitor team composition, performance, and capacity distribution.</p>
      </div>

      {/* View Mode Selector */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setViewMode("overview")}
          className={`px-6 py-3 rounded-lg transition-all ${
            viewMode === "overview"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          👥 Team Overview
        </button>
        <button
          onClick={() => setViewMode("performance")}
          className={`px-6 py-3 rounded-lg transition-all ${
            viewMode === "performance"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          📊 Performance
        </button>
        <button
          onClick={() => setViewMode("capacity")}
          className={`px-6 py-3 rounded-lg transition-all ${
            viewMode === "capacity"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          📈 Capacity
        </button>
      </div>

      {/* Team Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8"
      >
        <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-sandTan mb-1">{teamMetrics.totalMembers}</div>
          <div className="text-textMuted text-sm">Team Members</div>
        </div>
        <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-sandTan mb-1">{teamMetrics.averageVelocity}</div>
          <div className="text-textMuted text-sm">Avg Velocity</div>
        </div>
        <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-sandTan mb-1">{teamMetrics.totalCapacity}</div>
          <div className="text-textMuted text-sm">Total Capacity</div>
        </div>
        <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-sandTan mb-1">{teamMetrics.utilizedCapacity}</div>
          <div className="text-textMuted text-sm">Utilized</div>
        </div>
        <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-sandTan mb-1">{teamMetrics.averageEfficiency}%</div>
          <div className="text-textMuted text-sm">Avg Efficiency</div>
        </div>
        <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-sandTan mb-1">{teamMetrics.totalTasksCompleted}</div>
          <div className="text-textMuted text-sm">Tasks Completed</div>
        </div>
        <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-sandTan mb-1">{teamMetrics.averageTaskTime}</div>
          <div className="text-textMuted text-sm">Avg Task Time</div>
        </div>
      </motion.div>

      {/* Team Overview */}
      {viewMode === "overview" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {teamMembers.map((member, index) => (
            <div key={member.id} className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 bg-sandTan text-nightBlue rounded-full flex items-center justify-center font-bold text-lg">
                  {member.avatar}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-sandTan">{member.name}</h3>
                  <p className="text-textMuted text-sm">{member.role}</p>
                  <p className="text-textMuted text-xs">{member.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAvailabilityColor(member.availability)}`}>
                      {member.availability}
                    </span>
                    <span className="text-textMuted text-xs">{member.timezone}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Skills */}
                <div>
                  <h4 className="text-sm font-semibold text-sandTan mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {member.skills.map((skill, skillIndex) => (
                      <span key={skillIndex} className="bg-sandTan/20 text-sandTan px-2 py-1 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-textMuted text-sm">Velocity</span>
                      <span className="text-sandTan text-sm font-semibold">{member.velocity}/10</span>
                    </div>
                    <div className="w-full bg-nightBlueShadow rounded-full h-2">
                      <div
                        className="bg-sandTan h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(member.velocity / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-textMuted text-sm">Efficiency</span>
                      <span className={`text-sm font-semibold ${getEfficiencyColor(member.efficiency)}`}>
                        {member.efficiency}%
                      </span>
                    </div>
                    <div className="w-full bg-nightBlueShadow rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          member.efficiency >= 80 ? "bg-green-500" :
                          member.efficiency >= 60 ? "bg-yellow-500" : "bg-red-500"
                        }`}
                        style={{ width: `${member.efficiency}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-textMuted">Joined:</span>
                    <span className="text-textLight ml-1">{member.joinDate}</span>
                  </div>
                  <div>
                    <span className="text-textMuted">Tasks:</span>
                    <span className="text-textLight ml-1">{member.tasksCompleted}</span>
                  </div>
                  <div>
                    <span className="text-textMuted">Avg Time:</span>
                    <span className="text-textLight ml-1">{member.averageTaskTime}</span>
                  </div>
                  <div>
                    <span className="text-textMuted">Last Active:</span>
                    <span className="text-textLight ml-1">{member.lastActive}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Performance View */}
      {viewMode === "performance" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-8"
        >
          <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-sandTan mb-6">Performance Metrics</h2>
            
            <div className="space-y-6">
              {teamMembers.map((member, index) => (
                <div key={member.id} className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-sandTan text-nightBlue rounded-full flex items-center justify-center font-bold">
                        {member.avatar}
                      </div>
                      <div>
                        <h3 className="text-textLight font-semibold">{member.name}</h3>
                        <p className="text-textMuted text-sm">{member.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getEfficiencyColor(member.efficiency)}`}>
                        {member.efficiency}%
                      </div>
                      <div className="text-textMuted text-sm">Efficiency</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold text-sandTan mb-2">Velocity Trend</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-textMuted text-sm">Current</span>
                          <span className="text-sandTan font-semibold">{member.velocity}/10</span>
                        </div>
                        <div className="w-full bg-nightBlueShadow rounded-full h-2">
                          <div
                            className="bg-sandTan h-2 rounded-full transition-all duration-500"
                            style={{ width: `${(member.velocity / 10) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold text-sandTan mb-2">Task Completion</h4>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-textLight">{member.tasksCompleted}</div>
                        <div className="text-textMuted text-sm">Total Tasks</div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold text-sandTan mb-2">Average Time</h4>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-textLight">{member.averageTaskTime}</div>
                        <div className="text-textMuted text-sm">Per Task</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Capacity View */}
      {viewMode === "capacity" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-8"
        >
          <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-sandTan mb-6">Team Capacity Analysis</h2>
            
            <div className="space-y-4">
              {teamMembers.map((member, index) => (
                <div key={member.id} className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-sandTan text-nightBlue rounded-full flex items-center justify-center font-bold">
                        {member.avatar}
                      </div>
                      <div>
                        <h3 className="text-textLight font-semibold">{member.name}</h3>
                        <p className="text-textMuted text-sm">{member.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sandTan font-semibold">{member.currentLoad}/{member.capacity}</span>
                      <div className="text-textMuted text-sm">points</div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-nightBlueShadow rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        member.currentLoad / member.capacity > 0.8 ? "bg-red-500" :
                        member.currentLoad / member.capacity > 0.6 ? "bg-yellow-500" : "bg-sandTan"
                      }`}
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

          {/* Capacity Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-sandTan mb-2">40</div>
              <div className="text-textMuted">Total Capacity</div>
            </div>
            <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-sandTan mb-2">29</div>
              <div className="text-textMuted">Utilized</div>
            </div>
            <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-sandTan mb-2">11</div>
              <div className="text-textMuted">Available</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}




