import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LOGIN_ENDPOINTS, apiRequest } from "../../config/api";

export default function AdminDashboard({ workspaceInfo, onNavigateToTeam }) {
  const [stats, setStats] = useState({
    totalMembers: 0,
    scrumMasters: 0,
    productOwners: 0,
    teamMembers: 0,
    available: 0,
    highLoad: 0,
    overloaded: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const workspaceId = localStorage.getItem("workspaceId");
        
        // Fetch all data in parallel: team members, scrum masters, and product owners
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

        // Parse responses
        const teamData = teamResponse.ok ? await teamResponse.json() : [];
        const scrumMastersData = scrumMastersResponse.ok ? await scrumMastersResponse.json() : {};
        const productOwnersData = productOwnersResponse.ok ? await productOwnersResponse.json() : {};

        // Extract arrays (handle both direct array and nested object formats)
        const membersArray = Array.isArray(teamData) ? teamData : (teamData.data || teamData.members || []);
        const scrumMastersArray = scrumMastersData.scrumMasters || scrumMastersData.data || [];
        const productOwnersArray = productOwnersData.productOwners || productOwnersData.data || [];

        // Convert to arrays if they're objects
        const smArray = Array.isArray(scrumMastersArray) ? scrumMastersArray : Object.values(scrumMastersArray || {});
        const poArray = Array.isArray(productOwnersArray) ? productOwnersArray : Object.values(productOwnersArray || {});

        // Calculate stats
        const teamMembers = membersArray.length; // Developers
        const scrumMasters = smArray.length;
        const productOwners = poArray.length;

        // Calculate status counts from developers
        const available = membersArray.filter(m => m.status === 'available' || m.status === 'active').length;
        const highLoad = membersArray.filter(m => m.status === 'high_load' || m.status === 'high').length;
        const overloaded = membersArray.filter(m => m.status === 'overloaded').length;

        setStats({
          totalMembers: teamMembers + scrumMasters + productOwners,
          scrumMasters,
          productOwners,
          teamMembers,
          available,
          highLoad,
          overloaded
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="bg-gradient-to-r from-primaryDark to-primary rounded-2xl p-8 text-white shadow-xl">
          <h1 className="text-3xl font-bold mb-2">
            Welcome, {workspaceInfo?.adminName || "Admin"}
          </h1>
          <p className="text-white/80 text-lg">
            {workspaceInfo?.workspaceName || "Workspace"} • {workspaceInfo?.companyName || "Company"}
          </p>
          <p className="text-white/70 text-sm mt-1">Workspace Admin</p>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        <div className="bg-white border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
            <div className="text-3xl font-bold text-primary">{loading ? "..." : stats.totalMembers}</div>
          </div>
          <h3 className="text-textSecondary text-sm font-medium">Total Team Members</h3>
        </div>

        <div className="bg-white border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="text-3xl font-bold text-secondary">{loading ? "..." : stats.scrumMasters}</div>
          </div>
          <h3 className="text-textSecondary text-sm font-medium">Scrum Masters</h3>
        </div>

        <div className="bg-white border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-accent/20 to-accent/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <div className="text-3xl font-bold text-accent">{loading ? "..." : stats.productOwners}</div>
          </div>
          <h3 className="text-textSecondary text-sm font-medium">Product Owners</h3>
        </div>

        <div className="bg-white border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-success/20 to-success/10 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💻</span>
            </div>
            <div className="text-3xl font-bold text-success">{loading ? "..." : stats.teamMembers}</div>
          </div>
          <h3 className="text-textSecondary text-sm font-medium">Developers</h3>
        </div>
      </motion.div>

      {/* Team Health Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-white border border-border rounded-2xl p-6 shadow-lg mb-8"
      >
        <h2 className="text-xl font-bold text-textPrimary mb-6">Team Health Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-600 font-semibold">Available</span>
              <span className="text-2xl font-bold text-green-600">{loading ? "..." : stats.available}</span>
            </div>
            <p className="text-textMuted text-xs">Members ready for tasks</p>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-yellow-600 font-semibold">High Load</span>
              <span className="text-2xl font-bold text-yellow-600">{loading ? "..." : stats.highLoad}</span>
            </div>
            <p className="text-textMuted text-xs">Members at capacity</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-600 font-semibold">Overloaded</span>
              <span className="text-2xl font-bold text-red-600">{loading ? "..." : stats.overloaded}</span>
            </div>
            <p className="text-textMuted text-xs">Members need relief</p>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="bg-gradient-to-br from-surface to-surfaceLight border border-border rounded-2xl p-6 shadow-lg"
      >
        <h2 className="text-xl font-bold text-textPrimary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => onNavigateToTeam && onNavigateToTeam()}
            className="bg-gradient-to-r from-primary to-primaryDark text-white px-6 py-4 rounded-xl hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2"
          >
            <span>➕</span>
            <span>Add Team Member</span>
          </button>
          <button 
            onClick={() => onNavigateToTeam && onNavigateToTeam()}
            className="bg-gradient-to-r from-secondary to-secondaryDark text-white px-6 py-4 rounded-xl hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2"
          >
            <span>🎯</span>
            <span>Add Scrum Master</span>
          </button>
          <button 
            onClick={() => onNavigateToTeam && onNavigateToTeam()}
            className="bg-gradient-to-r from-accent to-accentDark text-white px-6 py-4 rounded-xl hover:shadow-lg transition-all font-medium flex items-center justify-center gap-2"
          >
            <span>📋</span>
            <span>Add Product Owner</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

