import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LOGIN_ENDPOINTS, apiRequest } from "../../config/api";

export default function TeamMemberDetailModal({ memberId, onClose }) {
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMemberDetails = async () => {
      if (!memberId) return;
      
      try {
        setLoading(true);
        setError("");
        
        // Ensure memberId is a string/number (not an object)
        const id = typeof memberId === 'object' ? (memberId.id || memberId.pk || memberId.member_id) : memberId;
        
        const endpoint = LOGIN_ENDPOINTS.team.getById(id);
        console.log('Fetching team member details from:', endpoint);
        console.log('Member ID:', id);
        console.log('Original memberId:', memberId);
        
        const response = await apiRequest(endpoint, {
          method: "GET",
        });
        
        console.log('Team member details response:', response);
        
        // Handle API response structure: { success: true, data: {...} }
        const memberData = response.data || response;
        setMember(memberData);
      } catch (err) {
        console.error('Error fetching team member details:', err);
        console.error('Endpoint used:', LOGIN_ENDPOINTS.team.getById(memberId));
        setError(err.message || "Failed to fetch team member details");
      } finally {
        setLoading(false);
      }
    };

    fetchMemberDetails();
  }, [memberId]);

  if (!memberId) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 p-6 text-white border-b border-slate-600/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span>👤</span>
                Team Member Details
              </h2>
              <p className="text-white/80 text-sm mt-1">
                {loading ? "Loading details..." : member?.name || "Member Information"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-all flex items-center justify-center"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 bg-white max-h-[calc(90vh-120px)] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-slate-700 mb-4"></div>
              <p className="text-slate-600">Loading team member details...</p>
            </div>
          ) : error ? (
            <div className="bg-red-500/20 border border-red-500/50 text-red-700 px-4 py-3 rounded-lg">
              Error: {error}
            </div>
          ) : member ? (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span>📋</span>
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-600">ID</label>
                    <p className="text-slate-900 font-medium mt-1">{member.id || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-600">Name</label>
                    <p className="text-slate-900 font-medium mt-1">{member.name || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-600">Role</label>
                    <p className="text-slate-900 font-medium mt-1">{member.role || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-600">Status</label>
                    <p className="text-slate-900 font-medium mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        member.status === 'active' || member.status === 'available'
                          ? "bg-green-500/20 text-green-700" 
                          : member.status === 'busy' || member.status === 'unavailable'
                          ? "bg-red-500/20 text-red-700"
                          : "bg-gray-500/20 text-gray-700"
                      }`}>
                        {member.status ? member.status.charAt(0).toUpperCase() + member.status.slice(1) : "Unknown"}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Capacity & Workload */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span>⏱️</span>
                  Capacity & Workload
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold text-slate-600">Capacity Hours</label>
                    <p className="text-slate-900 font-medium mt-1">{member.capacityHours || 0} hours/week</p>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-600">Assigned Hours</label>
                    <p className="text-slate-900 font-medium mt-1">{member.assignedHours || 0} hours</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-semibold text-slate-600 mb-2 block">Utilization</label>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${
                          ((member.assignedHours || 0) / (member.capacityHours || 1)) * 100 >= 100
                            ? "bg-red-500"
                            : ((member.assignedHours || 0) / (member.capacityHours || 1)) * 100 >= 80
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.min(((member.assignedHours || 0) / (member.capacityHours || 1)) * 100, 100)}%`
                        }}
                      />
                    </div>
                    <p className="text-slate-600 text-sm mt-1">
                      {Math.round(((member.assignedHours || 0) / (member.capacityHours || 1)) * 100)}% utilized
                    </p>
                  </div>
                </div>
              </div>

              {/* Skills */}
              {member.skills && member.skills.length > 0 && (
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span>🛠️</span>
                    Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {member.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-slate-200 text-slate-800 rounded-lg text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-lg hover:shadow-lg transition-all font-medium"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

