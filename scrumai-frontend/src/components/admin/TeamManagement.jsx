import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LOGIN_ENDPOINTS } from "../../config/api";
import TeamMemberForm from "../scrum-master/TeamMemberForm";
import ScrumMasterForm from "./ScrumMasterForm";
import ProductOwnerForm from "./ProductOwnerForm";

export default function TeamManagement({ workspaceInfo }) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [showAddTeamMember, setShowAddTeamMember] = useState(false);
  const [showAddScrumMaster, setShowAddScrumMaster] = useState(false);
  const [showAddProductOwner, setShowAddProductOwner] = useState(false);
  const [showEditTeamMember, setShowEditTeamMember] = useState(false);
  const [showEditScrumMaster, setShowEditScrumMaster] = useState(false);
  const [showEditProductOwner, setShowEditProductOwner] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingCredentials, setSendingCredentials] = useState(null);
  const [deletingMember, setDeletingMember] = useState(null);

  const filters = [
    { id: "all", label: "All Members", icon: "👥" },
    { id: "developers", label: "Developers", icon: "💻" },
    { id: "scrumMasters", label: "Scrum Masters", icon: "🎯" },
    { id: "productOwners", label: "Product Owners", icon: "📋" }
  ];

  // Fetch members based on active filter
  const fetchMembers = async (filter = activeFilter) => {
    try {
      setLoading(true);
      const workspaceId = localStorage.getItem('workspaceId');
      
      if (!workspaceId) {
        console.error('No workspace ID found');
        setMembers([]);
        return;
      }

      let allMembers = [];

      // Fetch based on filter
      if (filter === "all") {
        // Fetch all three types in parallel
        const [teamResponse, scrumMastersResponse, productOwnersResponse] = await Promise.all([
          fetch(LOGIN_ENDPOINTS.team.getAll, {
            method: "GET",
            headers: { "Content-Type": "application/json", "Workspace-ID": workspaceId },
          }),
          fetch(LOGIN_ENDPOINTS.management.getScrumMasters, {
            method: "GET",
            headers: { "Content-Type": "application/json", "Workspace-ID": workspaceId },
          }),
          fetch(LOGIN_ENDPOINTS.management.getProductOwners, {
            method: "GET",
            headers: { "Content-Type": "application/json", "Workspace-ID": workspaceId },
          }),
        ]);

        const teamData = teamResponse.ok ? await teamResponse.json() : {};
        const scrumMastersData = scrumMastersResponse.ok ? await scrumMastersResponse.json() : {};
        const productOwnersData = productOwnersResponse.ok ? await productOwnersResponse.json() : {};

        // Extract arrays from response objects (handles both direct array and nested object formats)
        const teamArray = Array.isArray(teamData) ? teamData : (teamData.data || teamData.members || teamData.team || []);
        const scrumMastersArray = Array.isArray(scrumMastersData) ? scrumMastersData : (scrumMastersData.scrumMasters || scrumMastersData.data || []);
        const productOwnersArray = Array.isArray(productOwnersData) ? productOwnersData : (productOwnersData.productOwners || productOwnersData.data || []);

        // Ensure arrays are actually arrays
        const developers = (Array.isArray(teamArray) ? teamArray : []).map(m => ({ ...m, role: m.role || "DEVELOPER", memberType: "developer" }));
        const scrumMasters = (Array.isArray(scrumMastersArray) ? scrumMastersArray : Object.values(scrumMastersArray || {})).map(m => ({ ...m, role: "SCRUM_MASTER", memberType: "scrumMaster" }));
        const productOwners = (Array.isArray(productOwnersArray) ? productOwnersArray : Object.values(productOwnersArray || {})).map(m => ({ ...m, role: "PRODUCT_OWNER", memberType: "productOwner" }));

        allMembers = [...developers, ...scrumMasters, ...productOwners];
      } 
      else if (filter === "developers") {
        // Fetch only developers
        const response = await fetch(LOGIN_ENDPOINTS.team.getAll, {
          method: "GET",
          headers: { "Content-Type": "application/json", "Workspace-ID": workspaceId },
        });
        const data = response.ok ? await response.json() : [];
        allMembers = (Array.isArray(data) ? data : []).map(m => ({ ...m, role: m.role || "DEVELOPER", memberType: "developer" }));
      } 
      else if (filter === "scrumMasters") {
        // Fetch only Scrum Masters from backend
        console.log("Fetching Scrum Masters from:", LOGIN_ENDPOINTS.management.getScrumMasters);
        console.log("Workspace ID:", workspaceId);
        const response = await fetch(LOGIN_ENDPOINTS.management.getScrumMasters, {
          method: "GET",
          headers: { "Content-Type": "application/json", "Workspace-ID": workspaceId },
        });
        console.log("Scrum Masters Response status:", response.status);
        const responseData = response.ok ? await response.json() : { scrumMasters: [] };
        console.log("Scrum Masters Data:", responseData);
        // Backend returns { success: true, scrumMasters: [...] }
        const data = responseData.scrumMasters || responseData.data || responseData;
        const dataArray = Array.isArray(data) ? data : Object.values(data);
        allMembers = dataArray.map(m => ({ ...m, role: "SCRUM_MASTER", memberType: "scrumMaster" }));
      } 
      else if (filter === "productOwners") {
        // Fetch only Product Owners from backend
        console.log("Fetching Product Owners from:", LOGIN_ENDPOINTS.management.getProductOwners);
        const response = await fetch(LOGIN_ENDPOINTS.management.getProductOwners, {
          method: "GET",
          headers: { "Content-Type": "application/json", "Workspace-ID": workspaceId },
        });
        const responseData = response.ok ? await response.json() : { productOwners: [] };
        console.log("Product Owners Data:", responseData);
        // Backend returns { success: true, productOwners: [...] }
        const data = responseData.productOwners || responseData.data || responseData;
        const dataArray = Array.isArray(data) ? data : Object.values(data);
        allMembers = dataArray.map(m => ({ ...m, role: "PRODUCT_OWNER", memberType: "productOwner" }));
      }
      setMembers(allMembers);
    } catch (err) {
      console.error('Error fetching members:', err);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchMembers("all");
  }, []);

  // Fetch when filter changes
  const handleFilterChange = (filterId) => {
    setActiveFilter(filterId);
    fetchMembers(filterId);
  };

  // Handle Edit Member
  const handleEditMember = (member) => {
    setEditingMember(member);
    if (member.memberType === "developer") {
      setShowEditTeamMember(true);
    } else if (member.memberType === "scrumMaster") {
      setShowEditScrumMaster(true);
    } else if (member.memberType === "productOwner") {
      setShowEditProductOwner(true);
    }
  };

  // Handle Delete Member
  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Are you sure you want to delete this team member?')) {
      return;
    }

    try {
      setDeletingMember(memberId);
      const workspaceId = localStorage.getItem('workspaceId');

      const response = await fetch(LOGIN_ENDPOINTS.team.delete(memberId), {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Workspace-ID": workspaceId,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to delete: ${response.status}`);
      }

      // Refresh the list
      fetchMembers();
    } catch (err) {
      console.error('Error deleting member:', err);
      alert(`Failed to delete member: ${err.message}`);
    } finally {
      setDeletingMember(null);
    }
  };

  const handleSendCredentials = async (memberId) => {
    // TODO: Implement send credentials endpoint when available
    alert("Send credentials functionality will be available soon!");
    setSendingCredentials(null);
  };

  // Format role for display
  const formatRole = (role) => {
    if (!role) return "Team Member";
    switch (role) {
      case "SCRUM_MASTER": return "Scrum Master";
      case "PRODUCT_OWNER": return "Product Owner";
      case "DEVELOPER": return "Developer";
      default: return role;
    }
  };
  const getStatusColor = (status) => {
    switch (status) {
      case "available":
      case "active":
        return "bg-green-500/20 text-green-700 border-green-500/30";
      case "high_load":
      case "high":
        return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30";
      case "overloaded":
        return "bg-red-500/20 text-red-700 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-700 border-gray-500/30";
    }
  };

  const getRoleIcon = (role) => {
    const roleLower = role?.toLowerCase() || '';
    if (roleLower.includes('scrum master') || roleLower.includes('scrummaster')) return "🎯";
    if (roleLower.includes('product owner') || roleLower.includes('productowner')) return "📋";
    return "💻";
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-textPrimary mb-2">Team Management</h1>
            <p className="text-textSecondary">
              Manage your team members, Scrum Masters, and Product Owners
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddTeamMember(true)}
              className="bg-gradient-to-r from-primary to-primaryDark text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-medium flex items-center gap-2"
            >
              <span>➕</span>
              <span>Add Team Member</span>
            </button>
            <button
              onClick={() => setShowAddScrumMaster(true)}
              className="bg-gradient-to-r from-secondary to-secondaryDark text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-medium flex items-center gap-2"
            >
              <span>🎯</span>
              <span>Add Scrum Master</span>
            </button>
            <button
              onClick={() => setShowAddProductOwner(true)}
              className="bg-gradient-to-r from-accent to-accentDark text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all font-medium flex items-center gap-2"
            >
              <span>📋</span>
              <span>Add Product Owner</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => handleFilterChange(filter.id)}
              className={`px-4 py-2 rounded-lg transition-all font-medium flex items-center gap-2 ${
                activeFilter === filter.id
                  ? "bg-gradient-to-r from-primary to-primaryDark text-white shadow-lg"
                  : "bg-white border border-border text-textSecondary hover:bg-surface"
              }`}
            >
              <span>{filter.icon}</span>
              <span>{filter.label}</span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Members Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="bg-white border border-border rounded-2xl shadow-lg overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="bg-gradient-to-r from-primaryDark to-primary text-white">
              <tr>
                <th className="px-3 py-3 text-left text-sm font-semibold w-[15%]">Name</th>
                <th className="px-3 py-3 text-left text-sm font-semibold w-[18%]">Email</th>
                <th className="px-3 py-3 text-left text-sm font-semibold w-[10%]">Role</th>
                <th className="px-3 py-3 text-left text-sm font-semibold w-[15%]">Skills</th>
                <th className="px-3 py-3 text-left text-sm font-semibold w-[10%]">Capacity</th>
                <th className="px-3 py-3 text-left text-sm font-semibold w-[10%]">Status</th>
                <th className="px-3 py-3 text-center text-sm font-semibold w-[22%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                      <p className="text-textMuted">Loading members...</p>
                    </div>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-textMuted">
                    No members found. Add your first team member!
                  </td>
                </tr>
              ) : (
                members.map((member, index) => (
                  <tr key={member.id || index} className="hover:bg-surface transition-colors">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                          member.role === "SCRUM_MASTER" ? "bg-gradient-to-r from-orange-500 to-orange-600" :
                          member.role === "PRODUCT_OWNER" ? "bg-gradient-to-r from-purple-500 to-purple-600" :
                          "bg-gradient-to-r from-primary to-secondary"
                        }`}>
                          {member.name?.split(' ').map(n => n[0]).join('').toUpperCase() || "M"}
                        </div>
                        <span className="font-medium text-textPrimary text-sm truncate">{member.name || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-textSecondary text-sm truncate">{member.email || "N/A"}</td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        member.role === "SCRUM_MASTER" ? "bg-orange-100 text-orange-700" :
                        member.role === "PRODUCT_OWNER" ? "bg-purple-100 text-purple-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {formatRole(member.role)}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(member.skills) && member.skills.length > 0 ? (
                          member.skills.slice(0, 2).map((skill, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-surface text-textSecondary rounded text-xs">
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-textMuted text-xs">-</span>
                        )}
                        {Array.isArray(member.skills) && member.skills.length > 2 && (
                          <span className="text-textMuted text-xs">+{member.skills.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-textSecondary text-sm">
                      {member.assignedHours || 0}/{member.capacityHours || 0}h
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(member.status)}`}>
                        {member.status || "active"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEditMember(member)}
                          className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium transition-all"
                          title="Edit"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          disabled={deletingMember === member.id}
                          className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition-all disabled:opacity-50"
                          title="Delete"
                        >
                          {deletingMember === member.id ? "..." : "🗑️ Del"}
                        </button>
                        <button
                          onClick={() => handleSendCredentials(member.id)}
                          disabled={sendingCredentials === member.id}
                          className="px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium transition-all disabled:opacity-50"
                          title="Send Credentials"
                        >
                          {sendingCredentials === member.id ? "..." : "📧"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modals */}
      {showAddTeamMember && (
        <TeamMemberForm
          onClose={() => {
            setShowAddTeamMember(false);
            setEditingMember(null);
          }}
          onSuccess={() => {
            setShowAddTeamMember(false);
            setEditingMember(null);
            fetchMembers();
          }}
          editMember={null}
        />
      )}

      {showEditTeamMember && editingMember && (
        <TeamMemberForm
          onClose={() => {
            setShowEditTeamMember(false);
            setEditingMember(null);
          }}
          onSuccess={() => {
            setShowEditTeamMember(false);
            setEditingMember(null);
            fetchMembers();
          }}
          editMember={editingMember}
        />
      )}

      {showAddScrumMaster && (
        <ScrumMasterForm
          onClose={() => setShowAddScrumMaster(false)}
          onSuccess={() => {
            setShowAddScrumMaster(false);
            fetchMembers();
          }}
          editMember={null}
        />
      )}

      {showEditScrumMaster && editingMember && (
        <ScrumMasterForm
          onClose={() => {
            setShowEditScrumMaster(false);
            setEditingMember(null);
          }}
          onSuccess={() => {
            setShowEditScrumMaster(false);
            setEditingMember(null);
            fetchMembers();
          }}
          editMember={editingMember}
        />
      )}

      {showAddProductOwner && (
        <ProductOwnerForm
          onClose={() => setShowAddProductOwner(false)}
          onSuccess={() => {
            setShowAddProductOwner(false);
            fetchMembers();
          }}
          editMember={null}
        />
      )}

      {showEditProductOwner && editingMember && (
        <ProductOwnerForm
          onClose={() => {
            setShowEditProductOwner(false);
            setEditingMember(null);
          }}
          onSuccess={() => {
            setShowEditProductOwner(false);
            setEditingMember(null);
            fetchMembers();
          }}
          editMember={editingMember}
        />
      )}
    </div>
  );
}