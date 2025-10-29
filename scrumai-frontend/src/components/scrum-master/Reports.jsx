import React, { useState } from "react";
import { motion } from "framer-motion";

export default function Reports() {
  const [reportType, setReportType] = useState("sprint"); // 'sprint', 'team', 'project', 'custom'

  const sprintReports = [
    {
      id: "Sprint 24",
      name: "Q4 Feature Release",
      startDate: "2024-12-16",
      endDate: "2024-12-30",
      planned: 40,
      completed: 35,
      velocity: 35,
      burndown: 95,
      blockers: 2,
      teamSatisfaction: 4.2
    },
    {
      id: "Sprint 23",
      name: "Bug Fixes & Improvements",
      startDate: "2024-12-02",
      endDate: "2024-12-15",
      planned: 38,
      completed: 38,
      velocity: 38,
      burndown: 100,
      blockers: 0,
      teamSatisfaction: 4.5
    }
  ];

  const teamReports = [
    {
      name: "Sarah Chen",
      role: "Frontend Dev",
      velocity: 8.5,
      tasksCompleted: 12,
      averageTaskTime: "2.3 days",
      efficiency: 85,
      satisfaction: 4.3
    },
    {
      name: "Mike Johnson",
      role: "Backend Dev",
      velocity: 9.2,
      tasksCompleted: 15,
      averageTaskTime: "1.8 days",
      efficiency: 92,
      satisfaction: 4.6
    },
    {
      name: "Emma Davis",
      role: "Full Stack",
      velocity: 7.8,
      tasksCompleted: 10,
      averageTaskTime: "2.7 days",
      efficiency: 78,
      satisfaction: 4.1
    },
    {
      name: "Alex Rodriguez",
      role: "DevOps",
      velocity: 6.5,
      tasksCompleted: 8,
      averageTaskTime: "3.2 days",
      efficiency: 65,
      satisfaction: 3.8
    }
  ];

  const projectMetrics = {
    totalSprints: 24,
    averageVelocity: 36.5,
    onTimeDelivery: 87,
    totalTasks: 156,
    completedTasks: 142,
    averageSprintLength: 14,
    teamSize: 5,
    projectDuration: "6 months"
  };

  const getSatisfactionColor = (rating) => {
    if (rating >= 4.5) return "text-green-400";
    if (rating >= 4.0) return "text-yellow-400";
    if (rating >= 3.5) return "text-orange-400";
    return "text-red-400";
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
        <h1 className="text-3xl font-bold text-sandTan mb-2">Reports & Analytics</h1>
        <p className="text-textMuted">Generate comprehensive reports for stakeholders and team performance analysis.</p>
      </div>

      {/* Report Type Selector */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setReportType("sprint")}
          className={`px-6 py-3 rounded-lg transition-all ${
            reportType === "sprint"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          🏃 Sprint Reports
        </button>
        <button
          onClick={() => setReportType("team")}
          className={`px-6 py-3 rounded-lg transition-all ${
            reportType === "team"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          👥 Team Reports
        </button>
        <button
          onClick={() => setReportType("project")}
          className={`px-6 py-3 rounded-lg transition-all ${
            reportType === "project"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          📊 Project Reports
        </button>
        <button
          onClick={() => setReportType("custom")}
          className={`px-6 py-3 rounded-lg transition-all ${
            reportType === "custom"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          🎯 Custom Reports
        </button>
      </div>

      {/* Sprint Reports */}
      {reportType === "sprint" && (
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold text-sandTan mb-6">Sprint Performance Reports</h2>
            
            <div className="space-y-6">
              {sprintReports.map((sprint, index) => (
                <div key={sprint.id} className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-sandTan">{sprint.id}</h3>
                      <p className="text-textMuted text-sm">{sprint.name}</p>
                      <p className="text-textMuted text-xs">
                        {sprint.startDate} - {sprint.endDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-sandTan">{sprint.velocity}</div>
                        <div className="text-textMuted text-sm">Velocity</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-sandTan">{sprint.burndown}%</div>
                        <div className="text-textMuted text-sm">Burndown</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${getSatisfactionColor(sprint.teamSatisfaction)}`}>
                          {sprint.teamSatisfaction}
                        </div>
                        <div className="text-textMuted text-sm">Satisfaction</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-nightBlueShadow/50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-textLight">{sprint.planned}</div>
                      <div className="text-textMuted text-sm">Planned Points</div>
                    </div>
                    <div className="bg-nightBlueShadow/50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-textLight">{sprint.completed}</div>
                      <div className="text-textMuted text-sm">Completed Points</div>
                    </div>
                    <div className="bg-nightBlueShadow/50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-textLight">{sprint.blockers}</div>
                      <div className="text-textMuted text-sm">Blockers</div>
                    </div>
                    <div className="bg-nightBlueShadow/50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-textLight">
                        {Math.round((sprint.completed / sprint.planned) * 100)}%
                      </div>
                      <div className="text-textMuted text-sm">Completion Rate</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Team Reports */}
      {reportType === "team" && (
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold text-sandTan mb-6">Team Performance Reports</h2>
            
            <div className="space-y-4">
              {teamReports.map((member, index) => (
                <div key={index} className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-sandTan text-nightBlue rounded-full flex items-center justify-center font-bold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="text-textLight font-semibold">{member.name}</h3>
                        <p className="text-textMuted text-sm">{member.role}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-lg font-bold text-sandTan">{member.velocity}</div>
                        <div className="text-textMuted text-sm">Velocity</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${getEfficiencyColor(member.efficiency)}`}>
                          {member.efficiency}%
                        </div>
                        <div className="text-textMuted text-sm">Efficiency</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${getSatisfactionColor(member.satisfaction)}`}>
                          {member.satisfaction}
                        </div>
                        <div className="text-textMuted text-sm">Satisfaction</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-nightBlueShadow/50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-textLight">{member.tasksCompleted}</div>
                      <div className="text-textMuted text-sm">Tasks Completed</div>
                    </div>
                    <div className="bg-nightBlueShadow/50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-textLight">{member.averageTaskTime}</div>
                      <div className="text-textMuted text-sm">Avg Task Time</div>
                    </div>
                    <div className="bg-nightBlueShadow/50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-textLight">
                        {Math.round((member.tasksCompleted / 20) * 100)}%
                      </div>
                      <div className="text-textMuted text-sm">Productivity</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Project Reports */}
      {reportType === "project" && (
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold text-sandTan mb-6">Project Overview Report</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-sandTan mb-2">{projectMetrics.totalSprints}</div>
                <div className="text-textMuted">Total Sprints</div>
              </div>
              <div className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-sandTan mb-2">{projectMetrics.averageVelocity}</div>
                <div className="text-textMuted">Avg Velocity</div>
              </div>
              <div className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-sandTan mb-2">{projectMetrics.onTimeDelivery}%</div>
                <div className="text-textMuted">On-Time Delivery</div>
              </div>
              <div className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-sandTan mb-2">{projectMetrics.teamSize}</div>
                <div className="text-textMuted">Team Size</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
                <h3 className="text-textLight font-semibold mb-4">Project Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-textMuted text-sm">Total Tasks</span>
                    <span className="text-textLight font-semibold">{projectMetrics.totalTasks}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-textMuted text-sm">Completed Tasks</span>
                    <span className="text-textLight font-semibold">{projectMetrics.completedTasks}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-textMuted text-sm">Average Sprint Length</span>
                    <span className="text-textLight font-semibold">{projectMetrics.averageSprintLength} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-textMuted text-sm">Project Duration</span>
                    <span className="text-textLight font-semibold">{projectMetrics.projectDuration}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
                <h3 className="text-textLight font-semibold mb-4">Success Metrics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-textMuted text-sm">Completion Rate</span>
                    <span className="text-green-400 font-semibold">
                      {Math.round((projectMetrics.completedTasks / projectMetrics.totalTasks) * 100)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-textMuted text-sm">Velocity Trend</span>
                    <span className="text-green-400 font-semibold">+12%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-textMuted text-sm">Team Satisfaction</span>
                    <span className="text-green-400 font-semibold">4.2/5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-textMuted text-sm">Quality Score</span>
                    <span className="text-green-400 font-semibold">92%</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Custom Reports */}
      {reportType === "custom" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-sandTan mb-6">Custom Report Builder</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-textLight font-semibold mb-4">Report Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sandTan font-medium">Report Type</label>
                    <select className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-3 text-textLight focus:outline-none focus:border-sandTan">
                      <option>Performance Report</option>
                      <option>Velocity Analysis</option>
                      <option>Team Productivity</option>
                      <option>Risk Assessment</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sandTan font-medium">Time Period</label>
                    <select className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-3 text-textLight focus:outline-none focus:border-sandTan">
                      <option>Last 4 Sprints</option>
                      <option>Last Quarter</option>
                      <option>Last 6 Months</option>
                      <option>Custom Range</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sandTan font-medium">Include Metrics</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-textMuted text-sm">Velocity Trends</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-textMuted text-sm">Team Performance</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" />
                        <span className="text-textMuted text-sm">Risk Analysis</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" className="rounded" defaultChecked />
                        <span className="text-textMuted text-sm">Burndown Charts</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-textLight font-semibold mb-4">Export Options</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sandTan font-medium">Format</label>
                    <select className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-3 text-textLight focus:outline-none focus:border-sandTan">
                      <option>PDF Report</option>
                      <option>Excel Spreadsheet</option>
                      <option>PowerPoint Presentation</option>
                      <option>CSV Data</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sandTan font-medium">Recipients</label>
                    <input
                      type="email"
                      placeholder="Enter email addresses"
                      className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-3 text-textLight focus:outline-none focus:border-sandTan"
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-2 text-sandTan font-medium">Schedule</label>
                    <select className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-3 text-textLight focus:outline-none focus:border-sandTan">
                      <option>Generate Once</option>
                      <option>Weekly</option>
                      <option>Monthly</option>
                      <option>End of Sprint</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 mt-6">
              <button className="bg-sandTan text-nightBlue px-6 py-3 rounded-lg hover:bg-sandTanShadow transition-all font-medium">
                Generate Report
              </button>
              <button className="border border-sandTan text-sandTan px-6 py-3 rounded-lg hover:bg-sandTan hover:text-nightBlue transition-all font-medium">
                Preview
              </button>
              <button className="border border-sandTan text-sandTan px-6 py-3 rounded-lg hover:bg-sandTan hover:text-nightBlue transition-all font-medium">
                Save Template
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Export Options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-8 bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6"
      >
        <h2 className="text-xl font-bold text-sandTan mb-4">Export & Share</h2>
        <div className="flex flex-wrap gap-4">
          <button className="bg-sandTan text-nightBlue px-6 py-3 rounded-lg hover:bg-sandTanShadow transition-all font-medium">
            📊 Export as PDF
          </button>
          <button className="border border-sandTan text-sandTan px-6 py-3 rounded-lg hover:bg-sandTan hover:text-nightBlue transition-all font-medium">
            📈 Export as Excel
          </button>
          <button className="border border-sandTan text-sandTan px-6 py-3 rounded-lg hover:bg-sandTan hover:text-nightBlue transition-all font-medium">
            📧 Email Report
          </button>
          <button className="border border-sandTan text-sandTan px-6 py-3 rounded-lg hover:bg-sandTan hover:text-nightBlue transition-all font-medium">
            🔗 Share Link
          </button>
        </div>
      </motion.div>
    </div>
  );
}




