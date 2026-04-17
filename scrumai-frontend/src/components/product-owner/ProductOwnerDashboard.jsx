import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EmptyState from "../common/EmptyState";
import ProjectModal from "./ProjectModal";
import UserStoryModal from "./UserStoryModal";
import { LOGIN_ENDPOINTS, apiRequest } from "../../config/api";

export default function ProductOwnerDashboard({ onNavigateToBacklog }) {
  const [projects, setProjects] = useState([]);
  const [userStories, setUserStories] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedStoryId, setSelectedStoryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingStory, setAddingStory] = useState(false);
  
  // Modal states
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [editingStory, setEditingStory] = useState(null);

  // Get owner ID from localStorage (try both potential locations)
  const getOwnerId = () => {
    // First try the direct ownerId key
    let ownerId = localStorage.getItem("ownerId");
    if (ownerId) return ownerId;
    
    // If not found, try to get it from scrumai_user
    try {
      const user = JSON.parse(localStorage.getItem("scrumai_user") || "{}");
      ownerId = user.owner_id || user.id;
      if (ownerId) {
        // Save it directly for future access
        localStorage.setItem("ownerId", String(ownerId));
        return ownerId;
      }
    } catch (e) {
      console.error("Error parsing scrumai_user:", e);
    }
    
    return null;
  };

  const ownerId = getOwnerId();

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, [ownerId]);

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

      if (!ownerId) {
        setError("Owner ID not found. Please log in again.");
        setLoading(false);
        return;
      }

      const response = await apiRequest(
        LOGIN_ENDPOINTS.projects.getByOwner(ownerId)
      );
      const projectsList = response.data || response || [];
      setProjects(projectsList);

      if (projectsList.length > 0) {
        const firstProjectId = projectsList[0].id || projectsList[0].project_id;
        setSelectedProjectId(parseInt(firstProjectId));
      }
      setLoading(false);
    } catch (err) {
      setError(err.message || "Failed to load projects");
      setLoading(false);
    }
  };

  const fetchUserStories = async (projectId) => {
    try {
      const response = await apiRequest(
        LOGIN_ENDPOINTS.projects.getUserStoryByProjectId(projectId)
      );
      const stories = response.data || response || [];
      setUserStories(stories);
    } catch (err) {
      console.error("Error fetching stories:", err);
      setUserStories([]);
    }
  };

  const selectedProject = useMemo(() => 
    projects.find(p => parseInt(p.id || p.project_id) === selectedProjectId),
    [projects, selectedProjectId]
  );

  const selectedStory = useMemo(() =>
    userStories.find(s => s.id === selectedStoryId),
    [userStories, selectedStoryId]
  );

  // Calculate statistics
  const totalStories = userStories.length || 0;
  const readyStories = userStories.filter(s => s.status === 'Ready').length || 0;
  const inProgressStories = userStories.filter(s => s.status === 'In Progress').length || 0;
  const completedStories = userStories.filter(s => s.status === 'Completed').length || 0;

  const handleAddProject = () => {
    setProjectModalOpen(true);
  };

  const handleSaveProject = async (projectData) => {
    try {
      const response = await apiRequest(LOGIN_ENDPOINTS.projects.create, {
        method: "POST",
        body: JSON.stringify({
          ...projectData,
          owner_id: ownerId,
        }),
      });
      
      // Refresh projects list
      await fetchProjects();
      
      // Select the newly created project if response has id
      if (response.data && response.data.id) {
        setSelectedProjectId(response.data.id);
      }
      
      setProjectModalOpen(false);
    } catch (err) {
      setError(err.message || "Failed to create project");
    }
  };

  const handleAddStory = () => {
    // Navigate to Backlog page (Add User Stories)
    if (onNavigateToBacklog) {
      onNavigateToBacklog();
    }
  };

  const handleEditStory = (story) => {
    setEditingStory(story);
    setStoryModalOpen(true);
  };

  const handleSaveStory = async (storyData) => {
    try {
      setAddingStory(true);

      if (editingStory) {
        // Update existing story
        const response = await apiRequest(
          LOGIN_ENDPOINTS.userStories.update(editingStory.id),
          {
            method: "PUT",
            body: JSON.stringify(storyData),
          }
        );
        
        // Refresh stories from backend to get updated data including story_points
        await fetchUserStories(selectedProjectId);
      } else {
        // Create new story
        const response = await apiRequest(LOGIN_ENDPOINTS.userStories.create, {
          method: "POST",
          body: JSON.stringify({
            ...storyData,
            owner_id: ownerId,
            project_id: selectedProjectId,
          }),
        });

        // Refresh stories
        await fetchUserStories(selectedProjectId);
      }

      setStoryModalOpen(false);
      setEditingStory(null);
    } catch (err) {
      setError(err.message || "Failed to save story");
    } finally {
      setAddingStory(false);
    }
  };

  const handleDeleteStory = async (storyId) => {
    if (window.confirm("Delete this user story?")) {
      try {
        await apiRequest(LOGIN_ENDPOINTS.userStories.delete(storyId), {
          method: "DELETE",
        });

        // Remove from local state
        setUserStories(prev => prev.filter(s => s.id !== storyId));
        if (selectedStoryId === storyId) {
          setSelectedStoryId(null);
        }
      } catch (err) {
        setError(err.message || "Failed to delete story");
      }
    }
  };

  // If no projects, show empty state
  if (projects.length === 0) {
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
            title="No Project Found"
            description="Create your first project to start managing user stories."
            actionLabel="+ Create Project"
            onAction={handleAddProject}
          />
        </div>

        <ProjectModal
          isOpen={projectModalOpen}
          project={null}
          onClose={() => setProjectModalOpen(false)}
          onSave={handleSaveProject}
        />
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
      className="min-h-screen bg-background p-6"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-textPrimary mb-2"></h1>
          <p className="text-textSecondary"></p>
        </div>

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

        {/* Project Selector and Actions */}
        <div className="flex gap-4 mb-6 items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-textPrimary mb-2">Select Project</label>
            <select
              value={selectedProjectId || ""}
              onChange={(e) => {
                setSelectedProjectId(parseInt(e.target.value) || null);
                setSelectedStoryId(null);
              }}
              className="w-full px-4 py-2 bg-white border border-borderColor rounded-lg text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">-- Select a project --</option>
              {projects.map(p => (
                <option key={p.id || p.project_id} value={p.id || p.project_id}>
                  {p.project_name || p.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddProject}
            className="mt-6 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryDark transition"
          >
            + New Project
          </button>
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

                <span className={`inline-block mt-4 px-4 py-2 rounded-full text-sm font-semibold w-fit ${
                  selectedProject.status === 'Active' ? 'bg-green-100 text-green-800' :
                  selectedProject.status === 'Planning' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-200 text-gray-800'
                }`}>
                  {selectedProject.status || 'Active'}
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
            <div className="bg-gray-50 px-6 py-4 border-b border-borderColor flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-textPrimary">User Stories</h2>
                <div className="flex gap-6 mt-2 text-sm">
                  <span className="text-textSecondary">
                    <span className="font-semibold text-textPrimary">{totalStories}</span> Total
                  </span>
                  <span className="text-blue-600">
                    <span className="font-semibold">{readyStories}</span> Ready
                  </span>
                  <span className="text-orange-600">
                    <span className="font-semibold">{inProgressStories}</span> In Progress
                  </span>
                  <span className="text-green-600">
                    <span className="font-semibold">{completedStories}</span> Completed
                  </span>
                </div>
              </div>
              <button
                onClick={handleAddStory}
                disabled={addingStory}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryDark transition disabled:opacity-50"
              >
                + Add Story
              </button>
            </div>

            {/* Stories Table */}
            {userStories && userStories.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-borderColor bg-gray-50">
                      <th className="px-6 py-3 text-left text-sm font-semibold text-textPrimary w-8"></th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-textPrimary">Title</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-textPrimary">Priority</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-textPrimary">Status</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-textPrimary">Points</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-textPrimary">Actions</th>
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
                            className="border-b border-borderColor hover:bg-gray-50 transition"
                          >
                            <td className="px-6 py-4">
                              <button
                                onClick={() => setSelectedStoryId(selectedStoryId === story.id ? null : story.id)}
                                className="text-primary hover:bg-primary hover:text-white rounded-full w-6 h-6 flex items-center justify-center transition"
                              >
                                {selectedStoryId === story.id ? '−' : '+'}
                              </button>
                            </td>
                            <td className="px-6 py-4 text-textPrimary font-medium">{story.goal || story.title || "Untitled"}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                story.priority === 'High' ? 'bg-red-100 text-red-700' :
                                story.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {story.priority || 'Medium'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                story.status === 'Ready' ? 'bg-blue-100 text-blue-700' :
                                story.status === 'In Progress' ? 'bg-orange-100 text-orange-700' :
                                'bg-green-100 text-green-700'
                              }`}>
                                {story.status || 'Ready'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-textPrimary font-semibold">{story.story_points || 0}</td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditStory(story)}
                                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition text-sm"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteStory(story.id)}
                                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-sm"
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                          
                          {/* Expandable Details Row */}
                          {selectedStoryId === story.id && (
                            <motion.tr
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="bg-blue-50 border-b-2 border-primary"
                            >
                              <td colSpan="6" className="px-6 py-4">
                                <div className="space-y-4">
                                  <div>
                                    <h3 className="text-lg font-bold text-textPrimary mb-4">Story Details</h3>
                                    <div className="grid grid-cols-2 gap-6">
                                      <div>
                                        <p className="text-sm text-textSecondary mb-1">Title</p>
                                        <p className="text-md font-semibold text-textPrimary">{story.goal || story.title || "Untitled"}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-textSecondary mb-1">Story Points</p>
                                        <p className="text-md font-semibold text-textPrimary">{story.story_points || 0}</p>
                                      </div>
                                      <div className="col-span-2">
                                        <p className="text-sm text-textSecondary mb-1">Description</p>
                                        <p className="text-textPrimary">{story.benefit || "No description provided"}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-textSecondary mb-1">Role</p>
                                        <p className="text-textPrimary">{story.role || "-"}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-textSecondary mb-1">Status</p>
                                        <p className="text-textPrimary">{story.status || "Ready"}</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Tasks/Subtasks Section */}
                                  {story.tasks && story.tasks.length > 0 ? (
                                    <div className="border-t border-blue-200 pt-4">
                                      <h4 className="text-md font-bold text-textPrimary mb-3">
                                        Decomposed Tasks ({story.task_count || story.tasks.length})
                                      </h4>
                                      <div className="space-y-3">
                                        {story.tasks.map((task, idx) => (
                                          <div key={task.id || idx} className="bg-white rounded-lg p-3 border border-blue-200">
                                            <div className="flex justify-between items-start mb-2">
                                              <p className="text-sm font-semibold text-textPrimary">{task.tasks}</p>
                                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                {task.estimated_hours || 0}h
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
                                      <p className="text-sm text-textSecondary italic">No tasks decomposed yet</p>
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
                <button
                  onClick={handleAddStory}
                  disabled={addingStory}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryDark transition inline-block disabled:opacity-50"
                >
                  + Create First Story
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Modals */}
      <ProjectModal
        isOpen={projectModalOpen}
        project={null}
        onClose={() => setProjectModalOpen(false)}
        onSave={handleSaveProject}
      />

      <UserStoryModal
        isOpen={storyModalOpen}
        story={editingStory}
        projectId={selectedProjectId}
        onClose={async () => {
          setStoryModalOpen(false);
          setEditingStory(null);
          // Refresh stories after modal closes (whether update or create was successful)
          await fetchUserStories(selectedProjectId);
        }}
        onSave={handleSaveStory}
      />
    </motion.div>
  );
}
