import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast, { Toaster } from 'react-hot-toast';
import { getSprintBacklog, createSprint, addTaskToSprint, removeTaskFromSprint, reoptimizeSprint, getAllSprints, getProjectsByWorkspace, getSprintsByProject } from '../../config/api';

export default function SprintManagement({ sprints, selectedSprintId, setSelectedSprintId, onSprintCreated }) {
  const [activeView, setActiveView] = useState("current"); // 'current', 'planning', 'history'
  const [loading, setLoading] = useState(false);
  const [sprintData, setSprintData] = useState(null);
  const [sprintItems, setSprintItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectSprints, setProjectSprints] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    workspace_id: '',
    project_id: '',
    name: '',
    goal: '',
    start_date: '',
    end_date: ''
  });
  const [addTaskFormData, setAddTaskFormData] = useState({
    task_id: ''
  });
  
  // Mock data for planning view (to be replaced with API data)
  const [upcomingSprint, setUpcomingSprint] = useState({
    id: 'Sprint-2',
    name: 'Sprint Planning',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    duration: 14,
    capacity: 40,
    status: 'Planning',
    plannedStories: []
  });
  
  // Mock data for history view (to be replaced with API data)
  const [sprintHistory, setSprintHistory] = useState([]);

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, []);

  // Load sprint data when selectedSprintId changes (from props or local selection)
  useEffect(() => {
    if (selectedSprintId) {
      loadSprintData(selectedSprintId);
    }
  }, [selectedSprintId]);

  const loadProjects = async () => {
    try {
      const workspaceId = localStorage.getItem('workspaceId');
      if (!workspaceId) {
        console.warn('No workspaceId in localStorage, cannot load projects');
        setProjects([]);
        return;
      }

      const data = await getProjectsByWorkspace(workspaceId);
      const projectsArray = Array.isArray(data) ? data : [];
      setProjects(projectsArray);

      // Auto-select first project and load its sprints only if no project is currently selected
      if (projectsArray.length > 0 && !selectedProjectId) {
        const firstProjectId = projectsArray[0].id.toString();
        setSelectedProjectId(firstProjectId);
        await loadSprintsByProject(firstProjectId);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
      setProjects([]);
    }
  };

  const loadSprintsByProject = async (projectId) => {
    try {
      const data = await getSprintsByProject(projectId);

      let sprintsArray = [];
      if (Array.isArray(data)) {
        sprintsArray = data;
      } else if (data?.results && Array.isArray(data.results)) {
        sprintsArray = data.results;
      } else if (data?.sprints && Array.isArray(data.sprints)) {
        sprintsArray = data.sprints;
      } else if (data?.data && Array.isArray(data.data)) {
        sprintsArray = data.data;
      }

      setProjectSprints(sprintsArray);

      const normalizedSelectedSprintId = selectedSprintId ? selectedSprintId.toString() : '';
      const currentSprintExists = sprintsArray.some(sprint => sprint.id && sprint.id.toString() === normalizedSelectedSprintId);

      if (sprintsArray.length > 0 && !currentSprintExists) {
        const firstSprintId = sprintsArray[0].id?.toString() || '';
        setSelectedSprintId(firstSprintId);
        if (firstSprintId) {
          await loadSprintData(firstSprintId);
        }
      } else if (sprintsArray.length === 0) {
        setSprintData(null);
        setSprintItems([]);
      }
    } catch (error) {
      console.error('Failed to load sprints by project:', error);
      setProjectSprints([]);
      setSprintData(null);
      setSprintItems([]);
    }
  };

  const loadSprintData = async (sprintId) => {
    setLoading(true);
    try {
      const data = await getSprintBacklog(sprintId);
      setSprintData(data?.sprint || null);
      setSprintItems(data?.items || []);
    } catch (error) {
      toast.error('Failed to load sprint data: ' + error.message);
      setSprintData(null);
      setSprintItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSprint = async () => {
    try {
      await createSprint(createFormData);
      toast.success('Sprint created successfully');
      setShowCreateModal(false);
      setCreateFormData({
        workspace_id: '',
        project_id: '',
        name: '',
        goal: '',
        start_date: '',
        end_date: ''
      });
      setProjectSprints([]); // Clear project sprints when modal closes
      if (onSprintCreated) onSprintCreated(); // Refresh sprints list
    } catch (error) {
      toast.error('Failed to create sprint: ' + error.message);
    }
  };

  const handleAddTask = async () => {
    if (!selectedSprintId) return;
    try {
      await addTaskToSprint(selectedSprintId, addTaskFormData.task_id);
      toast.success('Task added successfully');
      setShowAddTaskModal(false);
      setAddTaskFormData({ task_id: '' });
      loadSprintData(selectedSprintId); // Refresh sprint data
    } catch (error) {
      toast.error('Failed to add task: ' + error.message);
    }
  };

  const handleRemoveTask = async (taskId) => {
    if (!selectedSprintId) return;
    if (!confirm('Remove task from sprint?')) return;
    try {
      await removeTaskFromSprint(selectedSprintId, taskId);
      toast.success('Task removed successfully');
      loadSprintData(selectedSprintId); // Refresh sprint data
    } catch (error) {
      toast.error('Failed to remove task: ' + error.message);
    }
  };

  const handleReoptimize = async () => {
    if (!selectedSprintId || !sprintData) return;
    try {
      await reoptimizeSprint(selectedSprintId, sprintData.project_id);
      toast.success('Sprint optimized successfully');
      loadSprintData(selectedSprintId); // Refresh sprint data
    } catch (error) {
      toast.error('Failed to reoptimize sprint: ' + error.message);
    }
  };

  const currentSprint = sprintData || {};
  const sprintStories = sprintItems || [];

  const summaryName = currentSprint.name || currentSprint.sprint_name || 'Sprint not selected';
  const summaryGoal = currentSprint.goal || currentSprint.sprint_goal || '';
  const summaryStart = currentSprint.start_date || currentSprint.startDate || '';
  const summaryEnd = currentSprint.end_date || currentSprint.endDate || '';
  const summaryProgress = currentSprint.progress || currentSprint.sprint_progress || 0;
  const summaryStatus = currentSprint.is_active ? 'Active' : (currentSprint.status || 'Inactive');
  const summaryUsed = currentSprint.total_selected_hours || 0;
  const summaryCapacity = currentSprint.total_team_capacity_hours || 0;

  const completedCount = sprintStories.filter((s) => (s.status || s.task_progress_status || '').toLowerCase().includes('completed')).length;
  const inProgressCount = sprintStories.filter((s) => (s.status || s.task_progress_status || '').toLowerCase().includes('in progress')).length;

  const getStatusColor = (status) => {
    switch (status) {
      case "Active": return "bg-green-500/20 text-green-400";
      case "Planning": return "bg-blue-500/20 text-blue-400";
      case "Completed": return "bg-gray-500/20 text-gray-400";
      case "In Progress": return "bg-blue-500/20 text-blue-400";
      case "Ready": return "bg-gray-500/20 text-gray-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High": return "bg-red-500/20 text-red-400";
      case "Medium": return "bg-yellow-500/20 text-yellow-400";
      case "Low": return "bg-green-500/20 text-green-400";
      default: return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Toaster position="top-right" />
      
      {/* Header with controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div className="flex gap-4 items-center">
          <button
            onClick={() => setActiveView("current")}
            className={`px-6 py-3 rounded-lg transition-all ${
              activeView === "current"
                ? "bg-sandTan text-nightBlue shadow-lg"
                : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
            }`}
          >
            🏃 Current Sprint
          </button>
          <button
            onClick={() => setActiveView("planning")}
            className={`px-6 py-3 rounded-lg transition-all ${
              activeView === "planning"
                ? "bg-sandTan text-nightBlue shadow-lg"
                : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
            }`}
          >
            📋 Sprint Planning
          </button>
          <button
            onClick={() => setActiveView("history")}
            className={`px-6 py-3 rounded-lg transition-all ${
              activeView === "history"
                ? "bg-sandTan text-nightBlue shadow-lg"
                : "border border-sandTan text-sandTan hover:bg-sandTan hover:text-nightBlue"
            }`}
          >
            📊 Sprint History
          </button>

          {projects.length > 0 && (
            <select
              value={selectedProjectId || ''}
              onChange={async (e) => {
                const projectId = e.target.value;
                setSelectedProjectId(projectId);
                if (projectId) {
                  await loadSprintsByProject(projectId);
                } else {
                  setProjectSprints([]);
                  setSprintData(null);
                  setSprintItems([]);
                }
              }}
              className="px-4 py-3 rounded-lg bg-nightBlue border border-sandTan/30 text-textLight focus:outline-none focus:border-sandTan"
            >
              <option value="">All Projects</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name || project.project_name || `Project ${project.id}`}
                </option>
              ))}
            </select>
          )}
        </div>
        
        <div className="flex gap-4 items-center">
          <select
            value={selectedSprintId || ''}
            onChange={(e) => {
              const sprintId = e.target.value;
              setSelectedSprintId(sprintId);
              if (sprintId) {
                loadSprintData(sprintId);
              }
            }}
            disabled={projectSprints.length === 0}
            className="px-4 py-3 rounded-lg bg-nightBlue border border-sandTan/30 text-textLight focus:outline-none focus:border-sandTan disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">{projectSprints.length === 0 ? 'No sprints available' : 'Select Sprint'}</option>
            {projectSprints.map(sprint => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name || 'Unnamed Sprint'}{sprint.start_date && sprint.end_date ? ` (${sprint.start_date} - ${sprint.end_date})` : ''}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setShowCreateModal(true);
              // Pre-fill form with current selections
              const workspaceId = localStorage.getItem('workspaceId');
              setCreateFormData({
                workspace_id: workspaceId || '',
                project_id: selectedProjectId || '',
                name: '',
                goal: '',
                start_date: '',
                end_date: ''
              });
            }}
            className="px-6 py-3 bg-sandTan text-nightBlue rounded-lg hover:bg-sandTanShadow transition-all shadow-lg"
          >
            + Create Sprint
          </button>
        </div>
      </div>

      {/* Current Sprint View */}
      {activeView === "current" && (
        <div className="space-y-8">
          {/* Sprint Overview */}
          {loading ? (
            <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
              <div className="animate-pulse">
                <div className="h-8 bg-nightBlue rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-nightBlue rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-nightBlue rounded w-1/3 mb-6"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-nightBlue/60 rounded-xl p-4">
                      <div className="h-6 bg-nightBlue rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-nightBlue rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : sprintData ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-sandTan mb-2">{summaryName}</h2>
                  <p className="text-textMuted text-lg">{summaryGoal}</p>
                  <p className="text-textMuted text-sm">
                    {summaryStart} - {summaryEnd}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-sandTan">{summaryProgress}%</div>
                    <div className="text-textMuted text-sm">Complete</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-sandTan">{summaryUsed}/{summaryCapacity}</div>
                    <div className="text-textMuted text-sm">Points</div>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(summaryStatus)}`}>
                    {summaryStatus}
                  </span>
                  <button
                    onClick={handleReoptimize}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
                    disabled={loading}
                  >
                    Reoptimize Sprint
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-nightBlueShadow rounded-full h-4 mb-6">
                <div
                  className="bg-sandTan h-4 rounded-full transition-all duration-500"
                  style={{ width: `${summaryProgress}%` }}
                />
              </div>

              {/* Sprint Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4 text-center">
                  <div className="text-lg font-bold text-textLight">{currentSprint.team_size || currentSprint.teamSize || 0}</div>
                  <div className="text-textMuted text-sm">Team Members</div>
                </div>
                <div className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4 text-center">
                  <div className="text-lg font-bold text-textLight">{sprintStories.length}</div>
                  <div className="text-textMuted text-sm">User Stories</div>
                </div>
                <div className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4 text-center">
                  <div className="text-lg font-bold text-textLight">{completedCount}</div>
                  <div className="text-textMuted text-sm">Completed</div>
                </div>
                <div className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4 text-center">
                  <div className="text-lg font-bold text-textLight">{inProgressCount}</div>
                  <div className="text-textMuted text-sm">In Progress</div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6 text-center">
              <p className="text-textMuted">No sprint data available</p>
            </div>
          )}

          {/* Sprint Stories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-sandTan">Sprint Stories</h2>
              <button
                onClick={() => setShowAddTaskModal(true)}
                className="px-4 py-2 bg-sandTan text-nightBlue rounded-lg hover:bg-sandTanShadow transition-all"
              >
                + Add Task
              </button>
            </div>
            
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4 animate-pulse">
                    <div className="h-6 bg-nightBlue rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-nightBlue rounded w-2/3 mb-2"></div>
                    <div className="h-4 bg-nightBlue rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            ) : (() => {
              const stories = sprintItems || [];
              if (stories.length === 0) {
                return (
                  <div className="text-center py-8">
                    <p className="text-textMuted">No tasks in sprint</p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {stories.map((story, index) => {
                    const title = story.tasks || story.task_name || 'Untitled Task';
                    const description = story.description || story.task_description || 'No description';
                    const priority = story.priority || 'Medium';
                    const storyPoints = story.estimated_hours || story.story_points || story.points || 0;
                    const status = story.status || story.task_progress_status || 'Pending';
                    const assignedTo = story.assigned_user || story.assigned_to || story.assignee || 'Unassigned';
                    const progress = story.progress || story.task_progress || 0;

                    return (
                      <div key={story.task_id || story.id || index} className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-textLight font-semibold mb-1">{title}</h3>
                            <p className="text-textMuted text-sm mb-2">{description}</p>
                            <div className="flex flex-wrap gap-3 text-sm text-textMuted">
                              <span>Estimated: {storyPoints}h</span>
                              <span>Skills: {story.skills_required || 'N/A'}</span>
                              <span>Added: {story.added_at ? new Date(story.added_at).toLocaleDateString() : 'N/A'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-nightBlueShadow rounded-full h-2">
                                <div
                                  className="bg-sandTan h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min(100, progress)}%` }}
                                />
                              </div>
                              <span className="text-sandTan text-sm font-semibold">{Math.min(100, progress)}%</span>
                            </div>
                            <div className="flex flex-col gap-2">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(priority)}`}>
                                {priority}
                              </span>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                                {status}
                              </span>
                            </div>
                            <button
                              onClick={() => handleRemoveTask(story.task_id || story.id)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                              title="Remove from sprint"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </motion.div>
        </div>
      )}

      {/* Sprint Planning View */}
      {activeView === "planning" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Next Sprint Overview */}
          <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-sandTan mb-2">{upcomingSprint.id}</h2>
                <p className="text-textMuted text-lg">{upcomingSprint.name}</p>
                <p className="text-textMuted text-sm">
                  {upcomingSprint.startDate} - {upcomingSprint.endDate} ({upcomingSprint.duration} days)
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-sandTan">{upcomingSprint.capacity}</div>
                  <div className="text-textMuted text-sm">Capacity</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-sandTan">
                    {upcomingSprint.plannedStories.reduce((sum, story) => sum + story.estimate, 0)}
                  </div>
                  <div className="text-textMuted text-sm">Planned Points</div>
                </div>
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(upcomingSprint.status)}`}>
                  {upcomingSprint.status}
                </span>
              </div>
            </div>
          </div>

          {/* Planned Stories */}
          <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-sandTan mb-6">Planned Stories</h2>
            
            <div className="space-y-4">
              {upcomingSprint.plannedStories.map((story, index) => (
                <div key={story.id} className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-textLight font-semibold mb-1">{story.title}</h3>
                      <p className="text-textMuted text-sm mb-2">{story.description}</p>
                      <div className="flex items-center gap-4 text-sm text-textMuted">
                        <span>Estimate: {story.estimate} points</span>
                        <span>Assignee: {story.assignee || "Unassigned"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(story.priority)}`}>
                        {story.priority}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(story.status)}`}>
                        {story.status}
                      </span>
                      <button className="bg-sandTan text-nightBlue px-3 py-1 rounded text-sm hover:bg-sandTanShadow transition-all">
                        Assign
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Planning Tools */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-sandTan mb-4">Sprint Goals</h3>
              <textarea
                placeholder="Define your sprint goals and objectives..."
                className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-3 text-textLight focus:outline-none focus:border-sandTan h-32 resize-none"
              />
            </div>
            <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-sandTan mb-4">Sprint Notes</h3>
              <textarea
                placeholder="Add any important notes or considerations..."
                className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-3 text-textLight focus:outline-none focus:border-sandTan h-32 resize-none"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Sprint History View */}
      {activeView === "history" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-sandTan mb-6">Sprint History</h2>
            
            <div className="space-y-4">
              {sprintHistory.map((sprint, index) => (
                <div key={sprint.id} className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-sandTan mb-1">{sprint.id}</h3>
                      <p className="text-textMuted text-sm mb-2">{sprint.name}</p>
                      <p className="text-textMuted text-xs">
                        {sprint.startDate} - {sprint.endDate}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-lg font-bold text-textLight">{sprint.velocity}</div>
                        <div className="text-textMuted text-sm">Velocity</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-textLight">{sprint.completed}/{sprint.planned}</div>
                        <div className="text-textMuted text-sm">Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-textLight">
                          {Math.round((sprint.completed / sprint.planned) * 100)}%
                        </div>
                        <div className="text-textMuted text-sm">Success Rate</div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(sprint.status)}`}>
                        {sprint.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Velocity Trend */}
          <div className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-sandTan mb-6">Velocity Trend</h2>
            
            <div className="space-y-4">
              {sprintHistory.map((sprint, index) => (
                <div key={sprint.id} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-textMuted">{sprint.id}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4 bg-sandTan rounded"></div>
                      <span className="text-sm text-textLight">Velocity: {sprint.velocity}</span>
                    </div>
                    <div className="w-full bg-nightBlueShadow rounded-full h-2">
                      <div
                        className="bg-sandTan h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(sprint.velocity / 50) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Create Sprint Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-border rounded-2xl p-4 w-full max-w-sm mx-4 max-h-[90vh] overflow-y-auto shadow-xl"
          >
            <h3 className="text-xl font-bold text-textPrimary mb-4">Create New Sprint</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-textPrimary mb-1">Workspace ID</label>
                <input
                  type="number"
                  value={createFormData.workspace_id}
                  disabled
                  className="w-full bg-surface border border-border rounded-lg p-3 text-textPrimary focus:outline-none focus:border-primary cursor-not-allowed"
                  placeholder="Enter workspace ID"
                />
              </div>
              <div>
                <label className="block text-textPrimary mb-1">Project</label>
                <select
                  value={createFormData.project_id}
                  onChange={(e) => {
                    const projectId = e.target.value;
                    setCreateFormData({...createFormData, project_id: projectId});
                    setSelectedProjectId(projectId); // Sync with main page selector
                    if (projectId) {
                      loadSprintsByProject(projectId);
                    } else {
                      setProjectSprints([]);
                    }
                  }}
                  className="w-full bg-surface border border-border rounded-lg p-3 text-textPrimary focus:outline-none focus:border-primary"
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name || project.project_name || `Project ${project.id}`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-textPrimary mb-1">Sprint Name</label>
                <input
                  type="text"
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData({...createFormData, name: e.target.value})}
                  className="w-full bg-surface border border-border rounded-lg p-3 text-textPrimary focus:outline-none focus:border-primary"
                  placeholder="Enter sprint name"
                />
              </div>
              <div>
                <label className="block text-textPrimary mb-1">Sprint Goal</label>
                <textarea
                  value={createFormData.goal}
                  onChange={(e) => setCreateFormData({...createFormData, goal: e.target.value})}
                  className="w-full bg-surface border border-border rounded-lg p-3 text-textPrimary focus:outline-none focus:border-primary h-20 resize-none"
                  placeholder="Enter sprint goal"
                />
              </div>
              <div>
                <label className="block text-textPrimary mb-1">Start Date</label>
                <input
                  type="date"
                  value={createFormData.start_date}
                  onChange={(e) => setCreateFormData({...createFormData, start_date: e.target.value})}
                  className="w-full bg-surface border border-border rounded-lg p-3 text-textPrimary focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-textPrimary mb-1">End Date</label>
                <input
                  type="date"
                  value={createFormData.end_date}
                  onChange={(e) => setCreateFormData({...createFormData, end_date: e.target.value})}
                  className="w-full bg-surface border border-border rounded-lg p-3 text-textPrimary focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setProjectSprints([]); // Clear project sprints when modal closes
                }}
                className="flex-1 px-4 py-2 border border-border text-textSecondary rounded-lg hover:bg-surface transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSprint}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryDark transition-all"
              >
                Create Sprint
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-nightBlue border border-sandTan/30 rounded-2xl p-6 w-full max-w-md mx-4"
          >
            <h3 className="text-xl font-bold text-sandTan mb-4">Add Task to Sprint</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-textLight mb-1">Task ID</label>
                <input
                  type="text"
                  value={addTaskFormData.task_id}
                  onChange={(e) => setAddTaskFormData({...addTaskFormData, task_id: e.target.value})}
                  className="w-full bg-nightBlue border border-sandTan/30 rounded-lg p-3 text-textLight focus:outline-none focus:border-sandTan"
                  placeholder="Enter task ID"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setShowAddTaskModal(false)}
                className="flex-1 px-4 py-2 border border-sandTan/30 text-textLight rounded-lg hover:bg-nightBlue transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                className="flex-1 px-4 py-2 bg-sandTan text-nightBlue rounded-lg hover:bg-sandTanShadow transition-all"
              >
                Add Task
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}