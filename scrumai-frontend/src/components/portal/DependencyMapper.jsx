import React, { useState } from "react";
import { motion } from "framer-motion";

export default function DependencyMapper() {
  const [viewMode, setViewMode] = useState("graph"); // 'graph', 'list', 'matrix'
  const [selectedNode, setSelectedNode] = useState(null);

  const tasks = [
    {
      id: 1,
      title: "Authentication",
      icon: "🔒",
      status: "Completed",
      dependencies: [],
      dependents: [2, 3],
      x: 300,
      y: 20
    },
    {
      id: 2,
      title: "UI Components",
      icon: "🎨",
      status: "Ready",
      dependencies: [1],
      dependents: [4],
      x: 50,
      y: 130
    },
    {
      id: 3,
      title: "API Layer",
      icon: "⚡",
      status: "Completed",
      dependencies: [1],
      dependents: [5, 6],
      x: 550,
      y: 130
    },
    {
      id: 4,
      title: "Testing",
      icon: "🧪",
      status: "Completed",
      dependencies: [2],
      dependents: [5],
      x: 50,
      y: 240
    },
    {
      id: 5,
      title: "Deployment",
      icon: "🚀",
      status: "In Progress",
      dependencies: [4, 3],
      dependents: [6],
      x: 300,
      y: 240
    },
    {
      id: 6,
      title: "Analytics",
      icon: "📊",
      status: "Completed",
      dependencies: [5, 3],
      dependents: [],
      x: 550,
      y: 240
    }
  ];

  const criticalPath = [1, 3, 5, 6];
  const riskAlerts = [
    {
      id: 1,
      type: "blocking",
      message: "Payment Processing blocked by Shopping Cart completion",
      severity: "High",
      affectedTasks: [7],
      suggestedAction: "Consider parallel development of payment UI"
    },
    {
      id: 2,
      type: "dependency",
      message: "Product Catalog has multiple dependencies",
      severity: "Medium",
      affectedTasks: [4],
      suggestedAction: "Monitor closely for potential delays"
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed": return "bg-gradient-to-br from-emerald-500 to-teal-600 border-2 border-emerald-400";
      case "In Progress": return "bg-gradient-to-br from-orange-500 to-orange-600 border-2 border-orange-400";
      case "Ready": return "bg-gradient-to-br from-slate-600 to-slate-700 border-2 border-slate-500";
      case "Blocked": return "bg-gradient-to-br from-red-500 to-red-600 border-2 border-red-400";
      default: return "bg-gradient-to-br from-slate-600 to-slate-700 border-2 border-slate-500";
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "High": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "Medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Low": return "bg-green-500/20 text-green-400 border-green-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* View Mode Selector */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setViewMode("graph")}
          className={`px-6 py-3 rounded-lg transition-all ${
            viewMode === "graph"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          🗺️ Graph View
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`px-6 py-3 rounded-lg transition-all ${
            viewMode === "list"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          📋 List View
        </button>
        <button
          onClick={() => setViewMode("matrix")}
          className={`px-6 py-3 rounded-lg transition-all ${
            viewMode === "matrix"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          🔢 Matrix View
        </button>
      </div>

      {/* Risk Alerts */}
      {riskAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h2 className="text-xl font-bold text-sandTan mb-4">⚠️ Risk Alerts</h2>
          <div className="space-y-4">
            {riskAlerts.map((alert, index) => (
              <div key={alert.id} className={`border rounded-xl p-4 ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold">{alert.message}</h3>
                  <span className="text-sm font-medium">{alert.severity}</span>
                </div>
                <p className="text-sm mb-3">{alert.suggestedAction}</p>
                <div className="flex gap-2">
                  <button className="bg-sandTan text-nightBlue px-3 py-1 rounded text-sm hover:bg-sandTanShadow transition-all">
                    Apply Fix
                  </button>
                  <button className="border border-current px-3 py-1 rounded text-sm hover:bg-current/10 transition-all">
                    Dismiss
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Graph View */}
      {viewMode === "graph" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="text-2xl">🔗</span>
            <h2 className="text-xl font-bold text-slate-800">Task Dependencies Flow</h2>
          </div>
          <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-8 h-[380px] overflow-visible border border-slate-200">
            {/* SVG for connections */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              {tasks.map((task) =>
                task.dependencies.map((depId) => {
                  const depTask = tasks.find(t => t.id === depId);
                  if (!depTask) return null;
                  
                  const isCritical = criticalPath.includes(task.id) && criticalPath.includes(depId);
                  
                  // Node dimensions
                  const nodeWidth = 160; // w-40 = 160px
                  const nodeHeight = 64; // h-16 = 64px
                  
                  // Calculate connection points (from bottom of parent to top of child)
                  const x1 = depTask.x + nodeWidth / 2;
                  const y1 = depTask.y + nodeHeight;
                  const x2 = task.x + nodeWidth / 2;
                  const y2 = task.y;
                  
                  // Create curved path with smooth S-curve
                  const midY = (y1 + y2) / 2;
                  const path = `M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`;
                  
                  return (
                    <g key={`${depId}-${task.id}`}>
                      <path
                        d={path}
                        stroke={isCritical ? "#10B981" : "#3B82F6"}
                        strokeWidth={isCritical ? 3 : 2.5}
                        strokeDasharray={isCritical ? "0" : "0"}
                        fill="none"
                        opacity={isCritical ? 0.8 : 0.6}
                        strokeLinecap="round"
                      />
                      {/* Arrow head */}
                      <polygon
                        points={`${x2},${y2} ${x2-5},${y2-8} ${x2+5},${y2-8}`}
                        fill={isCritical ? "#10B981" : "#3B82F6"}
                        opacity={isCritical ? 0.8 : 0.6}
                      />
                    </g>
                  );
                })
              )}
            </svg>

            {/* Task Nodes */}
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: task.id * 0.1 }}
                className={`absolute w-40 h-16 rounded-xl shadow-lg cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                  selectedNode === task.id
                    ? "ring-2 ring-primary shadow-2xl scale-105"
                    : ""
                } ${getStatusColor(task.status)}`}
                style={{ left: task.x, top: task.y, zIndex: 10 }}
                onClick={() => setSelectedNode(selectedNode === task.id ? null : task.id)}
              >
                <div className="p-2 h-full flex items-center gap-2">
                  <span className="text-lg">{task.icon}</span>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-white truncate" title={task.title}>
                      {task.title}
                    </div>
                    <div className="text-xs text-white/80 capitalize">{task.status}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-6 text-sm bg-white rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-emerald-500 rounded-full"></div>
              <span className="text-slate-700 font-medium">Critical Path</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-1 bg-blue-500 rounded-full"></div>
              <span className="text-slate-700 font-medium">Dependency</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded"></div>
              <span className="text-slate-700">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded"></div>
              <span className="text-slate-700">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-br from-slate-600 to-slate-700 rounded"></div>
              <span className="text-slate-700">Ready</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {tasks.map((task, index) => (
            <div key={task.id} className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-sandTan mb-2">{task.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-textMuted">
                    <span>Status: {task.status}</span>
                    <span>Dependencies: {task.dependencies.length}</span>
                    <span>Dependents: {task.dependents.length}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    task.status === "Completed" ? "bg-green-500/20 text-green-400" :
                    task.status === "In Progress" ? "bg-blue-500/20 text-blue-400" :
                    "bg-gray-500/20 text-gray-400"
                  }`}>
                    {task.status}
                  </span>
                  {criticalPath.includes(task.id) && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-sandTan/20 text-sandTan">
                      Critical Path
                    </span>
                  )}
                </div>
              </div>
              
              {(task.dependencies.length > 0 || task.dependents.length > 0) && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {task.dependencies.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-sandTan mb-2">Dependencies</h4>
                      <div className="space-y-1">
                        {task.dependencies.map((depId) => {
                          const depTask = tasks.find(t => t.id === depId);
                          return depTask ? (
                            <div key={depId} className="text-sm text-textMuted">
                              • {depTask.title}
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                  {task.dependents.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-sandTan mb-2">Dependents</h4>
                      <div className="space-y-1">
                        {task.dependents.map((depId) => {
                          const depTask = tasks.find(t => t.id === depId);
                          return depTask ? (
                            <div key={depId} className="text-sm text-textMuted">
                              • {depTask.title}
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </motion.div>
      )}

      {/* Matrix View */}
      {viewMode === "matrix" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6 overflow-x-auto"
        >
          <h2 className="text-xl font-bold text-sandTan mb-6">Dependency Matrix</h2>
          
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left py-3 text-sandTan font-semibold">Task</th>
                {tasks.map((task) => (
                  <th key={task.id} className="text-center py-3 text-sandTan font-semibold text-sm">
                    {task.title.split(' ')[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b border-sandTan/10">
                  <td className="py-3 text-textLight font-medium">{task.title}</td>
                  {tasks.map((otherTask) => (
                    <td key={otherTask.id} className="py-3 text-center">
                      {task.dependencies.includes(otherTask.id) ? (
                        <div className="w-4 h-4 bg-sandTan rounded-full mx-auto"></div>
                      ) : (
                        <div className="w-4 h-4 bg-nightBlueShadow rounded-full mx-auto"></div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="mt-4 text-sm text-textMuted">
            <span className="inline-flex items-center gap-2">
              <div className="w-4 h-4 bg-sandTan rounded-full"></div>
              Dependency exists
            </span>
            <span className="inline-flex items-center gap-2 ml-4">
              <div className="w-4 h-4 bg-nightBlueShadow rounded-full"></div>
              No dependency
            </span>
          </div>
        </motion.div>
      )}

      {/* Selected Node Details */}
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-8 bg-sandTan/10 border border-sandTan/30 rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-sandTan mb-4">
            {tasks.find(t => t.id === selectedNode)?.title} Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-sandTan mb-2">Dependencies</h4>
              <div className="space-y-1">
                {tasks.find(t => t.id === selectedNode)?.dependencies.map((depId) => {
                  const depTask = tasks.find(t => t.id === depId);
                  return depTask ? (
                    <div key={depId} className="text-sm text-textMuted">
                      • {depTask.title}
                    </div>
                  ) : null;
                })}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sandTan mb-2">Dependents</h4>
              <div className="space-y-1">
                {tasks.find(t => t.id === selectedNode)?.dependents.map((depId) => {
                  const depTask = tasks.find(t => t.id === depId);
                  return depTask ? (
                    <div key={depId} className="text-sm text-textMuted">
                      • {depTask.title}
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}






