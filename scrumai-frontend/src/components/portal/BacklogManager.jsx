import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { LOGIN_ENDPOINTS, apiRequest, apiRequestFormData } from "../../config/api";
import { useAuth } from "../../contexts/AuthContext";
import MetricCard from "../common/MetricCard";

export default function BacklogManager() {
  const { user } = useAuth();
  const [mode, setMode] = useState("view"); // 'view', 'add', 'bulk', 'edit', 'tasks'
  const [userStories, setUserStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [editingTask, setEditingTask] = useState(null); // {storyId, taskId, tasks, subtasks}
  const [searchQuery, setSearchQuery] = useState("");
  const [groupedStories, setGroupedStories] = useState({});
  const [tasksData, setTasksData] = useState({}); // {storyId: [tasks]}
  const [taskSearchQuery, setTaskSearchQuery] = useState("");

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
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: "", description: "" });

  // Fetch projects then user stories grouped by project on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      let resp = null;
      // Get owner id from logged-in user and fetch owner-specific projects
      let ownerId = localStorage.getItem('ownerId');
      
      // Debug logging
      console.log("[BacklogManager] Stored ownerId from localStorage:", ownerId);
      console.log("[BacklogManager] Type of ownerId:", typeof ownerId);
      
      // Try to get from user context if localStorage is empty
      if (!ownerId) {
        try {
          const savedUser = localStorage.getItem('scrumai_user');
          if (savedUser) {
            const user = JSON.parse(savedUser);
            ownerId = user.owner_id || user.id || user.workspace_id;
            console.log("[BacklogManager] Extracted ownerId from scrumai_user:", ownerId);
          }
        } catch (e) {
          console.warn("[BacklogManager] Failed to extract ownerId from scrumai_user:", e);
        }
      }
      
      console.log("[BacklogManager] Final ownerId to use:", ownerId);
      
      try {
        if (ownerId) {
          console.log("[BacklogManager] Fetching projects with endpoint:", LOGIN_ENDPOINTS.projects.getByOwner(ownerId));
          resp = await apiRequest(LOGIN_ENDPOINTS.projects.getByOwner(ownerId), { method: 'GET' });
          console.log("[BacklogManager] Response from getByOwner:", resp);
        } else {
          console.warn("[BacklogManager] WARNING: No ownerId available, skipping getByOwner");
        }
      } catch (e) {
        console.warn("[BacklogManager] Failed to fetch projects by owner, trying all projects", e);
      }

      console.log("[BacklogManager] Fetched projects:", resp);
      if (Array.isArray(resp)) {
        setProjects(resp);
        // after projects are loaded, fetch stories per project
        await fetchStoriesForProjects(resp);
      } else {
        // If no projects returned, ensure stories still load via fallback
        await fetchStoriesForProjects([]);
      }
    } catch (err) {
      console.warn('Failed to fetch projects for dropdown', err);
    }
  };

  // Fetch stories per project using the project-specific endpoint, fallback to tasks.getAll
  const fetchStoriesForProjects = async (projectsList) => {
    setLoading(true);
    setError("");
    try {
      const grouped = {};

      // If we have projects, fetch per-project stories
      if (Array.isArray(projectsList) && projectsList.length > 0) {
        for (const p of projectsList) {
          try {
            const resp = await apiRequest(LOGIN_ENDPOINTS.projects.getUserStoryByProjectId(p.id || p.ID || p.pk), { method: 'GET' });
            // Expecting resp to be an array of user stories (each may include tasks)
            const stories = Array.isArray(resp) ? resp : [];

            // Normalize stories: ensure tasks array exists
            const normalized = stories.map(s => ({
              id: s.id || s.user_story_id || s.pk || s.story_id,
              role: s.role || s.user_role || 'User',
              goal: s.goal || s.title || s.summary || s.name || `Story ${s.id || ''}`,
              benefit: s.benefit || s.description || '',
              priority: s.priority || 'Medium',
              status: s.status || 'Ready',
              estimate: s.estimate || '',
              created_at: s.created_at || s.createdAt || '',
              tasks: Array.isArray(s.tasks) ? s.tasks : (Array.isArray(s.user_story_tasks) ? s.user_story_tasks : []),
              backlog: Array.isArray(s.tasks) ? s.tasks : [],
              user_story_tasks: Array.isArray(s.tasks) ? s.tasks : [],
            }));

            if (normalized.length > 0) grouped[p.id] = normalized;
          } catch (projErr) {
            console.warn(`Failed to fetch stories for project ${p.id}:`, projErr);
            // continue to next project
          }
        }
      }

      // If grouped is empty (no projects or per-project fetch failed), fallback to tasks.getAll
      if (Object.keys(grouped).length === 0) {
        try {
          const allTasksResponse = await apiRequest(LOGIN_ENDPOINTS.tasks.getAll, { method: 'GET' });
          const allTasks = Array.isArray(allTasksResponse) ? allTasksResponse : [];

          const tasksByStoryId = {};
          const storyIds = new Set();

          allTasks.forEach(task => {
            const storyId = task.user_story_id;
            if (storyId !== null && storyId !== undefined) {
              storyIds.add(storyId);
              if (!tasksByStoryId[storyId]) tasksByStoryId[storyId] = [];
              tasksByStoryId[storyId].push({
                task_id: task.task_id,
                project_id: task.project_id,
                user_story_id: task.user_story_id,
                tasks: task.tasks || "",
                subtasks: task.subtasks || "",
              });
            }
          });

          Array.from(storyIds).forEach((storyId) => {
            const storyTasks = tasksByStoryId[storyId] || [];
            const projId = storyTasks.length > 0 ? storyTasks[0].project_id : 'unassigned';
            if (!grouped[projId]) grouped[projId] = [];
            grouped[projId].push({
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
            });
          });
        } catch (err) {
          console.error("Fallback tasks.getAll failed:", err);
        }
      }

      setGroupedStories(grouped);
    } catch (err) {
      console.error("Failed to fetch stories per project:", err);
      setError("Failed to load stories. Please check the backend.");
      setGroupedStories({});
    } finally {
      setLoading(false);
    }
  };

  // Fetch tasks for a specific user story using the dedicated endpoint
  // Filter grouped stories by search query (project name, story text, task text)
  const filteredGroupedStories = useMemo(() => {
    const q = (searchQuery || "").toLowerCase().trim();
    if (!q) return groupedStories;

    const out = {};
    Object.keys(groupedStories).forEach(pid => {
      const proj = projects.find(p => String(p.id || p.pk || p.ID) === String(pid));
      const projName = proj ? (proj.name || proj.title || `Project ${pid}`) : `Project ${pid}`;
      const stories = groupedStories[pid] || [];

      // match project name
      if (projName.toLowerCase().includes(q)) {
        out[pid] = stories;
        return;
      }

      // otherwise filter stories/tasks
      const matched = stories.filter(s => {
        const storyText = `${s.goal || ""} ${s.benefit || ""} ${s.role || ""}`.toLowerCase();
        if (storyText.includes(q)) return true;
        const tasks = s.tasks || s.backlog || s.backlog_tasks || s.user_story_tasks || [];
        return tasks.some(t => ((t.tasks || "") + " " + (t.subtasks || "")).toLowerCase().includes(q));
      });

      if (matched.length > 0) out[pid] = matched;
    });
    return out;
  }, [groupedStories, projects, searchQuery]);

  // Fetch tasks for all user stories
  const fetchAllTasks = async () => {
    setLoading(true);
    setError("");
    try {
      const tasks = {};
      
      // Get all stories from grouped data
      for (const projectId in groupedStories) {
        const stories = groupedStories[projectId];
        if (Array.isArray(stories)) {
          for (const story of stories) {
            try {
              const response = await apiRequest(LOGIN_ENDPOINTS.tasks.getByUserStory(story.id), { method: 'GET' });
              const storyTasks = Array.isArray(response) ? response : [];
              if (storyTasks.length > 0) {
                tasks[story.id] = storyTasks;
              }
            } catch (err) {
              console.warn(`Failed to fetch tasks for story ${story.id}:`, err);
              tasks[story.id] = [];
            }
          }
        }
      }
      
      setTasksData(tasks);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
      setError("Failed to load tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  
    const handleAddStory = async () => {
      // Ensure owner_id and project_id are populated from available sources
      const storedOwnerId = localStorage.getItem('ownerId') || (() => {
        try {
          const su = JSON.parse(localStorage.getItem('scrumai_user'));
          return su && (su.owner_id || su.id || su.ownerId) ? (su.owner_id || su.id || su.ownerId) : null;
        } catch (e) {
          return null;
        }
      })();
  
      const ownerId = newStory.owner_id || storedOwnerId || "";
      
      console.log("[handleAddStory] storedOwnerId:", storedOwnerId);
      console.log("[handleAddStory] newStory.owner_id:", newStory.owner_id);
      console.log("[handleAddStory] Final ownerId being used:", ownerId);
  
      // Project id can come from the add form (newStory.project_id), from the bulk selector (if user selected there), or as a fallback the first project in list
      const fallbackProjectId = bulkFormData && bulkFormData.project_id ? bulkFormData.project_id : (projects && projects.length ? (projects[0].id || projects[0].pk || projects[0].ID) : "");
      let projectId = newStory.project_id || fallbackProjectId || localStorage.getItem('selectedProjectId') || "";
  
      if (!String(ownerId).trim() || !String(projectId).trim() || !String(newStory.role || "").trim() || !String(newStory.goal || "").trim() || !String(newStory.benefit || "").trim()) {
        setError("Owner ID, Project ID, Role, Goal, and Benefit are required");
        console.error("[handleAddStory] Validation failed:", { ownerId, projectId, role: newStory.role, goal: newStory.goal, benefit: newStory.benefit });
        return;
      }
      
      // Additional check - if ownerId is '1' and we didn't explicitly set it, something is wrong
      if (ownerId === '1' && !newStory.owner_id && !storedOwnerId) {
        console.error("[handleAddStory] WARNING: ownerId defaulted to '1'. This might indicate a backend issue or default fallback.");
      }
  
      setLoading(true);
      setError("");
      setSuccessMessage("");
  
      try {
        // Check if projectId is actually a project name (not a number) and fetch the actual ID
        if (isNaN(projectId) && projectId.trim()) {
          try {
            const lookupResponse = await apiRequest(LOGIN_ENDPOINTS.projects.getIdByName(projectId), { method: 'GET' });
            projectId = lookupResponse.id || lookupResponse.project_id || projectId;
            console.log("Resolved project name to ID:", projectId);
          } catch (lookupErr) {
            console.warn("Failed to look up project ID by name, using provided value:", lookupErr);
            // Continue with the original projectId value
          }
        }
  
        // Format story as "As a [role], I want [goal], so that [benefit]"
        const storyText = `As a ${newStory.role}, I want ${newStory.goal}, so that ${newStory.benefit}`;
        
        // Create FormData for backend
        const formData = new FormData();
        formData.append('owner_id', ownerId);
        formData.append('project_id', projectId);
        formData.append('role', newStory.role);
        formData.append('goal', newStory.goal);
        formData.append('benefit', newStory.benefit);
        formData.append('priority', newStory.priority);
        formData.append('stories_text', storyText);
  
        // Call backend API
        const response = await apiRequestFormData(LOGIN_ENDPOINTS.userStories.upload, formData);
        
        // Refresh stories list from backend
        await fetchProjects();
  
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
      // backend requires role/benefit/priority -> send defaults (these are not editable in UI per request)
      formData.append('role', 'backend developer');
      formData.append('goal', 'complete project'); // optional for bulk
      formData.append('benefit','so that i can meet the deadlines');
      formData.append('priority', bulkFormData.priority);
      formData.append('stories_text', bulkStoriesText); // Send multiline text directly

      // Call backend API
      const response = await apiRequestFormData(LOGIN_ENDPOINTS.userStories.upload, formData);
      
      // Refresh stories list from backend
      await fetchProjects();

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
      await fetchProjects();

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
      await fetchProjects();

      setSuccessMessage("Task deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Failed to delete task: " + (err.message || "Please check your connection and try again."));
    } finally {
      setLoading(false);
    }
  };

  // Render individual task item
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
        <button
          onClick={() => {
            setMode("tasks");
            fetchAllTasks();
          }}
          className={`px-6 py-3 rounded-lg transition-all ${
            mode === "tasks"
              ? "bg-sandTan text-nightBlue shadow-lg"
              : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
          }`}
        >
          ✓ View Tasks
        </button>
      </div>

      {/* Create Project Modal */}
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
                  // call handler inline to keep patch small
                  setError("");
                  if (!projectForm.name || !projectForm.name.trim()) {
                    setError('Project name is required');
                    return;
                  }
                  setLoading(true);
                  try {
                    // resolve owner id
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

                    // refresh projects list
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
              value={Object.values(groupedStories).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0)}
              icon="📋"
              delay={0.1}
            />
            <MetricCard
              title="Ready"
              value={Object.values(groupedStories).flat().filter(s => (s.status || '').toLowerCase() === "ready").length}
              icon="✅"
              delay={0.2}
            />
            <MetricCard
              title="In Progress"
              value={Object.values(groupedStories).flat().filter(s => (s.status || '').toLowerCase() === "in progress").length}
              icon="🔄"
              delay={0.3}
            />
            <MetricCard
              title="Completed"
              value={Object.values(groupedStories).flat().filter(s => (s.status || '').toLowerCase() === "completed").length}
              icon="🎯"
              delay={0.4}
            />
          </div>

          {/* Projects & User Stories List */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-textPrimary">Projects & Backlog</h2>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search projects, stories, tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-nightBlue border border-sandTan/30 rounded-lg p-2 text-textLight placeholder-textMuted focus:outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : Object.keys(filteredGroupedStories).length === 0 ? (
              <div className="text-center py-12 text-textMuted">
                <p>{searchQuery ? `No results for "${searchQuery}"` : 'No user stories yet. Add some projects or stories.'}</p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.keys(filteredGroupedStories).sort((a,b)=> Number(a)-Number(b)).map((projectId, pIndex) => {
                  const project = projects.find(p => String(p.id || p.pk || p.ID) === String(projectId));
                  const projectName = project ? (project.name || project.title || `Project ${projectId}`) : `Project ${projectId}`;
                  const projectDescription = project ? (project.description || '') : '';
                  const stories = filteredGroupedStories[projectId];

                  return (
                    <div key={projectId} className="space-y-4">
                      <div className="bg-gradient-to-r from-sandTan/20 to-sandTan/10 border border-sandTan/40 rounded-xl p-5">
                        <h3 className="text-2xl font-semibold text-sandTan">📁 {projectName}</h3>
                        {projectDescription && <p className="text-textSecondary text-sm">{projectDescription}</p>}
                        <div className="mt-2 flex gap-3">
                          <span className="text-xs bg-sandTan/20 text-sandTan px-3 py-1 rounded-full font-medium">{stories.length} Stories</span>
                          <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full font-medium">Project ID: {projectId}</span>
                        </div>
                      </div>

                      <div className="space-y-3 bg-surface border border-border rounded-2xl p-4">
                        {stories.map((story, sIndex) => (
                          <motion.div key={story.id || `${projectId}-${sIndex}`} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{duration:0.4, delay:sIndex*0.04}} className="bg-surface border border-border/50 rounded-lg p-4">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                              <div className="flex-1">
                                <p className="text-textPrimary text-base mb-2">As a <span className="text-primary font-semibold">{story.role || 'User'}</span>, I want to <span className="text-primary font-semibold">{story.goal || '...'}</span>, so that <span className="text-primary font-semibold">{story.benefit || '...'}</span>.</p>
                                <div className="flex gap-3 text-sm text-textSecondary">
                                  {story.estimate && <span>Estimate: {story.estimate}</span>}
                                  {(story.created_at || story.createdAt) && <span>Created: {story.created_at || story.createdAt}</span>}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(story.priority)}`}>{story.priority}</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(story.status)}`}>{story.status}</span>
                                <div className="flex gap-2">
                                  <button onClick={() => handleEditClick(story)} className="p-2 bg-gray-500/20 text-gray-400 rounded-lg cursor-not-allowed opacity-50" disabled>✏</button>
                                  <button onClick={() => handleDeleteStory(story.id)} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">🗑</button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  );
                })}
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

      {mode === "tasks" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Tasks View */}
          <div className="bg-surface border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-textPrimary">All Tasks & Subtasks</h2>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search tasks, subtasks..."
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
                  className="bg-nightBlue border border-sandTan/30 rounded-lg p-2 text-textLight placeholder-textMuted focus:outline-none"
                />
                {taskSearchQuery && (
                  <button
                    onClick={() => setTaskSearchQuery("")}
                    className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : Object.keys(tasksData).length === 0 ? (
              <div className="text-center py-12 text-textMuted">
                <p>No tasks found. Create some user stories first.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.keys(tasksData).map((storyId) => {
                  // Find story details
                  let storyDetails = null;
                  for (const projectId in groupedStories) {
                    const story = groupedStories[projectId].find(s => String(s.id) === String(storyId));
                    if (story) {
                      storyDetails = story;
                      break;
                    }
                  }

                  const tasks = tasksData[storyId] || [];
                  
                  // Filter tasks by search query
                  const filteredTasks = tasks.filter(task => {
                    const q = (taskSearchQuery || "").toLowerCase();
                    if (!q) return true;
                    const taskText = `${task.tasks || ""} ${task.subtasks || ""}`.toLowerCase();
                    return taskText.includes(q);
                  });

                  if (filteredTasks.length === 0 && taskSearchQuery) return null;

                  return (
                    <div key={storyId} className="border border-border/50 rounded-xl overflow-hidden">
                      {/* Story Header */}
                      <div className="bg-gradient-to-r from-primary/20 to-primary/10 border-b border-border p-4">
                        <p className="text-textPrimary text-base mb-2">
                          As a <span className="text-primary font-semibold">{storyDetails?.role || 'User'}</span>, 
                          I want to <span className="text-primary font-semibold">{storyDetails?.goal || '...'}</span>, 
                          so that <span className="text-primary font-semibold">{storyDetails?.benefit || '...'}</span>.
                        </p>
                        <div className="flex gap-3 text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(storyDetails?.priority)}`}>
                            {storyDetails?.priority}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(storyDetails?.status)}`}>
                            {storyDetails?.status}
                          </span>
                        </div>
                      </div>

                      {/* Tasks List */}
                      <div className="p-4 space-y-3">
                        {filteredTasks.length === 0 ? (
                          <p className="text-textMuted text-sm">No tasks for this story</p>
                        ) : (
                          filteredTasks.map((task, idx) => (
                            <motion.div
                              key={task.task_id || idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: idx * 0.05 }}
                              className="bg-nightBlue/50 border border-border/30 rounded-lg p-3"
                            >
                              <div className="flex flex-col gap-2">
                                <p className="text-textPrimary font-medium text-sm">{task.tasks || 'Unnamed Task'}</p>
                                {task.subtasks && (
                                  <p className="text-textSecondary text-xs ml-4 pl-3 border-l border-sandTan/30">
                                    📌 {task.subtasks}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
