import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LOGIN_ENDPOINTS, apiRequest } from "../../config/api";

export default function TeamOverview() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

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
              const memberId = member.id || member.pk || member.member_id || member.team_member_id || member.user_id;
              
              return {
                id: memberId || index + 1,
                name: member.name || "Unknown",
                email: member.email || `${member.name?.toLowerCase().replace(/\s+/g, '.')}@example.com`,
                avatar: member.name ? member.name.split(' ').map(n => n[0]).join('').toUpperCase() : "TM",
                skills: member.skills || [],
                status: member.status || "available",
                capacityHours: member.capacityHours || 40,
                assignedHours: member.assignedHours || 0,
                availableHours: (member.capacityHours || 40) - (member.assignedHours || 0),
                experience: member.Experience || 0,
                pastProjects: member.Past_Projects || ""
              };
            })
          : [];
        
        setTeamMembers(transformedMembers);
      } catch (err) {
        console.error('Error fetching team members:', err);
        setError(err.message || "Failed to fetch team members");
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
    totalMembers: teamMembers.length
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-sandTan">Team Overview</h1>
        <div className="text-sm text-textMuted">{teamMembers.length} Team Members</div>
      </div>
      {/* Team Members List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="space-y-4"
      >
        {teamMembers.map((member) => (
          <div 
            key={member.id} 
            className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6 cursor-pointer hover:shadow-lg transition-all"
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 bg-sandTan text-nightBlue rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                {member.avatar}
              </div>

              {/* Member Info */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-sandTan">{member.name}</h3>
                <p className="text-textMuted text-sm">{member.email}</p>
                
                <div className="flex items-center gap-3 mt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    member.status === 'available' 
                      ? 'bg-green-500/20 text-green-400'
                      : member.status === 'high_load'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {member.status.charAt(0).toUpperCase() + member.status.slice(1).replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Delete Button */}
              <button
                onClick={(e) => handleDeleteMember(e, member.id)}
                className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors flex-shrink-0"
                title="Delete"
              >
                🗑️
              </button>
            </div>

            {/* Member Details Grid */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Skills */}
              <div>
                <h4 className="text-xs font-semibold text-sandTan mb-2 uppercase">Skills</h4>
                <div className="flex flex-wrap gap-1">
                  {member.skills && member.skills.length > 0 ? (
                    member.skills.slice(0, 3).map((skill, idx) => (
                      <span key={idx} className="bg-sandTan/20 text-sandTan px-2 py-1 rounded text-xs">
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-textMuted text-xs">No skills</span>
                  )}
                </div>
              </div>

              {/* Workload Overview */}
              <div>
                <h4 className="text-xs font-semibold text-sandTan mb-2 uppercase">Workload</h4>
                <div className="space-y-2">
                  {/* Progress Bar */}
                  <div className="w-full bg-nightBlueShadow rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        member.assignedHours / member.capacityHours > 0.8 ? "bg-red-500" :
                        member.assignedHours / member.capacityHours > 0.6 ? "bg-yellow-500" : "bg-green-500"
                      }`}
                      style={{ width: `${(member.assignedHours / member.capacityHours) * 100}%` }}
                    />
                  </div>
                  {/* Hours Display */}
                  <div className="flex justify-between text-xs">
                    <span className="text-textMuted">
                      Assigned: <span className="text-textLight font-semibold">{member.assignedHours}/{member.capacityHours}h</span>
                    </span>
                    <span className="text-textMuted">
                      Available: <span className={`font-semibold ${member.availableHours > 0 ? 'text-green-400' : 'text-red-400'}`}>{member.availableHours}h</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Experience */}
              <div>
                <h4 className="text-xs font-semibold text-sandTan mb-2 uppercase">Experience</h4>
                <div className="text-lg font-bold text-textLight">{member.experience} <span className="text-xs text-textMuted">months</span></div>
              </div>

              {/* Past Projects */}
              <div>
                <h4 className="text-xs font-semibold text-sandTan mb-2 uppercase">Projects</h4>
                <div className="text-textMuted text-xs line-clamp-2">
                  {member.pastProjects || "No projects listed"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

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
    </div>
  );
}






