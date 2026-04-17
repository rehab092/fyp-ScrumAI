import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "../common/EmptyState";
import { LOGIN_ENDPOINTS, apiRequest } from "../../config/api";

export default function TeamMemberDashboard() {
  const [projects, setProjects] = useState([]);
  const [userStories, setUserStories] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedStoryId, setSelectedStoryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch user stories when project is selected
  useEffect(() => {
    if (selectedProjectId) {
      fetchUserStories(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const workspaceId = localStorage.getItem("workspaceId");
      console.log(" Team Member Dashboard - Fetching projects for workspace:", workspaceId);

      if (!workspaceId) {
        setError("Workspace ID not found. Please log in again.");
        setLoading(false);
        return;
      }

      // Get product owners for this workspace
      console.log("🔍 Fetching product owners...");
      const ownersResponse = await apiRequest(LOGIN_ENDPOINTS.management.getProductOwners);
      console.log("📋 Full Product Owners response:", ownersResponse);
      
      // Handle direct array response (most likely case)
      let ownersList = [];
      if (Array.isArray(ownersResponse)) {
        ownersList = ownersResponse;
        console.log("✅ Response is direct array");
      } else if (ownersResponse && Array.isArray(ownersResponse.productOwners)) {
        ownersList = ownersResponse.productOwners;
        console.log("✅ Response has .productOwners array");
      } else if (ownersResponse && Array.isArray(ownersResponse.data)) {
        ownersList = ownersResponse.data;
        console.log("✅ Response has .data array");
      } else if (ownersResponse && Array.isArray(ownersResponse.results)) {
        ownersList = ownersResponse.results;
        console.log("✅ Response has .results array");
      } else if (ownersResponse && Array.isArray(ownersResponse.objects)) {
        ownersList = ownersResponse.objects;
        console.log("✅ Response has .objects array");
      }
      
      console.log("✅ Parsed owners list:", ownersList.length, "owners");
      console.log("📋 Owners data:", ownersList);

      if (ownersList.length === 0) {
        console.warn("⚠️ No product owners found");
        setError("No product owners found in your workspace. Please contact your admin.");
        setProjects([]);
        setLoading(false);
        return;
      }

      // Get projects for each owner in workspace
      console.log("🔄 Fetching projects for", ownersList.length, "owner(s)...");
      const allProjects = [];
      for (const owner of ownersList) {
        const ownerId = owner.id || owner.user_id || owner.user;
        console.log("📦 Fetching projects for owner:", ownerId, "owner data:", owner);
        
        if (ownerId) {
          try {
            const projectsResponse = await apiRequest(
              LOGIN_ENDPOINTS.projects.getByOwner(ownerId)
            );
            console.log("📋 Projects for owner", ownerId, ":", projectsResponse);
            
            let projectsList = [];
            if (Array.isArray(projectsResponse)) {
              projectsList = projectsResponse;
            } else if (projectsResponse.data && Array.isArray(projectsResponse.data)) {
              projectsList = projectsResponse.data;
            } else if (projectsResponse.projects && Array.isArray(projectsResponse.projects)) {
              projectsList = projectsResponse.projects;
            }
            
            console.log("✅ Found", projectsList.length, "projects for owner", ownerId);
            allProjects.push(...projectsList);
          } catch (err) {
            console.warn("⚠️ Error fetching projects for owner", ownerId, err);
          }
        }
      }

      // Remove duplicates
      const uniqueProjects = Array.from(
        new Map(allProjects.map(p => [p.id || p.project_id, p])).values()
      );

      console.log("✅ Total workspace projects:", uniqueProjects.length);
      console.log("📋 Projects:", uniqueProjects);
      
      if (uniqueProjects.length === 0) {
        setError("No projects found in your workspace. Check with your Product Owner.");
        setProjects([]);
        setLoading(false);
        return;
      }

      setProjects(uniqueProjects);

      if (uniqueProjects.length > 0) {
        const firstProjectId = uniqueProjects[0].id || uniqueProjects[0].project_id;
        setSelectedProjectId(parseInt(firstProjectId));
      }
      setLoading(false);
    } catch (err) {
      console.error("❌ Error fetching projects:", err);
      setError(err.message || "Failed to load projects. Check console for details.");
      setLoading(false);
    }
  };

  const fetchUserStories = async (projectId) => {
    try {
      const response = await apiRequest(
        LOGIN_ENDPOINTS.projects.getUserStoryByProjectId(projectId)
      );
      const stories = response.data || response || [];
      setUserStories(Array.isArray(stories) ? stories : []);
    } catch (err) {
      console.error("Error fetching stories:", err);
      setUserStories([]);
    }
  };

  const selectedProject = useMemo(
    () =>
      projects.find(
        (p) =>
          parseInt(p.id || p.project_id) === selectedProjectId
      ),
    [projects, selectedProjectId]
  );

  const selectedStory = useMemo(
    () => userStories.find((s) => s.id === selectedStoryId),
    [userStories, selectedStoryId]
  );

  // Calculate statistics
  const totalStories = userStories.length || 0;
  const readyStories =
    userStories.filter((s) => s.status === "Ready").length || 0;
  const inProgressStories =
    userStories.filter((s) => s.status === "In Progress").length || 0;
  const completedStories =
    userStories.filter((s) => s.status === "Completed").length || 0;

  // If no projects, show empty state
  if (projects.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-textPrimary mb-8"></h1>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 text-red-700"
            >
              {error}
            </motion.div>
          )}
          <EmptyState
            icon="📦"
            title="No Projects Found"
            description="No projects are available in your workspace. Contact your Product Owner to create projects."
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-textSecondary mt-4">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background px-6 pb-6 pt-2"
    >
      <div className="max-w-6xl mx-auto">
        {/* Error Messages */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 text-red-700"
          >
            {error}
          </motion.div>
        )}

        {/* Project Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-textPrimary mb-2">
            Select Project
          </label>
          <select
            value={selectedProjectId || ""}
            onChange={(e) => {
              setSelectedProjectId(parseInt(e.target.value) || null);
              setSelectedStoryId(null);
            }}
            className="w-full max-w-md px-4 py-2 bg-white border border-borderColor rounded-lg text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">-- Select a project --</option>
            {projects.map((p) => (
              <option key={p.id || p.project_id} value={p.id || p.project_id}>
                {p.project_name || p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Project Details Card */}
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl border border-slate-600 p-10 mb-8 shadow-lg"
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
                  <p className="text-3xl md:text-4xl font-bold text-white leading-tight truncate">
                    {selectedProject.project_name || selectedProject.name}
                  </p>
                </div>

                <span
                  className={`inline-block mt-4 px-4 py-2 rounded-full text-sm font-semibold w-fit ${
                    selectedProject.status === "Active"
                      ? "bg-green-100 text-green-800"
                      : selectedProject.status === "Planning"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {selectedProject.status || "Active"}
                </span>
              </div>

              <div className="flex flex-col items-start md:items-end gap-2 shrink-0 self-start md:self-auto md:mt-1">
                <p className="text-xs font-semibold text-slate-300 uppercase tracking-widest">Stories</p>
                <p className="text-xl font-bold text-white">{totalStories}</p>
              </div>
            </div>
            {selectedProject.project_description && (
              <p className="mt-8 text-slate-200 border-t border-slate-600 pt-6 text-base leading-relaxed">
                {selectedProject.project_description}
              </p>
            )}
          </motion.div>
        )}

        {/* User Stories Section */}
        {selectedProject && (
          <div className="bg-white rounded-lg border border-borderColor overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-borderColor">
              <div>
                <h2 className="text-xl font-bold text-textPrimary">
                  User Stories
                </h2>
                <div className="flex gap-6 mt-2 text-sm">
                  <span className="text-textSecondary">
                    <span className="font-semibold text-textPrimary">
                      {totalStories}
                    </span>{" "}
                    Total
                  </span>
                  <span className="text-blue-600">
                    <span className="font-semibold">{readyStories}</span> Ready
                  </span>
                  <span className="text-orange-600">
                    <span className="font-semibold">{inProgressStories}</span> In
                    Progress
                  </span>
                  <span className="text-green-600">
                    <span className="font-semibold">{completedStories}</span>{" "}
                    Completed
                  </span>
                </div>
              </div>
            </div>

            {/* Stories Table */}
            {userStories && userStories.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-borderColor bg-gray-50">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-textPrimary w-8"></th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-textPrimary">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-textPrimary">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-textPrimary">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-textPrimary">
                        Points
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {userStories.map((story) => (
                        <React.Fragment key={story.id}>
                          <motion.tr
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="border-b border-borderColor hover:bg-gray-50 transition cursor-pointer"
                            onClick={() =>
                              setSelectedStoryId(
                                selectedStoryId === story.id ? null : story.id
                              )
                            }
                          >
                            <td className="px-6 py-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedStoryId(
                                    selectedStoryId === story.id ? null : story.id
                                  );
                                }}
                                className="text-primary hover:bg-primary hover:text-white rounded-full w-6 h-6 flex items-center justify-center transition"
                              >
                                {selectedStoryId === story.id ? "−" : "+"}
                              </button>
                            </td>
                            <td className="px-6 py-4 text-textPrimary font-medium">
                              {story.goal || story.title || "Untitled"}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                  story.priority === "High"
                                    ? "bg-red-100 text-red-700"
                                    : story.priority === "Medium"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {story.priority || "Medium"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                  story.status === "Ready"
                                    ? "bg-blue-100 text-blue-700"
                                    : story.status === "In Progress"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {story.status || "Ready"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-textPrimary font-semibold">
                              {story.story_points || 0}
                            </td>
                          </motion.tr>

                          {/* Expandable Details Row */}
                          {selectedStoryId === story.id && (
                            <motion.tr
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-blue-50 border-b-2 border-primary"
                            >
                              <td colSpan="5" className="px-6 py-4">
                                <div className="space-y-4">
                                  <div>
                                    <h3 className="text-lg font-bold text-textPrimary mb-4">
                                      Story Details
                                    </h3>
                                    <div className="grid grid-cols-2 gap-6">
                                      <div>
                                        <p className="text-sm text-textSecondary mb-1">
                                          Title
                                        </p>
                                        <p className="text-md font-semibold text-textPrimary">
                                          {story.goal ||
                                            story.title ||
                                            "Untitled"}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-textSecondary mb-1">
                                          Story Points
                                        </p>
                                        <p className="text-md font-semibold text-textPrimary">
                                          {story.story_points || 0}
                                        </p>
                                      </div>
                                      <div className="col-span-2">
                                        <p className="text-sm text-textSecondary mb-1">
                                          Description
                                        </p>
                                        <p className="text-textPrimary">
                                          {story.benefit ||
                                            "No description provided"}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-textSecondary mb-1">
                                          Role
                                        </p>
                                        <p className="text-textPrimary">
                                          {story.role || "-"}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-textSecondary mb-1">
                                          Status
                                        </p>
                                        <p className="text-textPrimary">
                                          {story.status || "Ready"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Tasks/Subtasks Section */}
                                  {story.tasks && story.tasks.length > 0 ? (
                                    <div className="border-t border-blue-200 pt-4">
                                      <h4 className="text-md font-bold text-textPrimary mb-3">
                                        Decomposed Tasks (
                                        {story.task_count || story.tasks.length})
                                      </h4>
                                      <div className="space-y-3">
                                        {story.tasks.map((task, idx) => (
                                          <div
                                            key={task.id || idx}
                                            className="bg-white rounded-lg p-3 border border-blue-200"
                                          >
                                            <div className="flex justify-between items-start mb-2">
                                              <p className="text-sm font-semibold text-textPrimary">
                                                {task.tasks}
                                              </p>
                                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                {task.estimated_hours || 0}
                                                h
                                              </span>
                                            </div>
                                            {task.subtasks && (
                                              <p className="text-xs text-textSecondary mb-2">
                                                Subtasks: {task.subtasks}
                                              </p>
                                            )}
                                            {task.skills_required && (
                                              <p className="text-xs text-textSecondary">
                                                Skills: {task.skills_required}
                                              </p>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="border-t border-blue-200 pt-4">
                                      <p className="text-sm text-textSecondary italic">
                                        No tasks decomposed yet
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </motion.tr>
                          )}
                        </React.Fragment>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <p className="text-textSecondary mb-4">No user stories yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
