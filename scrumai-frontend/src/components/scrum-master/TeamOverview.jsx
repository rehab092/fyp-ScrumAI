import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LOGIN_ENDPOINTS, apiRequest } from "../../config/api";
import TeamMemberDetailModal from "./TeamMemberDetailModal";

export default function TeamOverview() {
  const [viewMode, setViewMode] = useState("overview"); // 'overview', 'performance', 'capacity'
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  // Handle Edit
  const handleEditMember = (e, member) => {
    e.stopPropagation();
    setEditingMember(member);
  };

  // Handle Delete
  const handleDeleteMember = async (e, memberId) => {
    e.stopPropagation();
    setShowDeleteConfirm(memberId);
  };

  // Confirm Delete
  const confirmDelete = async (memberId) => {
    try {
      const workspaceId = localStorage.getItem("workspaceId");
      const response = await fetch(LOGIN_ENDPOINTS.team.delete(memberId), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Workspace-ID": workspaceId,
        },
      });

      if (response.ok) {
        setTeamMembers(prev => prev.filter(m => m.id !== memberId));
        setShowDeleteConfirm(null);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete member");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete member");
    }
  };

  // Fetch team members from API
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await apiRequest(LOGIN_ENDPOINTS.team.getAll, {
          method: "GET",
        });
        
        // Transform API response to match component format
        const transformedMembers = Array.isArray(response) 
          ? response.map((member, index) => {
              // Get the actual ID from API - try multiple possible field names
              const memberId = member.id || member.pk || member.member_id || member.team_member_id || member.user_id;
              
              return {
                id: memberId || index + 1, // Use actual ID from API
                name: member.name || "Unknown",
                role: member.role || "Team Member",
                email: member.email || `${member.name?.toLowerCase().replace(/\s+/g, '.')}@example.com`,
                avatar: member.name ? member.name.split(' ').map(n => n[0]).join('').toUpperCase() : "TM",
                skills: member.skills || [],
                capacity: Math.floor((member.capacityHours || 40) / 4), // Convert hours to capacity points
                currentLoad: Math.floor((member.assignedHours || 0) / 4),
                velocity: member.velocity || 0,
                efficiency: member.efficiency || 0,
                availability: member.availability || (member.assignedHours < member.capacityHours ? "Available" : "Busy"),
                timezone: member.timezone || "PST",
                joinDate: member.joinDate || new Date().toISOString().split('T')[0],
                tasksCompleted: member.tasksCompleted || 0,
                averageTaskTime: member.averageTaskTime || "0 days",
                lastActive: member.lastActive || "Just now"
              };
            })
          : [];
        
        setTeamMembers(transformedMembers);
      } catch (err) {
        console.error('Error fetching team members:', err);
        setError(err.message || "Failed to fetch team members");
        // Keep empty array on error
        setTeamMembers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  // Show loading or error state
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-sandTan mx-auto mb-4"></div>
          <p className="text-sandTan">Loading team members...</p>
        </div>
      </div>
    );
  }

  if (error && teamMembers.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
          Error: {error}
        </div>
      </div>
    );
  }

  const teamMetrics = {
    totalMembers: teamMembers.length,
    averageVelocity: teamMembers.length > 0 
      ? (teamMembers.reduce((sum, m) => sum + (m.velocity || 0), 0) / teamMembers.length).toFixed(1)
      : 0,
    totalCapacity: teamMembers.reduce((sum, m) => sum + (m.capacity || 0), 0),
    utilizedCapacity: teamMembers.reduce((sum, m) => sum + (m.currentLoad || 0), 0),
    averageEfficiency: teamMembers.length > 0
      ? Math.round(teamMembers.reduce((sum, m) => sum + (m.efficiency || 0), 0) / teamMembers.length)
      : 0,
    totalTasksCompleted: teamMembers.reduce((sum, m) => sum + (m.tasksCompleted || 0), 0),
    averageTaskTime: teamMembers.length > 0 && teamMembers[0].averageTaskTime 
      ? teamMembers[0].averageTaskTime 
      : "2.5 days"
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-sandTan">Team Management</h1>
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
            <div 
              key={member.id} 
              onClick={() => setSelectedMemberId(member.id)}
              className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all"
            >
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
                {/* Edit/Delete Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => handleEditMember(e, member)}
                    className="p-2 bg-blue-500/20 hover:bg-blue-500/40 text-blue-400 rounded-lg transition-colors"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={(e) => handleDeleteMember(e, member.id)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors"
                    title="Delete"
                  >
                    🗑️
                  </button>
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
                <div 
                  key={member.id} 
                  onClick={() => setSelectedMemberId(member.id)}
                  className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all"
                >
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
                <div 
                  key={member.id} 
                  onClick={() => setSelectedMemberId(member.id)}
                  className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all"
                >
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

      {/* Team Member Detail Modal */}
      {selectedMemberId && (
        <TeamMemberDetailModal
          memberId={selectedMemberId}
          onClose={() => setSelectedMemberId(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this team member? This action cannot be undone.
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDelete(showDeleteConfirm)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-gray-200 rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto shadow-xl"
          >
            <h3 className="text-xl font-bold text-gray-800 mb-4">Edit Team Member</h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const workspaceId = localStorage.getItem("workspaceId");
                
                try {
                  const response = await fetch(LOGIN_ENDPOINTS.team.update(editingMember.id), {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                      "Workspace-ID": workspaceId,
                    },
                    body: JSON.stringify({
                      name: formData.get("name"),
                      email: formData.get("email"),
                      skills: formData.get("skills").split(",").map(s => s.trim()).filter(Boolean),
                      capacityHours: parseInt(formData.get("capacityHours")) || 40,
                    }),
                  });

                  if (response.ok) {
                    const updated = await response.json();
                    setTeamMembers(prev => prev.map(m => 
                      m.id === editingMember.id 
                        ? { ...m, name: updated.name || formData.get("name"), email: updated.email || formData.get("email"), skills: updated.skills || formData.get("skills").split(",").map(s => s.trim()) }
                        : m
                    ));
                    setEditingMember(null);
                  } else {
                    const data = await response.json();
                    alert(data.error || "Failed to update member");
                  }
                } catch (err) {
                  console.error("Update error:", err);
                  alert("Failed to update member");
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingMember.name}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  defaultValue={editingMember.email}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-primary focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma-separated)</label>
                <input
                  type="text"
                  name="skills"
                  defaultValue={editingMember.skills?.join(", ") || ""}
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (hours/week)</label>
                <input
                  type="number"
                  name="capacityHours"
                  defaultValue={editingMember.capacity * 4}
                  min="1"
                  max="60"
                  className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-800 focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="flex gap-4 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryDark transition-colors font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}






