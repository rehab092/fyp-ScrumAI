import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { LOGIN_ENDPOINTS, apiRequest } from "../../config/api";

export default function AdminDashboard({ workspaceInfo, onNavigateToTeam, onNavigateToAnalytics }) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [userStories, setUserStories] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    ready: 0,
    inProgress: 0,
    completed: 0,
    done: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const workspaceId = localStorage.getItem("workspaceId");
        
        console.log("Fetching projects for workspace:", workspaceId);
        
        // Fetch all projects for the workspace using the correct endpoint
        const projectsResponse = await fetch(LOGIN_ENDPOINTS.taskAllocation.getProjectsByWorkspace, {
          method: "GET",
          headers: { 
            "Content-Type": "application/json", 
            "Workspace-ID": workspaceId 
          },
        });

        console.log("Projects API Response Status:", projectsResponse.status);
        
        const projectsData = projectsResponse.ok ? await projectsResponse.json() : [];
        console.log("Raw projects data:", projectsData);
        
        let projectsArray = [];
        
        // Handle different response formats
        if (Array.isArray(projectsData)) {
          projectsArray = projectsData;
        } else if (projectsData.data && Array.isArray(projectsData.data)) {
          projectsArray = projectsData.data;
        } else if (projectsData.projects && Array.isArray(projectsData.projects)) {
          projectsArray = projectsData.projects;
        } else if (projectsData.backlogs && Array.isArray(projectsData.backlogs)) {
          projectsArray = projectsData.backlogs;
        }
        
        // Log first project structure to see field names
        if (projectsArray.length > 0) {
          console.log("First project structure:", projectsArray[0]);
          console.log("Available fields:", Object.keys(projectsArray[0]));
        }
        
        console.log("Processed projects array:", projectsArray);
        console.log("Total projects found:", projectsArray.length);
        
        setProjects(projectsArray);
        
        // Set first project as default if available
        if (projectsArray.length > 0) {
          const firstProjectId = projectsArray[0].id || projectsArray[0].backlog_id || projectsArray[0].project_id;
          console.log("Setting selected project to:", firstProjectId);
          setSelectedProjectId(firstProjectId);
        } else {
          console.warn("No projects available for this workspace");
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Fetch user stories when project changes
  useEffect(() => {
    const fetchUserStories = async () => {
      if (!selectedProjectId) return;
      
      try {
        const workspaceId = localStorage.getItem("workspaceId");
        
        console.log("Fetching project stats for project:", selectedProjectId);
        
        // Fetch project stats using the new analytics endpoint
        const statsResponse = await fetch(
          LOGIN_ENDPOINTS.taskAllocation.getProjectStats(selectedProjectId),
          {
            method: "GET",
            headers: { 
              "Content-Type": "application/json", 
              "Workspace-ID": workspaceId 
            },
          }
        );

        const statsData = statsResponse.ok ? await statsResponse.json() : { data: {} };
        console.log("Project stats response:", statsData);
        
        if (statsData.success && statsData.data) {
          const data = statsData.data;
          console.log("Setting stats from API:", data);
          setStats({
            total: data.total || 0,
            ready: data.ready || 0,
            inProgress: data.in_progress || 0,
            completed: data.completed || 0,
            done: data.done || 0
          });
        }
      } catch (err) {
        console.error('Error fetching project stats:', err);
        setStats({
          total: 0,
          ready: 0,
          inProgress: 0,
          completed: 0,
          done: 0
        });
      }
    };

    fetchUserStories();
  }, [selectedProjectId]);

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
          <p className="text-white/70 text-sm mt-1">Project Progress Overview</p>
        </div>
      </motion.div>

      {/* Project Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="mb-8"
      >
        <label className="block text-textPrimary font-semibold mb-3">Select Project</label>
        <select
          value={selectedProjectId || ""}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-full px-4 py-3 border-2 border-primary rounded-xl bg-white text-textPrimary font-medium focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">
            {projects.length === 0 ? "Loading projects..." : "Select a project"}
          </option>
          {projects.map((project) => {
            const projectId = project.id || project.backlog_id || project.project_id;
            const projectName = project.name || project.title || project.project_name || project.backlog_name || `Project ${projectId}`;
            return (
              <option key={projectId} value={projectId}>
                {projectName}
              </option>
            );
          })}
        </select>
      </motion.div>

      {/* Empty State or Content */}
      {projects.length === 0 && !loading ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-8 text-center"
        >
          <p className="text-yellow-800 font-semibold text-lg mb-2">📦 No Projects Found</p>
          <p className="text-yellow-700">Please create a project first to see project progress.</p>
        </motion.div>
      ) : null}

      {/* Project Stats */}
      {selectedProjectId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8"
        >
          <div className="bg-white border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
              <div className="text-3xl font-bold text-primary">{stats.total}</div>
            </div>
            <h3 className="text-textSecondary text-sm font-medium">Total Stories</h3>
          </div>

          <div className="bg-white border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
              <div className="text-3xl font-bold text-blue-600">{stats.inProgress}</div>
            </div>
            <h3 className="text-textSecondary text-sm font-medium">In Progress</h3>
          </div>

          <div className="bg-white border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
              <div className="text-3xl font-bold text-purple-600">{stats.ready}</div>
            </div>
            <h3 className="text-textSecondary text-sm font-medium">Ready</h3>
          </div>

          <div className="bg-white border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500/20 to-yellow-500/10 rounded-xl flex items-center justify-center">
                <span className="text-2xl">✔️</span>
              </div>
              <div className="text-3xl font-bold text-yellow-600">{stats.completed}</div>
            </div>
            <h3 className="text-textSecondary text-sm font-medium">Completed</h3>
          </div>

          <div className="bg-white border border-border rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-xl flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <div className="text-3xl font-bold text-green-600">{stats.done}</div>
            </div>
            <h3 className="text-textSecondary text-sm font-medium">Done</h3>
          </div>
        </motion.div>
      )}

      {/* Project Status Pie Chart */}
      {selectedProjectId && stats.total > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white border border-border rounded-2xl p-6 shadow-lg"
        >
          <h2 className="text-xl font-bold text-textPrimary mb-6">Story Status Distribution</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Pie Chart */}
            <div className="flex justify-center">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: "Ready", value: stats.ready, fill: "#A855F7" },
                      { name: "In Progress", value: stats.inProgress, fill: "#3B82F6" },
                      { name: "Completed", value: stats.completed, fill: "#FBBF24" },
                      { name: "Done", value: stats.done, fill: "#10B981" }
                    ].filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#A855F7" />
                    <Cell fill="#3B82F6" />
                    <Cell fill="#FBBF24" />
                    <Cell fill="#10B981" />
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} items`, 'Count']}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Stats Summary */}
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-purple-600 rounded"></div>
                  <div className="flex-1">
                    <p className="text-sm text-textSecondary">Ready</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.ready}</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-blue-600 rounded"></div>
                  <div className="flex-1">
                    <p className="text-sm text-textSecondary">In Progress</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-yellow-600 rounded"></div>
                  <div className="flex-1">
                    <p className="text-sm text-textSecondary">Completed</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.completed}</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-600 rounded"></div>
                  <div className="flex-1">
                    <p className="text-sm text-textSecondary">Done</p>
                    <p className="text-2xl font-bold text-green-600">{stats.done}</p>
                  </div>
                </div>
              </div>

              {/* Completion Rate */}
              <div className="bg-gradient-to-r from-primaryDark to-primary rounded-xl p-4 text-white mt-4">
                <p className="text-sm font-medium opacity-90">Overall Completion Rate</p>
                <p className="text-3xl font-bold">{Math.round(((stats.completed + stats.done) / stats.total) * 100)}%</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty State - No Stories */}
      {selectedProjectId && stats.total === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-8 text-center"
        >
          <p className="text-gray-800 font-semibold text-lg mb-2">📭 No User Stories</p>
          <p className="text-gray-700">This project doesn't have any user stories yet.</p>
        </motion.div>
      )}
    </div>
  );
}

