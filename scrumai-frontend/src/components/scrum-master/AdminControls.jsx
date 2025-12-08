import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import TeamMemberForm from "./TeamMemberForm";
import { LOGIN_ENDPOINTS, apiRequest } from "../../config/api";

export default function AdminControls() {
  const [activeTab, setActiveTab] = useState("users"); // 'users', 'permissions', 'integrations', 'system'
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [deletingMemberId, setDeletingMemberId] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch team members from API
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setLoading(true);
        const response = await apiRequest(LOGIN_ENDPOINTS.team.getAll, {
          method: "GET",
        });
        
        // Handle API response structure: { success: true, data: [...] } or direct array
        const membersArray = Array.isArray(response) ? response : (response.data || []);
        
        // Transform API response to match component format
        const transformedUsers = Array.isArray(membersArray) 
          ? membersArray.map((member, index) => {
              // Get the actual ID from API - try multiple possible field names
              const memberId = member.id || member.pk || member.member_id || member.team_member_id || member.user_id;
              
              return {
                id: memberId || index + 1, // Use actual ID from API
                name: member.name || "Unknown",
                email: member.email || `${member.name?.toLowerCase().replace(/\s+/g, '.')}@example.com`,
                role: member.role || "Team Member",
                status: member.status === 'active' || member.status === 'available' ? "Active" : "Inactive",
                lastLogin: member.lastLogin || "Never",
                permissions: member.permissions || ["Task Management", "Sprint View"],
                skills: member.skills || [],
                capacityHours: member.capacityHours || 40,
                assignedHours: member.assignedHours || 0
              };
            })
          : [];
        
        setUsers(transformedUsers);
      } catch (err) {
        console.error('Error fetching team members:', err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  // Refresh team members list
  const refreshTeamMembers = async () => {
    try {
      const response = await apiRequest(LOGIN_ENDPOINTS.team.getAll, {
        method: "GET",
      });
      
      // Handle API response structure: { success: true, data: [...] } or direct array
      const membersArray = Array.isArray(response) ? response : (response.data || []);
      
      const transformedUsers = Array.isArray(membersArray) 
        ? membersArray.map((member, index) => {
            // Get the actual ID from API - try multiple possible field names
            const memberId = member.id || member.pk || member.member_id || member.team_member_id || member.user_id;
            
            return {
              id: memberId || index + 1, // Use actual ID from API
              name: member.name || "Unknown",
              email: member.email || `${member.name?.toLowerCase().replace(/\s+/g, '.')}@example.com`,
              role: member.role || "Team Member",
              status: member.status === 'active' || member.status === 'available' ? "Active" : "Inactive",
              lastLogin: member.lastLogin || "Never",
              permissions: member.permissions || ["Task Management", "Sprint View"],
              skills: member.skills || [],
              capacityHours: member.capacityHours || 40,
              assignedHours: member.assignedHours || 0
            };
          })
        : [];
      
      setUsers(transformedUsers);
    } catch (err) {
      console.error('Error fetching team members:', err);
    }
  };

  // Handle delete team member
  const handleDelete = async (memberId) => {
    if (!window.confirm('Are you sure you want to delete this team member? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await apiRequest(LOGIN_ENDPOINTS.team.delete(memberId), {
        method: "DELETE",
      });
      
      console.log('Delete response:', response);
      // Refresh the list after deletion
      await refreshTeamMembers();
      setDeletingMemberId(null);
    } catch (err) {
      console.error('Error deleting team member:', err);
      alert('Failed to delete team member: ' + (err.message || 'Unknown error'));
    }
  };

  // Handle edit team member
  const handleEdit = (user) => {
    setEditingMember(user);
  };

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
              <button 
                onClick={() => setShowAddForm(true)}
                className="bg-sandTan text-nightBlue px-4 py-2 rounded-lg hover:bg-sandTanShadow transition-all font-medium flex items-center gap-2"
              >
                <span>+</span>
                <span>Add Team Member</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sandTan mx-auto mb-2"></div>
                  <p className="text-textMuted">Loading team members...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-textMuted">
                  No team members found. Add your first team member!
                </div>
              ) : (
                users.map((user, index) => (
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
                        <button 
                          onClick={() => handleEdit(user)}
                          className="text-sandTan hover:text-sandTanShadow transition-colors text-sm font-medium px-3 py-1 rounded hover:bg-sandTan/10"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(user.id)}
                          className="text-red-400 hover:text-red-300 transition-colors text-sm font-medium px-3 py-1 rounded hover:bg-red-500/10"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                ))
              )}
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

      {/* Add Team Member Form Modal */}
      {showAddForm && (
        <TeamMemberForm
          onClose={() => setShowAddForm(false)}
          onSuccess={(newMember) => {
            // Close the form after successful addition
            setShowAddForm(false);
            // Refresh the team members list
            refreshTeamMembers();
          }}
        />
      )}

      {/* Edit Team Member Form Modal */}
      {editingMember && (
        <TeamMemberForm
          editMember={editingMember}
          onClose={() => setEditingMember(null)}
          onSuccess={(updatedMember) => {
            // Close the form after successful update
            setEditingMember(null);
            // Refresh the team members list
            refreshTeamMembers();
          }}
        />
      )}
    </div>
  );
}






