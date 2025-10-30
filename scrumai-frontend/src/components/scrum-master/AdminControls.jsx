import React, { useState } from "react";
import { motion } from "framer-motion";

export default function AdminControls() {
  const [activeTab, setActiveTab] = useState("users"); // 'users', 'permissions', 'integrations', 'system'

  const users = [
    {
      id: 1,
      name: "Sarah Chen",
      email: "sarah@example.com",
      role: "Scrum Master",
      status: "Active",
      lastLogin: "2 hours ago",
      permissions: ["Full Access", "Team Management", "Sprint Planning"]
    },
    {
      id: 2,
      name: "Mike Johnson",
      email: "mike@example.com",
      role: "Developer",
      status: "Active",
      lastLogin: "1 hour ago",
      permissions: ["Task Management", "Sprint View"]
    },
    {
      id: 3,
      name: "Emma Davis",
      email: "emma@example.com",
      role: "Product Owner",
      status: "Active",
      lastLogin: "30 minutes ago",
      permissions: ["Backlog Management", "Sprint Planning", "Reports"]
    },
    {
      id: 4,
      name: "Alex Rodriguez",
      email: "alex@example.com",
      role: "Developer",
      status: "Inactive",
      lastLogin: "3 days ago",
      permissions: ["Task Management", "Sprint View"]
    }
  ];

  const integrations = [
    {
      id: 1,
      name: "GitHub",
      status: "Connected",
      lastSync: "5 minutes ago",
      config: { repo: "scrumai/frontend", branch: "main" }
    },
    {
      id: 2,
      name: "Slack",
      status: "Connected",
      lastSync: "1 hour ago",
      config: { channel: "#scrumai-dev", workspace: "scrumai" }
    },
    {
      id: 3,
      name: "Jira",
      status: "Disconnected",
      lastSync: "Never",
      config: { url: "", project: "" }
    }
  ];

  const systemMetrics = {
    totalUsers: 4,
    activeUsers: 3,
    totalSprints: 24,
    totalTasks: 156,
    systemUptime: "99.9%",
    lastBackup: "2 hours ago",
    storageUsed: "2.3 GB",
    apiCalls: "1,247 today"
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active": return "bg-green-500/20 text-green-400";
      case "Inactive": return "bg-red-500/20 text-red-400";
      case "Connected": return "bg-green-500/20 text-green-400";
      case "Disconnected": return "bg-red-500/20 text-red-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-sandTan mb-2">Admin Controls</h1>
        <p className="text-textMuted">Manage users, permissions, integrations, and system settings.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-6 py-3 rounded-lg transition-all ${
            activeTab === "users"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          👥 Users
        </button>
        <button
          onClick={() => setActiveTab("permissions")}
          className={`px-6 py-3 rounded-lg transition-all ${
            activeTab === "permissions"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          🔐 Permissions
        </button>
        <button
          onClick={() => setActiveTab("integrations")}
          className={`px-6 py-3 rounded-lg transition-all ${
            activeTab === "integrations"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          🔗 Integrations
        </button>
        <button
          onClick={() => setActiveTab("system")}
          className={`px-6 py-3 rounded-lg transition-all ${
            activeTab === "system"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          ⚙️ System
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === "users" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-sandTan">User Management</h2>
              <button className="bg-sandTan text-nightBlue px-4 py-2 rounded-lg hover:bg-sandTanShadow transition-all font-medium">
                + Add User
              </button>
            </div>
            
            <div className="space-y-4">
              {users.map((user, index) => (
                <div key={user.id} className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-sandTan text-nightBlue rounded-full flex items-center justify-center font-bold">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <h3 className="text-textLight font-semibold">{user.name}</h3>
                        <p className="text-textMuted text-sm">{user.email}</p>
                        <p className="text-textMuted text-xs">Last login: {user.lastLogin}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-textLight font-medium">{user.role}</div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.status)}`}>
                          {user.status}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button className="text-sandTan hover:text-sandTanShadow transition-colors text-sm">
                          Edit
                        </button>
                        <button className="text-red-400 hover:text-red-300 transition-colors text-sm">
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Permissions Tab */}
      {activeTab === "permissions" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-sandTan mb-6">Role Permissions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
                <h3 className="text-textLight font-semibold mb-4">Scrum Master</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-textMuted">Full System Access</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-textMuted">Team Management</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-textMuted">Sprint Planning</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-textMuted">Reports & Analytics</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
                <h3 className="text-textLight font-semibold mb-4">Product Owner</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-textMuted">Backlog Management</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-textMuted">Sprint Planning</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-textMuted">Reports & Analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-400">✗</span>
                    <span className="text-textMuted">Team Management</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
                <h3 className="text-textLight font-semibold mb-4">Developer</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-textMuted">Task Management</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span className="text-textMuted">Sprint View</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-400">✗</span>
                    <span className="text-textMuted">Sprint Planning</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-red-400">✗</span>
                    <span className="text-textMuted">Team Management</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Integrations Tab */}
      {activeTab === "integrations" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-sandTan mb-6">Third-Party Integrations</h2>
            
            <div className="space-y-4">
              {integrations.map((integration, index) => (
                <div key={integration.id} className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {integration.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-textLight font-semibold">{integration.name}</h3>
                        <p className="text-textMuted text-sm">Last sync: {integration.lastSync}</p>
                        {integration.config.repo && (
                          <p className="text-textMuted text-xs">Repo: {integration.config.repo}</p>
                        )}
                        {integration.config.channel && (
                          <p className="text-textMuted text-xs">Channel: {integration.config.channel}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(integration.status)}`}>
                        {integration.status}
                      </span>
                      <div className="flex gap-2">
                        <button className="text-sandTan hover:text-sandTanShadow transition-colors text-sm">
                          Configure
                        </button>
                        {integration.status === "Connected" ? (
                          <button className="text-red-400 hover:text-red-300 transition-colors text-sm">
                            Disconnect
                          </button>
                        ) : (
                          <button className="text-green-400 hover:text-green-300 transition-colors text-sm">
                            Connect
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* System Tab */}
      {activeTab === "system" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-sandTan mb-6">System Overview</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-sandTan mb-1">{systemMetrics.totalUsers}</div>
                <div className="text-textMuted text-sm">Total Users</div>
              </div>
              <div className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-sandTan mb-1">{systemMetrics.activeUsers}</div>
                <div className="text-textMuted text-sm">Active Users</div>
              </div>
              <div className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-sandTan mb-1">{systemMetrics.totalSprints}</div>
                <div className="text-textMuted text-sm">Total Sprints</div>
              </div>
              <div className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-sandTan mb-1">{systemMetrics.totalTasks}</div>
                <div className="text-textMuted text-sm">Total Tasks</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
                <h3 className="text-textLight font-semibold mb-4">System Health</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-textMuted text-sm">Uptime</span>
                    <span className="text-green-400 font-semibold">{systemMetrics.systemUptime}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-textMuted text-sm">Last Backup</span>
                    <span className="text-textLight text-sm">{systemMetrics.lastBackup}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-textMuted text-sm">Storage Used</span>
                    <span className="text-textLight text-sm">{systemMetrics.storageUsed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-textMuted text-sm">API Calls Today</span>
                    <span className="text-textLight text-sm">{systemMetrics.apiCalls}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
                <h3 className="text-textLight font-semibold mb-4">System Actions</h3>
                <div className="space-y-3">
                  <button className="w-full bg-sandTan text-nightBlue py-2 rounded-lg hover:bg-sandTanShadow transition-all font-medium">
                    Create Backup
                  </button>
                  <button className="w-full border border-sandTan text-sandTan py-2 rounded-lg hover:bg-sandTan hover:text-nightBlue transition-all font-medium">
                    System Logs
                  </button>
                  <button className="w-full border border-sandTan text-sandTan py-2 rounded-lg hover:bg-sandTan hover:text-nightBlue transition-all font-medium">
                    Clear Cache
                  </button>
                  <button className="w-full border border-red-500 text-red-400 py-2 rounded-lg hover:bg-red-500 hover:text-white transition-all font-medium">
                    Restart System
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}






