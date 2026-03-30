import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { LOGIN_ENDPOINTS, apiRequest, apiRequestFormData } from "../../config/api";
import { useAuth } from "../../contexts/AuthContext";
import MetricCard from "../common/MetricCard";

export default function BacklogManager() {
  const { user } = useAuth();
  const [mode, setMode] = useState("view"); // 'view', 'add', 'bulk', 'edit'
  const [userStories, setUserStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [editingTask, setEditingTask] = useState(null); // {storyId, taskId, tasks, subtasks}
  const [searchQuery, setSearchQuery] = useState("");

  const [newStory, setNewStory] = useState({
    owner_id: "",
    project_id: "",
    role: "",
    goal: "",
    benefit: "",
    priority: "Medium",
    estimate: "3 points"
  });

  const [bulkStoriesText, setBulkStoriesText] = useState("");
  const [bulkFormData, setBulkFormData] = useState({
    owner_id: "",
    project_id: "",
    role: "User",
    benefit: "N/A",
    priority: "Medium",
  });
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: "", description: "" });

  // Fetch user stories from backend on component mount
  useEffect(() => {
    fetchUserStories();
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      let resp = null;
      const ownerId = localStorage.getItem('ownerId');
      console.log("Fetching projects for owner ID:", ownerId);
      try {
        if (ownerId) {
          resp = await apiRequest(LOGIN_ENDPOINTS.projects.getByOwner(ownerId), { method: 'GET' });
        }
      } catch (e) {
        console.warn("Failed to fetch projects by owner, trying all projects", e);
      }
      console.log("Fetched projects:", resp);
      if (Array.isArray(resp)) setProjects(resp);
    } catch (err) {
      console.warn('Failed to fetch projects for dropdown', err);
    }
  };

  const fetchUserStories = async () => {
    setLoading(true);
    setError("");
    try {
      const allTasksResponse = await apiRequest(LOGIN_ENDPOINTS.tasks.getAll, {
        method: 'GET',
      });
      
      console.log("All tasks response:", allTasksResponse);
      
      const allTasks = Array.isArray(allTasksResponse) ? allTasksResponse : [];
      
      const tasksByStoryId = {};
      const storyIds = new Set();
      
      allTasks.forEach(task => {
        const storyId = task.user_story_id;
        if (storyId !== null && storyId !== undefined) {
          storyIds.add(storyId);
          if (!tasksByStoryId[storyId]) {
            tasksByStoryId[storyId] = [];
          }
          tasksByStoryId[storyId].push({
            task_id: task.task_id,
            project_id: task.project_id,
            user_story_id: task.user_story_id,
            tasks: task.tasks || "",
            subtasks: task.subtasks || "",
          });
        }
      });
      
      const storiesWithTasks = Array.from(storyIds).map((storyId) => {
        const storyTasks = tasksByStoryId[storyId] || [];
        
        return {
          id: storyId,
          user_story_id: storyId,
          role: "User",
          goal: `Story ${storyId}`,
          benefit: "",
          priority: "Medium",
          status: "Ready",
          estimate: "",
          created_at: "",
          createdAt: "",
          tasks: storyTasks,
          backlog: storyTasks,
          backlog_tasks: storyTasks,
          user_story_tasks: storyTasks,
        };
      });
      
      console.log("Final stories with tasks:", storiesWithTasks);
      setUserStories(storiesWithTasks);
    } catch (err) {
      console.error("Failed to fetch tasks from backend:", err);
      setError("Failed to load data from backend. Please check the connection.");
      setUserStories([]);
    } finally {
      setLoading(false);
    }
  };

  // Group stories by project and apply search filter
  const groupedAndFilteredStories = useMemo(() => {
    const grouped = {};
    
    // Group stories by project_id from tasks
    userStories.forEach(story => {
      const tasks = story.tasks || story.backlog || story.backlog_tasks || [];
      const projectId = tasks.length > 0 ? tasks[0].project_id : null;
      
      if (projectId) {
        if (!grouped[projectId]) {
          grouped[projectId] = [];
        }
        grouped[projectId].push(story);
      }
    });
    
    // Apply search filter
    const filtered = {};
    Object.keys(grouped).forEach(projectId => {
      const project = projects.find(p => String(p.id || p.pk || p.ID) === String(projectId));
      const projectName = project ? (project.name || project.title || `Project ${projectId}`) : `Project ${projectId}`;
      
      const searchLower = searchQuery.toLowerCase();
      const matchesProject = projectName.toLowerCase().includes(searchLower);
      
      if (searchQuery === "" || matchesProject) {
        filtered[projectId] = grouped[projectId];
      } else {
        // Check if any story/task matches
        const storiesWithMatch = grouped[projectId].filter(story => {
          const storyText = `${story.goal || ""} ${story.benefit || ""} ${story.role || ""}`.toLowerCase();
          if (storyText.includes(searchLower)) return true;
          
          const tasks = story.tasks || story.backlog || story.backlog_tasks || [];
          return tasks.some(task => {
            const taskText = `${task.tasks || ""} ${task.subtasks || ""}`.toLowerCase();
            return taskText.includes(searchLower);
          });
        });
        
        if (storiesWithMatch.length > 0) {
          filtered[projectId] = storiesWithMatch;
        }
      }
    });
    
    return filtered;
  }, [userStories, projects, searchQuery]);

  const handleAddStory = async () => {
    const storedOwnerId = localStorage.getItem('ownerId') || (() => {
      try {
        const su = JSON.parse(localStorage.getItem('scrumai_user'));
        return su && (su.owner_id || su.id || su.ownerId) ? (su.owner_id || su.id || su.ownerId) : null;
      } catch (e) {
        return null;
      }
    })();

    const ownerId = newStory.owner_id || storedOwnerId || "";
    const fallbackProjectId = bulkFormData && bulkFormData.project_id ? bulkFormData.project_id : (projects && projects.length ? (projects[0].id || projects[0].pk || projects[0].ID) : "");
    let projectId = newStory.project_id || fallbackProjectId || localStorage.getItem('selectedProjectId') || "";

    if (!String(ownerId).trim() || !String(projectId).trim() || !String(newStory.role || "").trim() || !String(newStory.goal || "").trim() || !String(newStory.benefit || "").trim()) {
      setError("Owner ID, Project ID, Role, Goal, and Benefit are required");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      if (isNaN(projectId) && projectId.trim()) {
        try {
          const lookupResponse = await apiRequest(LOGIN_ENDPOINTS.projects.getIdByName(projectId), { method: 'GET' });
          projectId = lookupResponse.id || lookupResponse.project_id || projectId;
          console.log("Resolved project name to ID:", projectId);
        } catch (lookupErr) {
          console.warn("Failed to look up project ID by name, using provided value:", lookupErr);
        }
      }

      const storyText = `As a ${newStory.role}, I want ${newStory.goal}, so that ${newStory.benefit}`;
      const formData = new FormData();
      formData.append('owner_id', ownerId);
      formData.append('project_id', projectId);
      formData.append('role', newStory.role);
      formData.append('goal', newStory.goal);
      formData.append('benefit', newStory.benefit);
      formData.append('priority', newStory.priority);
      formData.append('stories_text', storyText);

      const response = await apiRequestFormData(LOGIN_ENDPOINTS.userStories.upload, formData);
      await fetchUserStories();

      setNewStory({ 
        owner_id: "", 
        project_id: "", 
        role: "", 
        goal: "", 
        benefit: "", 
        priority: "Medium", 
        estimate: "3 points" 
      });
      setMode("view");
      setSuccessMessage(`Success! Created ${response.stories_created} user story and ${response.tasks_created} tasks.`);
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      setError("Failed to add story: " + (err.message || "Please check your connection and try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAdd = async () => {
    if (!bulkFormData.project_id.trim()) {
      setError("Please select a project");
      return;
    }

    if (!bulkStoriesText.trim()) {
      setError("Please enter user stories");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const formData = new FormData();
      let ownerId = localStorage.getItem('ownerId') || (() => {
        try {
          const su = JSON.parse(localStorage.getItem('scrumai_user'));
          return su && (su.owner_id || su.id || su.ownerId) ? (su.owner_id || su.id || su.ownerId) : null;
        } catch (e) {
          return null;
        }
      })();

      if (ownerId) formData.append('owner_id', ownerId);
      formData.append('project_id', bulkFormData.project_id);
      formData.append('role', 'abc');
      formData.append('goal', 'abc');
      formData.append('benefit','abc');
      formData.append('priority', bulkFormData.priority);
      formData.append('stories_text', bulkStoriesText);

      const response = await apiRequestFormData(LOGIN_ENDPOINTS.userStories.upload, formData);
      await fetchUserStories();

      setBulkStoriesText("");
      setBulkFormData({
        owner_id: "",
        project_id: "",
        role: "",
        benefit: "",
        priority: "Medium",
      });
      setMode("view");
      setSuccessMessage(`Success! Created ${response.stories_created} user stories and ${response.tasks_created} tasks.`);
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      setError("Failed to add stories: " + (err.message || "Please check your connection and try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStory = async () => {
    if (!selectedStory || !selectedStory.role.trim() || !selectedStory.goal.trim() || !selectedStory.benefit.trim()) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      setUserStories(userStories.map(story => 
        story.id === selectedStory.id ? selectedStory : story
      ));

      setSelectedStory(null);
      setMode("view");
      setSuccessMessage("Edit functionality is currently disabled. Changes are not saved to backend.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Failed to update story: " + (err.message || "Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm("Are you sure you want to delete this user story?")) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      await apiRequest(LOGIN_ENDPOINTS.userStories.delete(storyId), {
        method: 'DELETE',
      });

      await fetchUserStories();

      setSuccessMessage("User story deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Failed to delete story: " + (err.message || "Please check your connection and try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (story) => {
    setError("Edit functionality is currently disabled.");
    setTimeout(() => setError(""), 3000);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High": return "bg-red-500/20 text-red-400";
      case "Medium": return "bg-yellow-500/20 text-yellow-400";
      case "Low": return "bg-green-500/20 text-green-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "In Progress": return "bg-blue-500/20 text-blue-400";
      case "Ready": return "bg-gray-500/20 text-gray-400";
      case "Completed": return "bg-green-500/20 text-green-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const handleEditTask = (storyId, task) => {
    setEditingTask({
      storyId: storyId,
      taskId: task.task_id,
      tasks: task.tasks || "",
      subtasks: task.subtasks || "",
    });
  };

  const handleSaveTask = (storyId) => {
    if (!editingTask) return;
    
    setUserStories(userStories.map(story => {
      if (story.id === storyId) {
        return {
          ...story,
          tasks: story.tasks.map(t => 
            t.task_id === editingTask.taskId 
              ? { ...t, tasks: editingTask.tasks, subtasks: editingTask.subtasks }
              : t
          ),
          backlog: story.tasks.map(t => 
            t.task_id === editingTask.taskId 
              ? { ...t, tasks: editingTask.tasks, subtasks: editingTask.subtasks }
              : t
          ),
          backlog_tasks: story.tasks.map(t => 
            t.task_id === editingTask.taskId 
              ? { ...t, tasks: editingTask.tasks, subtasks: editingTask.subtasks }
              : t
          ),
        };
      }
      return story;
    }));
    
    setEditingTask(null);
    setSuccessMessage("Task updated (changes not saved to backend)");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleCancelTaskEdit = () => {
    setEditingTask(null);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      await apiRequest(LOGIN_ENDPOINTS.tasks.delete(taskId), {
        method: 'DELETE',
      });

      await fetchUserStories();

      setSuccessMessage("Task deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Failed to delete task: " + (err.message || "Please check your connection and try again."));
    } finally {
      setLoading(false);
    }
  };

  // Helper function to render a single task/subtask item
  const renderTaskItem = (task, taskIndex, story) => {
    const isEditing = editingTask && editingTask.taskId === task.task_id && editingTask.storyId === story.id;
    
    return (
      <div key={task.task_id || task.id || taskIndex} className="bg-nightBlue/30 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <span className="text-primary font-semibold text-sm">📋</span>
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-textMuted mb-1">Task:</label>
                  <input
                    type="text"
                    value={editingTask.tasks}
                    onChange={(e) => setEditingTask({ ...editingTask, tasks: e.target.value })}
                    className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-2 text-textLight text-sm focus:outline-none focus:border-sandTan"
                  />
                </div>
                <div>
                  <label className="block text-xs text-textMuted mb-1">Subtasks (comma-separated):</label>
                  <textarea
                    value={editingTask.subtasks || ""}
                    onChange={(e) => setEditingTask({ ...editingTask, subtasks: e.target.value })}
                    className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-2 text-textLight text-sm focus:outline-none focus:border-sandTan"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSaveTask(story.id)}
                    className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-sm hover:bg-green-500/30 transition-all"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelTaskEdit}
                    className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded text-sm hover:bg-gray-500/30 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-textPrimary text-sm font-medium flex-1">
                    {task.tasks || task.task || task.name || `Task ${taskIndex + 1}`}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditTask(story.id, task)}
                      className="p-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30 transition-all"
                      title="Edit task"
                    >
                      ✏
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.task_id)}
                      className="p-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30 transition-all"
                      title="Delete task"
                    >
                      🗑
                    </button>
                  </div>
                </div>
                {task.subtasks && task.subtasks !== "empty" && String(task.subtasks).trim() && (
                  <div className="mt-2 ml-4 space-y-1">
                    {typeof task.subtasks === 'string' 
                      ? task.subtasks.split(',').map((subtask, subIndex) => (
                          subtask.trim() && subtask.trim() !== 'empty' && (
                            <div key={subIndex} className="flex items-start gap-2">
                              <span className="text-textMuted text-xs">•</span>
                              <span className="text-textSecondary text-xs">{subtask.trim()}</span>
                            </div>
                          )
                        ))
                      : Array.isArray(task.subtasks) && task.subtasks.map((subtask, subIndex) => (
                          subtask && subtask !== 'empty' && (
                            <div key={subIndex} className="flex items-start gap-2">
                              <span className="text-textMuted text-xs">•</span>
                              <span className="text-textSecondary text-xs">{typeof subtask === 'string' ? subtask : subtask.name || subtask}</span>
                            </div>
                          )
                        ))
                    }
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Mode Selector */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button
          onClick={() => setMode("view")}
          className={`px-6 py-3 rounded-lg transition-all ${
            mode === "view"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          📋 View Backlog
        </button>
        <button
          onClick={() => setMode("bulk")}
          className={`px-6 py-3 rounded-lg transition-all ${
            mode === "bulk"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          📝 Add User Stories
        </button>
        <button
          onClick={() => setShowProjectModal(true)}
          className={`px-6 py-3 rounded-lg transition-all ${
            mode === "createProject"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          ➕ Create Project
        </button>
      </div>

      {/* Create Project Modal (same as before) */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-nightBlue/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md bg-gradient-to-br from-nightBlueShadow to-nightBlue border border-sandTan/40 rounded-2xl p-8 shadow-2xl"
          >
            <h3 className="text-2xl font-bold text-sandTan mb-6">Create New Project</h3>
            
            <div className="space-y-5 mb-6">
              <div>
                <label className="block mb-2 text-sandTan font-semibold text-sm">Project Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={projectForm.name}
                  onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                  className="w-full bg-nightBlue border border-sandTan/40 rounded-lg p-3 text-textLight placeholder-textMuted focus:outline-none focus:border-sandTan focus:ring-2 focus:ring-sandTan/20 transition-all"
                  placeholder="e.g., Mobile App Redesign"
                />
              </div>

              <div>
                <label className="block mb-2 text-sandTan font-semibold text-sm">Description <span className="text-textMuted text-xs">(Optional)</span></label>
                <textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="w-full bg-nightBlue border border-sandTan/40 rounded-lg p-3 text-textLight placeholder-textMuted focus:outline-none focus:border-sandTan focus:ring-2 focus:ring-sandTan/20 transition-all resize-none"
                  rows={3}
                  placeholder="Brief description of the project..."
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowProjectModal(false); setProjectForm({ name: "", description: "" }); }}
                className="px-5 py-2 border border-sandTan text-sandTan rounded-lg hover:bg-sandTan/10 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setError("");
                  if (!projectForm.name || !projectForm.name.trim()) {
                    setError('Project name is required');
                    return;
                  }
                  setLoading(true);
                  try {
                    const storedOwnerId = localStorage.getItem('ownerId') || (() => {
                      try {
                        const su = JSON.parse(localStorage.getItem('scrumai_user'));
                        return su && (su.owner_id || su.id || su.ownerId) ? (su.owner_id || su.id || su.ownerId) : null;
                      } catch (e) { return null; }
                    })();
                    const ownerId = storedOwnerId || null;

                    const payload = { name: projectForm.name.trim(), description: projectForm.description || '' };
                    if (ownerId) payload.owner_id = ownerId;

                    const resp = await apiRequest(LOGIN_ENDPOINTS.projects.create, {
                      method: 'POST',
                      body: JSON.stringify(payload),
                    });

                    await fetchProjects();
                    setShowProjectModal(false);
                    setProjectForm({ name: '', description: '' });
                    setSuccessMessage(`Project "${resp.name || projectForm.name}" created successfully.`);
                    setTimeout(() => setSuccessMessage(''), 4000);
                  } catch (err) {
                    console.error('Create project failed', err);
                    setError('Failed to create project: ' + (err.message || 'Please try again'));
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading || !projectForm.name.trim()}
                className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                  !loading && projectForm.name.trim()
                    ? "bg-sandTan text-nightBlue hover:bg-sandTanShadow shadow-lg"
                    : "bg-textMuted text-nightBlue/50 cursor-not-allowed"
                }`}
              >
                {loading ? "Creating..." : "Create Project"}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4 mb-6">
          <p className="text-green-400">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Content based on mode */}
      {mode === "view" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Backlog Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard
              title="Total Stories"
              value={userStories.length}
              icon="📋"
              delay={0.1}
            />
            <MetricCard
              title="Ready"
              value={userStories.filter(s => s.status === "Ready").length}
              icon="✅"
              delay={0.2}
            />
            <MetricCard
              title="In Progress"
              value={userStories.filter(s => s.status === "In Progress").length}
              icon="🔄"
              delay={0.3}
            />
            <MetricCard
              title="Completed"
              value={userStories.filter(s => s.status === "Completed").length}
              icon="🎯"
              delay={0.4}
            />
          </div>

          {/* Search Bar */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3">
              <span className="text-xl text-sandTan">🔍</span>
              <input
                type="text"
                placeholder="Search by project name, story goal, or task..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-nightBlue border border-sandTan/30 rounded-lg p-3 text-textLight placeholder-textMuted focus:outline-none focus:border-sandTan focus:ring-2 focus:ring-sandTan/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Grouped User Stories by Project */}
          <div className="space-y-8">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : Object.keys(groupedAndFilteredStories).length === 0 ? (
              <div className="bg-surface border border-border rounded-2xl p-12 text-center">
                <p className="text-textMuted text-lg">
                  {searchQuery ? `No stories found matching "${searchQuery}"` : "No user stories yet. Add your first story to get started!"}
                </p>
              </div>
            ) : (
              Object.keys(groupedAndFilteredStories).map((projectId, projectIndex) => {
                const project = projects.find(p => String(p.id || p.pk || p.ID) === String(projectId));
                const projectName = project ? (project.name || project.title || `Project ${projectId}`) : `Project ${projectId}`;
                const projectDescription = project ? (project.description || "") : "";
                const stories = groupedAndFilteredStories[projectId];

                return (
                  <motion.div
                    key={projectId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: projectIndex * 0.1 }}
                    className="space-y-4"
                  >
                    {/* Project Header */}
                    <div className="bg-gradient-to-r from-sandTan/20 to-sandTan/10 border border-sandTan/40 rounded-xl p-6">
                      <h3 className="text-2xl font-bold text-sandTan mb-2">📁 {projectName}</h3>
                      {projectDescription && (
                        <p className="text-textSecondary text-sm">{projectDescription}</p>
                      )}
                      <div className="mt-3 flex gap-4">
                        <span className="text-xs bg-sandTan/20 text-sandTan px-3 py-1 rounded-full font-medium">
                          {stories.length} Stories
                        </span>
                        <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full font-medium">
                          Project ID: {projectId}
                        </span>
                      </div>
                    </div>

                    {/* Stories for this Project */}
                    <div className="space-y-3 bg-surface border border-border rounded-2xl p-6">
                      {stories.map((story, storyIndex) => (
                        <motion.div
                          key={story.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: storyIndex * 0.05 }}
                          className="bg-surface border border-border/50 rounded-lg p-4 hover:shadow-soft transition-all duration-300"
                        >
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                              <div className="flex-1">
                                <p className="text-textPrimary text-base mb-2">
                                  As a <span className="text-primary font-semibold">{story.role || "User"}</span>, 
                                  I want to <span className="text-primary font-semibold">{story.goal || "..."}</span>, 
                                  so that <span className="text-primary font-semibold">{story.benefit || "..."}</span>.
                                </p>
                                <div className="flex flex-wrap gap-4 text-sm text-textSecondary">
                                  {(story.created_at || story.createdAt) && (
                                    <span>Created: {story.created_at || story.createdAt}</span>
                                  )}
                                  {story.estimate && <span>Estimate: {story.estimate}</span>}
                                </div>
                              </div>
                            
                              <div className="flex flex-wrap gap-3 items-center">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(story.priority)}`}>
                                  {story.priority}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(story.status)}`}>
                                  {story.status}
                                </span>
                                
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditClick(story)}
                                    className="p-2 bg-gray-500/20 text-gray-400 rounded-lg cursor-not-allowed opacity-50"
                                    title="Edit is currently disabled"
                                    disabled
                                  >
                                    ✏ (Disabled)
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStory(story.id)}
                                    className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                                    title="Delete"
                                  >
                                    🗑
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            {/* Tasks and Subtasks Display */}
                            {(() => {
                              let tasks = [];
                              if (story.backlog && Array.isArray(story.backlog)) {
                                tasks = story.backlog;
                              } else if (story.backlog_tasks && Array.isArray(story.backlog_tasks)) {
                                tasks = story.backlog_tasks;
                              } else if (story.tasks && Array.isArray(story.tasks)) {
                                tasks = story.tasks;
                              } else if (story.user_story_tasks && Array.isArray(story.user_story_tasks)) {
                                tasks = story.user_story_tasks;
                              }
                              
                              return tasks.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-border">
                                  <h4 className="text-sm font-semibold text-textPrimary mb-3">Tasks & Subtasks:</h4>
                                  <div className="space-y-2">
                                    {tasks.map((task, taskIndex) => renderTaskItem(task, taskIndex, story))}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      )}

      {/* Bulk mode and Edit mode remain the same as in original file */}
      {mode === "bulk" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-sandTan mb-6">Add User Stories</h2>
          
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div>
              <label className="block mb-2 text-sandTan font-medium">Project <span className="text-red-400">*</span></label>
              <select
                value={bulkFormData.project_id}
                onChange={(e) => setBulkFormData({ ...bulkFormData, project_id: e.target.value })}
                className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-3 text-textLight focus:outline-none focus:border-sandTan"
              >
                <option value="">-- Select project --</option>
                {projects && projects.map((p) => (
                  <option key={p.id || p.pk || p.ID} value={p.id || p.pk || p.ID}>
                    {p.name || p.title || (p.id || p.pk)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-sandTan font-medium">Enter User Stories <span className="text-red-400">*</span></label>
            <p className="text-textMuted text-sm mb-4">
              Enter one story per line. Each line should be a complete user story in the format:<br/>
              <code className="bg-nightBlue px-2 py-1 rounded text-sm">
                As a [role], I want [goal], so that [benefit]
              </code><br/>
              Or just enter the story text - the backend will parse it automatically.
            </p>
            <textarea
              value={bulkStoriesText}
              onChange={(e) => setBulkStoriesText(e.target.value)}
              placeholder="Example:
As a Developer, I want to implement user authentication, so that users can securely access the system
As a User, I want to search products by name, so that I can quickly find what I need
As an Admin, I want to generate monthly reports, so that I can track system performance"
              rows={12}
              className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-4 text-textLight focus:outline-none focus:border-sandTan font-mono text-sm"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleBulkAdd}
              disabled={loading || !bulkFormData.project_id.trim() || !bulkStoriesText.trim()}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                bulkFormData.project_id.trim() && bulkStoriesText.trim() && !loading
                  ? "bg-sandTan text-nightBlue hover:bg-sandTanShadow"
                  : "bg-gray-600 text-gray-300 cursor-not-allowed"
              }`}
            >
              {loading ? "Adding..." : "Add All Stories"}
            </button>
            <button
              onClick={() => setMode("view")}
              className="border border-sandTan text-sandTan px-6 py-3 rounded-lg hover:bg-sandTan hover:text-nightBlue transition-all"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {mode === "edit" && selectedStory && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-8"
        >
          <h2 className="text-2xl font-bold text-sandTan mb-6">Edit User Story</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block mb-2 text-sandTan font-medium">Role</label>
              <input
                type="text"
                value={selectedStory.role}
                onChange={(e) => setSelectedStory({ ...selectedStory, role: e.target.value })}
                className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-3 text-textLight focus:outline-none focus:border-sandTan"
              />
            </div>

            <div>
              <label className="block mb-2 text-sandTan font-medium">Priority</label>
              <select
                value={selectedStory.priority}
                onChange={(e) => setSelectedStory({ ...selectedStory, priority: e.target.value })}
                className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-3 text-textLight focus:outline-none focus:border-sandTan"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 text-sandTan font-medium">Goal</label>
              <input
                type="text"
                value={selectedStory.goal}
                onChange={(e) => setSelectedStory({ ...selectedStory, goal: e.target.value })}
                className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-3 text-textLight focus:outline-none focus:border-sandTan"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block mb-2 text-sandTan font-medium">Benefit</label>
              <input
                type="text"
                value={selectedStory.benefit}
                onChange={(e) => setSelectedStory({ ...selectedStory, benefit: e.target.value })}
                className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-3 text-textLight focus:outline-none focus:border-sandTan"
              />
            </div>

            <div>
              <label className="block mb-2 text-sandTan font-medium">Estimate</label>
              <select
                value={selectedStory.estimate}
                onChange={(e) => setSelectedStory({ ...selectedStory, estimate: e.target.value })}
                className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-3 text-textLight focus:outline-none focus:border-sandTan"
              >
                <option value="1 point">1 point</option>
                <option value="2 points">2 points</option>
                <option value="3 points">3 points</option>
                <option value="5 points">5 points</option>
                <option value="8 points">8 points</option>
                <option value="13 points">13 points</option>
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sandTan font-medium">Status</label>
              <select
                value={selectedStory.status}
                onChange={(e) => setSelectedStory({ ...selectedStory, status: e.target.value })}
                className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-3 text-textLight focus:outline-none focus:border-sandTan"
              >
                <option value="Ready">Ready</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleUpdateStory}
              disabled={loading || !selectedStory.role.trim() || !selectedStory.goal.trim() || !selectedStory.benefit.trim()}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                selectedStory.role.trim() && selectedStory.goal.trim() && selectedStory.benefit.trim() && !loading
                  ? "bg-sandTan text-nightBlue hover:bg-sandTanShadow"
                  : "bg-gray-600 text-gray-300 cursor-not-allowed"
              }`}
            >
              {loading ? "Updating..." : "Update Story"}
            </button>
            <button
              onClick={() => {
                setSelectedStory(null);
                setMode("view");
              }}
              className="border border-sandTan text-sandTan px-6 py-3 rounded-lg hover:bg-sandTan hover:text-nightBlue transition-all"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
