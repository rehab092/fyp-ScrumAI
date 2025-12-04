import React, { useState, useEffect } from "react";
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
    // defaults kept for backend validation but not shown in UI
    role: "User",
    benefit: "N/A",
    priority: "Medium",
  });
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch user stories from backend on component mount
  useEffect(() => {
    fetchUserStories();
    // fetch projects list for project dropdown
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      let resp = null;
      // Get owner id from logged-in user and fetch owner-specific projects
      const ownerId = localStorage.getItem('ownerId');
      console.log("Fetching projects for owner ID:", ownerId);
      if (ownerId && typeof LOGIN_ENDPOINTS !== 'undefined' && LOGIN_ENDPOINTS.projects && LOGIN_ENDPOINTS.projects.getByOwner) {
        resp = await apiRequest(LOGIN_ENDPOINTS.projects.getByOwner(ownerId), { method: 'GET' });
      } else if (typeof LOGIN_ENDPOINTS !== 'undefined' && LOGIN_ENDPOINTS.projects && LOGIN_ENDPOINTS.projects.getAll) {
        resp = await apiRequest(LOGIN_ENDPOINTS.projects.getAll, { method: 'GET' });
      } else {
        resp = await apiRequest('/userstorymanager/projects/', { method: 'GET' });
      }
      if (Array.isArray(resp)) setProjects(resp);
    } catch (err) {
      console.warn('Failed to fetch projects for dropdown', err);
    }
  };

  const fetchUserStories = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch all tasks from backend - returns array directly (safe=False)
      const allTasksResponse = await apiRequest(LOGIN_ENDPOINTS.tasks.getAll, {
        method: 'GET',
      });
      
      console.log("All tasks response:", allTasksResponse); // Debug log
      
      // The response is a direct array of tasks: [{task_id, project_id, user_story_id, tasks, subtasks}, ...]
      const allTasks = Array.isArray(allTasksResponse) ? allTasksResponse : [];
      
      // Group tasks by user_story_id
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
      
      console.log("Tasks grouped by story ID:", tasksByStoryId); // Debug log
      console.log("Unique story IDs:", Array.from(storyIds)); // Debug log
      
      // Create stories array from grouped tasks
      const storiesWithTasks = Array.from(storyIds).map((storyId) => {
        const storyTasks = tasksByStoryId[storyId] || [];
        
        return {
          id: storyId,
          user_story_id: storyId,
          role: "User", // Placeholder - will need user story endpoint for full details
          goal: `Story ${storyId}`, // Placeholder
          benefit: "", // Placeholder
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
      
      console.log("Final stories with tasks:", storiesWithTasks); // Debug log
      setUserStories(storiesWithTasks);
    } catch (err) {
      // If backend is not available, show empty list
      console.error("Failed to fetch tasks from backend:", err);
      setError("Failed to load data from backend. Please check the connection.");
      setUserStories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStory = async () => {
    if (!newStory.owner_id.trim() || !newStory.project_id.trim() || !newStory.role.trim() || !newStory.goal.trim() || !newStory.benefit.trim()) {
      setError("Owner ID, Project ID, Role, Goal, and Benefit are required");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      // Format story as "As a [role], I want [goal], so that [benefit]"
      const storyText = `As a ${newStory.role}, I want ${newStory.goal}, so that ${newStory.benefit}`;
      
      // Create FormData for backend
      const formData = new FormData();
      formData.append('owner_id', newStory.owner_id);
      formData.append('project_id', newStory.project_id);
      formData.append('role', newStory.role);
      formData.append('goal', newStory.goal);
      formData.append('benefit', newStory.benefit);
      formData.append('priority', newStory.priority);
      formData.append('stories_text', storyText);

      // Call backend API
      const response = await apiRequestFormData(LOGIN_ENDPOINTS.userStories.upload, formData);
      
      // Refresh stories list from backend
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
      // Create FormData - backend expects stories_text as multiline text
      const formData = new FormData();
      // try to include owner_id if available (some setups provide owner via separate endpoint/session)
      let ownerId = bulkFormData.owner_id;
      if (!ownerId) {
        try {
          if (typeof LOGIN_ENDPOINTS !== 'undefined' && LOGIN_ENDPOINTS.productOwner && LOGIN_ENDPOINTS.productOwner.current) {
            const o = await apiRequest(LOGIN_ENDPOINTS.productOwner.current, { method: 'GET' });
            ownerId = o && (o.owner_id || o.id || o.ownerId);
          }
        } catch (e) {
          // ignore - owner may be provided server-side
        }
      }
      if (ownerId) formData.append('owner_id', ownerId);
      formData.append('project_id', bulkFormData.project_id);
      // backend requires role/benefit/priority -> send defaults (these are not editable in UI per request)
      formData.append('role', bulkFormData.role);
      formData.append('goal', ''); // optional for bulk
      formData.append('benefit', bulkFormData.benefit);
      formData.append('priority', bulkFormData.priority);
      formData.append('stories_text', bulkStoriesText); // Send multiline text directly

      // Call backend API
      const response = await apiRequestFormData(LOGIN_ENDPOINTS.userStories.upload, formData);
      
      // Refresh stories list from backend
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
    // Dummy edit - just show message, don't actually update
    if (!selectedStory || !selectedStory.role.trim() || !selectedStory.goal.trim() || !selectedStory.benefit.trim()) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      // Dummy update - just update local state for preview
      // No backend call
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
      // Delete user story via backend API
      await apiRequest(LOGIN_ENDPOINTS.userStories.delete(storyId), {
        method: 'DELETE',
      });

      // Refresh stories list from backend
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
    // Dummy edit - disabled functionality
    // setSelectedStory({ ...story });
    // setMode("edit");
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

  // Task editing functions (frontend only, no backend call)
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
    
    // Update task in local state only (no backend call)
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

  // Delete task from backend
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      // Delete task via backend API
      await apiRequest(LOGIN_ENDPOINTS.tasks.delete(taskId), {
        method: 'DELETE',
      });

      // Refresh stories list from backend
      await fetchUserStories();

      setSuccessMessage("Task deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Failed to delete task: " + (err.message || "Please check your connection and try again."));
    } finally {
      setLoading(false);
    }
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
      </div>

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

          {/* User Stories List */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="text-xl font-bold text-textPrimary mb-6">User Stories</h2>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : userStories.length === 0 ? (
              <div className="text-center py-12 text-textMuted">
                <p>No user stories yet. Add your first story to get started!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userStories.map((story, index) => (
                  <motion.div
                    key={story.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-surface border border-border rounded-lg p-4 hover:shadow-soft transition-all duration-300"
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
                              <span>
                                Created: {story.created_at || story.createdAt}
                              </span>
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
                        
                        {/* CRUD Buttons */}
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
                        // Handle different response formats from backend
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
                              {tasks.map((task, taskIndex) => {
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
                                            {task.subtasks && task.subtasks !== "empty" && task.subtasks && String(task.subtasks).trim() && (
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
                              })}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

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