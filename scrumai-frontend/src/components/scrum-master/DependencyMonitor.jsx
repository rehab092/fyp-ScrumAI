import React, { useState } from "react";
import { motion } from "framer-motion";

export default function DependencyMonitor() {
  const [viewMode, setViewMode] = useState("overview"); // 'overview', 'risks', 'critical-path'

  const dependencies = [
    {
      id: 1,
      from: "Database Setup",
      to: "User Authentication",
      type: "blocking",
      severity: "High",
      status: "Resolved",
      impact: "2 days saved"
    },
    {
      id: 2,
      from: "User Authentication",
      to: "API Integration",
      type: "blocking",
      severity: "High",
      status: "Active",
      impact: "Potential 1-day delay"
    },
    {
      id: 3,
      from: "API Integration",
      to: "UI Components",
      type: "blocking",
      severity: "Medium",
      status: "Active",
      impact: "No current impact"
    },
    {
      id: 4,
      from: "UI Components",
      to: "Payment Processing",
      type: "blocking",
      severity: "High",
      status: "Active",
      impact: "Critical path dependency"
    }
  ];

  const criticalPath = [
    { task: "Database Setup", duration: 2, status: "Completed" },
    { task: "User Authentication", duration: 3, status: "In Progress" },
    { task: "API Integration", duration: 4, status: "Ready" },
    { task: "UI Components", duration: 3, status: "Ready" },
    { task: "Payment Processing", duration: 2, status: "Ready" }
  ];

  const riskAlerts = [
    {
      id: 1,
      type: "dependency_risk",
      severity: "High",
      title: "Payment Processing Blocked",
      description: "Payment processing depends on UI Components completion",
      impact: "2-day delay risk",
      suggestedAction: "Consider parallel development approach",
      confidence: 85
    },
    {
      id: 2,
      type: "resource_conflict",
      severity: "Medium",
      title: "Resource Bottleneck",
      description: "Multiple tasks require Sarah's frontend expertise",
      impact: "Potential scheduling conflict",
      suggestedAction: "Cross-train team members or hire additional frontend developer",
      confidence: 70
    },
    {
      id: 3,
      type: "timeline_risk",
      severity: "Low",
      title: "Sprint Buffer Depleted",
      description: "Current sprint has minimal buffer for unexpected delays",
      impact: "Reduced flexibility",
      suggestedAction: "Add 10% buffer to future sprint planning",
      confidence: 60
    }
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "High": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "Medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Low": return "bg-green-500/20 text-green-400 border-green-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed": return "bg-green-500/20 text-green-400";
      case "In Progress": return "bg-blue-500/20 text-blue-400";
      case "Ready": return "bg-gray-500/20 text-gray-400";
      case "Resolved": return "bg-green-500/20 text-green-400";
      case "Active": return "bg-yellow-500/20 text-yellow-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-sandTan mb-2">Dependency Monitor</h1>
        <p className="text-textMuted">Track dependencies, identify risks, and monitor critical path to prevent delays.</p>
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
          🔗 Dependencies
        </button>
        <button
          onClick={() => setViewMode("risks")}
          className={`px-6 py-3 rounded-lg transition-all ${
            viewMode === "risks"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          ⚠️ Risk Alerts
        </button>
        <button
          onClick={() => setViewMode("critical-path")}
          className={`px-6 py-3 rounded-lg transition-all ${
            viewMode === "critical-path"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          🎯 Critical Path
        </button>
      </div>

      {/* Dependencies Overview */}
      {viewMode === "overview" && (
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold text-sandTan mb-6">Dependency Map</h2>
            
            <div className="space-y-4">
              {dependencies.map((dep, index) => (
                <div key={dep.id} className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-lg">🔗</div>
                      <div>
                        <h3 className="text-textLight font-semibold">
                          {dep.from} → {dep.to}
                        </h3>
                        <p className="text-textMuted text-sm">Type: {dep.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(dep.severity)}`}>
                        {dep.severity}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(dep.status)}`}>
                        {dep.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-textMuted text-sm">Impact: {dep.impact}</span>
                    <div className="flex gap-2">
                      <button className="bg-sandTan text-nightBlue px-3 py-1 rounded text-sm hover:bg-sandTanShadow transition-all">
                        View Details
                      </button>
                      {dep.status === "Active" && (
                        <button className="border border-sandTan text-sandTan px-3 py-1 rounded text-sm hover:bg-sandTan hover:text-nightBlue transition-all">
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Dependency Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-sandTan mb-2">{dependencies.length}</div>
              <div className="text-textMuted">Total Dependencies</div>
            </div>
            <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-red-400 mb-2">
                {dependencies.filter(d => d.severity === "High").length}
              </div>
              <div className="text-textMuted">High Risk</div>
            </div>
            <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">
                {dependencies.filter(d => d.severity === "Medium").length}
              </div>
              <div className="text-textMuted">Medium Risk</div>
            </div>
            <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">
                {dependencies.filter(d => d.status === "Resolved").length}
              </div>
              <div className="text-textMuted">Resolved</div>
            </div>
          </div>
        </div>
      )}

      {/* Risk Alerts */}
      {viewMode === "risks" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-sandTan mb-6">Risk Alerts</h2>
            
            <div className="space-y-4">
              {riskAlerts.map((alert, index) => (
                <div key={alert.id} className={`border rounded-xl p-4 ${getSeverityColor(alert.severity)}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-sm mb-1">{alert.title}</h3>
                      <p className="text-xs mb-2">{alert.description}</p>
                      <p className="text-xs font-medium">Impact: {alert.impact}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium">{alert.severity}</span>
                      <div className="text-xs text-textMuted">{alert.confidence}% confidence</div>
                    </div>
                  </div>
                  
                  <div className="bg-nightBlue/60 border border-sandTan/30 rounded-lg p-3 mb-3">
                    <p className="text-sandTan text-sm mb-1">💡 Suggested Action</p>
                    <p className="text-textLight text-xs">{alert.suggestedAction}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="bg-sandTan text-nightBlue px-3 py-1 rounded text-xs hover:bg-sandTanShadow transition-all">
                      Apply Fix
                    </button>
                    <button className="border border-current px-3 py-1 rounded text-xs hover:bg-current/10 transition-all">
                      Dismiss
                    </button>
                    <button className="border border-current px-3 py-1 rounded text-xs hover:bg-current/10 transition-all">
                      Monitor
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Critical Path */}
      {viewMode === "critical-path" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-sandTan mb-6">Critical Path Analysis</h2>
            
            <div className="space-y-4">
              {criticalPath.map((task, index) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-sandTan text-nightBlue rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-textLight font-semibold">{task.task}</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-sandTan text-sm font-semibold">{task.duration} days</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  {index < criticalPath.length - 1 && (
                    <div className="text-sandTan text-2xl">→</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Critical Path Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-sandTan mb-2">
                {criticalPath.reduce((sum, task) => sum + task.duration, 0)}
              </div>
              <div className="text-textMuted">Total Duration (days)</div>
            </div>
            <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-sandTan mb-2">
                {criticalPath.filter(task => task.status === "Completed").length}
              </div>
              <div className="text-textMuted">Completed Tasks</div>
            </div>
            <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6 text-center">
              <div className="text-3xl font-bold text-sandTan mb-2">
                {criticalPath.filter(task => task.status === "In Progress").length}
              </div>
              <div className="text-textMuted">In Progress</div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}






