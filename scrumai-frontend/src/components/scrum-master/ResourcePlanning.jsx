import React, { useState } from "react";
import { motion } from "framer-motion";

export default function ResourcePlanning() {
  const [viewMode, setViewMode] = useState("capacity"); // 'capacity', 'allocation', 'forecasting'

  const teamMembers = [
    {
      id: 1,
      name: "Sarah Chen",
      role: "Frontend Developer",
      skills: ["React", "TypeScript", "CSS", "UI/UX"],
      capacity: 10,
      currentLoad: 8,
      availability: "Available",
      hourlyRate: 75,
      timezone: "PST",
      projects: ["ScrumAI Frontend", "Component Library"],
      utilization: 80
    },
    {
      id: 2,
      name: "Mike Johnson",
      role: "Backend Developer",
      skills: ["Node.js", "Python", "Database", "API"],
      capacity: 10,
      currentLoad: 9,
      availability: "Busy",
      hourlyRate: 80,
      timezone: "EST",
      projects: ["ScrumAI Backend", "API Development"],
      utilization: 90
    },
    {
      id: 3,
      name: "Emma Davis",
      role: "Full Stack Developer",
      skills: ["React", "Node.js", "Database", "DevOps"],
      capacity: 10,
      currentLoad: 7,
      availability: "Available",
      hourlyRate: 85,
      timezone: "GMT",
      projects: ["ScrumAI Full Stack", "Integration"],
      utilization: 70
    },
    {
      id: 4,
      name: "Alex Rodriguez",
      role: "DevOps Engineer",
      skills: ["AWS", "Docker", "CI/CD", "Monitoring"],
      capacity: 10,
      currentLoad: 5,
      availability: "Available",
      hourlyRate: 90,
      timezone: "PST",
      projects: ["Infrastructure", "Deployment"],
      utilization: 50
    }
  ];

  const upcomingProjects = [
    {
      id: 1,
      name: "Mobile App Development",
      startDate: "2025-01-15",
      endDate: "2025-03-15",
      requiredSkills: ["React Native", "Mobile UI/UX"],
      estimatedHours: 320,
      priority: "High",
      budget: 25000
    },
    {
      id: 2,
      name: "Performance Optimization",
      startDate: "2025-01-01",
      endDate: "2025-02-15",
      requiredSkills: ["Performance", "Database", "Caching"],
      estimatedHours: 200,
      priority: "Medium",
      budget: 15000
    },
    {
      id: 3,
      name: "Security Audit",
      startDate: "2025-02-01",
      endDate: "2025-02-28",
      requiredSkills: ["Security", "Penetration Testing"],
      estimatedHours: 120,
      priority: "High",
      budget: 10000
    }
  ];

  const capacityForecast = [
    { week: "Week 1", total: 40, utilized: 35, available: 5 },
    { week: "Week 2", total: 40, utilized: 38, available: 2 },
    { week: "Week 3", total: 40, utilized: 40, available: 0 },
    { week: "Week 4", total: 40, utilized: 35, available: 5 },
    { week: "Week 5", total: 40, utilized: 30, available: 10 },
    { week: "Week 6", total: 40, utilized: 25, available: 15 }
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

  const getUtilizationColor = (utilization) => {
    if (utilization >= 90) return "bg-red-500";
    if (utilization >= 80) return "bg-yellow-500";
    return "bg-sandTan";
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-sandTan mb-2">Resource Planning</h1>
        <p className="text-textMuted">Optimize team capacity, plan resource allocation, and forecast future needs.</p>
      </div>

      {/* View Mode Selector */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setViewMode("capacity")}
          className={`px-6 py-3 rounded-lg transition-all ${
            viewMode === "capacity"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          📊 Capacity Planning
        </button>
        <button
          onClick={() => setViewMode("allocation")}
          className={`px-6 py-3 rounded-lg transition-all ${
            viewMode === "allocation"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          👥 Resource Allocation
        </button>
        <button
          onClick={() => setViewMode("forecasting")}
          className={`px-6 py-3 rounded-lg transition-all ${
            viewMode === "forecasting"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          🔮 Capacity Forecasting
        </button>
      </div>

      {/* Capacity Planning View */}
      {viewMode === "capacity" && (
        <div className="space-y-8">
          {/* Team Capacity Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold text-sandTan mb-6">Team Capacity Overview</h2>
            
            <div className="space-y-4">
              {teamMembers.map((member, index) => (
                <div key={member.id} className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-sandTan text-nightBlue rounded-full flex items-center justify-center font-bold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="text-textLight font-semibold">{member.name}</h3>
                        <p className="text-textMuted text-sm">{member.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-sandTan font-semibold">{member.currentLoad}/{member.capacity}</span>
                        <div className="text-textMuted text-sm">points</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAvailabilityColor(member.availability)}`}>
                        {member.availability}
                      </span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-nightBlueShadow rounded-full h-3 mb-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${getUtilizationColor(member.utilization)}`}
                      style={{ width: `${member.utilization}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-textMuted">
                      {member.utilization}% utilized
                    </span>
                    <span className="text-textMuted">
                      {member.capacity - member.currentLoad} points available
                    </span>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="text-textMuted">Rate: ${member.hourlyRate}/hr</span>
                      <span className="text-textMuted">TZ: {member.timezone}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {member.skills.slice(0, 3).map((skill, skillIndex) => (
                        <span key={skillIndex} className="bg-sandTan/20 text-sandTan px-2 py-1 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                      {member.skills.length > 3 && (
                        <span className="text-textMuted text-xs">+{member.skills.length - 3} more</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Capacity Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-sandTan mb-2">72.5%</div>
              <div className="text-textMuted">Utilization</div>
            </div>
          </div>
        </div>
      )}

      {/* Resource Allocation View */}
      {viewMode === "allocation" && (
        <div className="space-y-8">
          {/* Current Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold text-sandTan mb-6">Current Project Allocations</h2>
            
            <div className="space-y-4">
              {teamMembers.map((member, index) => (
                <div key={member.id} className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-sandTan text-nightBlue rounded-full flex items-center justify-center font-bold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="text-textLight font-semibold">{member.name}</h3>
                        <p className="text-textMuted text-sm">{member.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sandTan font-semibold">{member.currentLoad}/{member.capacity}</span>
                      <div className="text-textMuted text-sm">points allocated</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {member.projects.map((project, projectIndex) => (
                      <div key={projectIndex} className="flex items-center justify-between bg-nightBlueShadow/50 rounded-lg p-2">
                        <span className="text-textLight text-sm">{project}</span>
                        <span className="text-sandTan text-sm font-semibold">
                          {Math.round(member.currentLoad / member.projects.length)} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Upcoming Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold text-sandTan mb-6">Upcoming Projects</h2>
            
            <div className="space-y-4">
              {upcomingProjects.map((project, index) => (
                <div key={project.id} className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-textLight font-semibold mb-1">{project.name}</h3>
                      <p className="text-textMuted text-sm mb-2">
                        {project.startDate} - {project.endDate}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-textMuted">
                        <span>Hours: {project.estimatedHours}</span>
                        <span>Budget: ${project.budget.toLocaleString()}</span>
                        <span>Skills: {project.requiredSkills.join(", ")}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(project.priority)}`}>
                        {project.priority}
                      </span>
                      <button className="bg-sandTan text-nightBlue px-4 py-2 rounded-lg hover:bg-sandTanShadow transition-all text-sm font-medium">
                        Allocate Resources
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Capacity Forecasting View */}
      {viewMode === "forecasting" && (
        <div className="space-y-8">
          {/* Forecast Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold text-sandTan mb-6">6-Week Capacity Forecast</h2>
            
            <div className="space-y-4">
              {capacityForecast.map((week, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-20 text-sm text-textMuted">{week.week}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4 bg-sandTan rounded"></div>
                      <span className="text-sm text-textLight">Utilized: {week.utilized}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-textMuted rounded"></div>
                      <span className="text-sm text-textMuted">Available: {week.available}</span>
                    </div>
                  </div>
                  <div className="w-48">
                    <div className="w-full bg-nightBlueShadow rounded-full h-3">
                      <div
                        className="bg-sandTan h-3 rounded-full transition-all duration-500"
                        style={{ width: `${(week.utilized / week.total) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-16 text-right">
                    <span className="text-sandTan text-sm font-semibold">
                      {Math.round((week.utilized / week.total) * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Forecast Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-sandTan mb-4">Capacity Alerts</h3>
              <div className="space-y-3">
                <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                  <h4 className="text-yellow-400 font-semibold text-sm">Week 2: High Utilization</h4>
                  <p className="text-textMuted text-xs">95% capacity utilization - consider adding resources</p>
                </div>
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                  <h4 className="text-red-400 font-semibold text-sm">Week 3: Overcapacity</h4>
                  <p className="text-textMuted text-xs">100% capacity - risk of burnout and delays</p>
                </div>
              </div>
            </div>
            
            <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-sandTan mb-4">Recommendations</h3>
              <div className="space-y-3">
                <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                  <h4 className="text-green-400 font-semibold text-sm">Hire Additional Developer</h4>
                  <p className="text-textMuted text-xs">Consider hiring a full-stack developer for Q1 2025</p>
                </div>
                <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
                  <h4 className="text-blue-400 font-semibold text-sm">Cross-training Program</h4>
                  <p className="text-textMuted text-xs">Train team members in multiple skill areas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




