import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast, { Toaster } from 'react-hot-toast';
import { getSprintBacklog, createSprint, addTaskToSprint, removeTaskFromSprint, getProjectsByWorkspace, getSprintsByProject, updateTaskStatus, deactivateSprint, editSprint, deleteSprint } from '../../config/api';

const MAX_SPRINT_DURATION_DAYS = 14;
const TASK_STATUS_CHOICES = ['pending', 'In Progress', 'Completed'];

export default function SprintManagement({ sprints, selectedSprintId, setSelectedSprintId, onSprintCreated }) {
  const [activeView, setActiveView] = useState("current"); // 'current', 'history'
  const [loading, setLoading] = useState(false);
  const [sprintData, setSprintData] = useState(null);
  const [sprintItems, setSprintItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectSprints, setProjectSprints] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAutoCreateModal, setShowAutoCreateModal] = useState(false);
  const [isAutoCreatingSprint, setIsAutoCreatingSprint] = useState(false);
  const [autoPromptedSprintId, setAutoPromptedSprintId] = useState('');
  const [deactivationInProgressSprintId, setDeactivationInProgressSprintId] = useState('');
  const [deactivatedSprintIds, setDeactivatedSprintIds] = useState([]);
  const [statusUpdatingTaskId, setStatusUpdatingTaskId] = useState(null);
  const [autoCreateFormData, setAutoCreateFormData] = useState({
    source_sprint_id: '',
    name: '',
    start_date: '',
    end_date: ''
  });
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
  
  // Edit and Delete Sprint States
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSprintId, setEditingSprintId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: ''
  });
  const [isEditingSprint, setIsEditingSprint] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingSprintId, setDeletingSprintId] = useState(null);
  const [isDeletingSprint, setIsDeletingSprint] = useState(false);
  
  // Sprint history data for selected project
  const [sprintHistory, setSprintHistory] = useState([]);

  const getSprintDateDifferenceInDays = (startDate, endDate) => {
    if (!startDate || !endDate) return null;

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    return Math.round((end - start) / (1000 * 60 * 60 * 24));
  };

  const getMaxSprintEndDate = (startDate) => {
    if (!startDate) return '';

    const maxEndDate = new Date(`${startDate}T00:00:00`);
    maxEndDate.setDate(maxEndDate.getDate() + MAX_SPRINT_DURATION_DAYS);
    return maxEndDate.toISOString().split('T')[0];
  };

  const getBackendErrorMessage = (error, fallbackMessage) => {
    const responseData = error?.response?.data;

    if (typeof responseData === 'string' && responseData.trim()) {
      return responseData;
    }

    if (responseData?.message) {
      return responseData.message;
    }

    if (responseData?.detail) {
      return responseData.detail;
    }

    if (responseData?.error) {
      return responseData.error;
    }

    if (Array.isArray(responseData?.errors) && responseData.errors.length > 0) {
      return responseData.errors
        .map((item) => item?.message || item?.detail || item)
        .filter(Boolean)
        .join(', ');
    }

    return error?.message || fallbackMessage;
  };

  const toInputDate = (date) => {
    if (!date || Number.isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  const addDaysToDateString = (dateString, dayCount) => {
    if (!dateString) return '';
    const date = new Date(`${dateString}T00:00:00`);
    if (Number.isNaN(date.getTime())) return '';
    date.setDate(date.getDate() + dayCount);
    return toInputDate(date);
  };

  const getSprintIdFromResponse = (responseData) => {
    if (!responseData) return '';

    return (
      responseData?.id ||
      responseData?.sprint_id ||
      responseData?.sprint?.id ||
      responseData?.data?.id ||
      ''
    );
  };

  const extractSprintsArray = (data) => {
    if (Array.isArray(data)) return data;
    if (data?.results && Array.isArray(data.results)) return data.results;
    if (data?.sprints && Array.isArray(data.sprints)) return data.sprints;
    if (data?.data && Array.isArray(data.data)) return data.data;
    return [];
  };

  const isCompletedSprint = (sprint) => {
    const statusValue = (sprint?.status || '').toLowerCase();
    return sprint?.is_active === false || statusValue === 'completed' || statusValue === 'inactive';
  };

  const getSprintStatusLabel = (sprint) => {
    const rawStatus = (sprint?.status || '').toLowerCase();

    if (sprint?.is_active === true) return 'Running';
    if (rawStatus === 'in progress' || rawStatus === 'running' || rawStatus === 'active') return 'Running';
    if (rawStatus === 'completed') return 'Completed';
    if (rawStatus === 'planning') return 'Planning';
    if (rawStatus === 'ready') return 'Ready';
    if (sprint?.is_active === false || rawStatus === 'inactive') return 'Completed';

    return sprint?.status || 'Unknown';
  };

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

  useEffect(() => {
    setSprintHistory(projectSprints);
  }, [projectSprints]);

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

      const sprintsArray = extractSprintsArray(data);

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

  // Check if a new sprint can be created for the selected project
  const getActiveSprint = () => {
    return projectSprints.find(sprint => sprint?.is_active === true);
  };

  const canCreateNewSprint = () => {
    const activeSprint = getActiveSprint();
    
    // If no active sprint exists, new sprint can be created
    if (!activeSprint) {
      return { canCreate: true, message: '' };
    }

    // Get all tasks for the active sprint
    const activeSprintId = activeSprint?.id;
    if (selectedSprintId && selectedSprintId.toString() === activeSprintId?.toString()) {
      // Current sprint is selected, we have task data
      const completedCount = sprintTasks.filter(
        (task) => (getTaskStatusValue(task) || '').toLowerCase() === 'completed'
      ).length;
      const totalTaskCount = sprintTasks.length;

      if (totalTaskCount === 0) {
        return {
          canCreate: true,
          message: ''
        };
      }

      const isComplete = completedCount === totalTaskCount &&
        (activeSprint?.is_active === false || activeSprint?.status?.toLowerCase() === 'completed');

      if (!isComplete) {
        const progressPercent = Math.round((completedCount / totalTaskCount) * 100);
        return {
          canCreate: false,
          message: `Cannot create a new sprint. Current sprint "${activeSprint?.name || 'Active Sprint'}" is still in progress (${progressPercent}% tasks completed). Complete all tasks and mark the sprint as completed first.`
        };
      }

      return { canCreate: true, message: '' };
    } else {
      // Active sprint is not selected, we need to assume it's not complete
      // Show a warning message
      return {
        canCreate: false,
        message: `Cannot create a new sprint. Project has an active sprint "${activeSprint?.name || 'Active Sprint'}" that must be completed first. Please complete all tasks in the current sprint and mark it as completed.`
      };
    }
  };

  const handleCreateSprint = async () => {
    // Check if new sprint can be created
    const sprintValidation = canCreateNewSprint();
    if (!sprintValidation.canCreate) {
      toast.error(sprintValidation.message);
      return;
    }

    // Get workspace_id from localStorage if not in form data
    const workspaceId = createFormData.workspace_id || localStorage.getItem('workspaceId');
    const { project_id, name, start_date, end_date } = createFormData;
    const sprintDurationDays = getSprintDateDifferenceInDays(start_date, end_date);

    if (!workspaceId || !project_id || !name || !start_date || !end_date) {
      toast.error('Please fill in all sprint details before creating it.');
      return;
    }

    if (sprintDurationDays === null || Number.isNaN(sprintDurationDays)) {
      toast.error('Please choose valid sprint dates.');
      return;
    }

    if (sprintDurationDays < 0) {
      toast.error('End date must be on or after the start date.');
      return;
    }

    if (sprintDurationDays > MAX_SPRINT_DURATION_DAYS) {
      toast.error('Sprint duration cannot be longer than 2 weeks.');
      return;
    }

    try {
      // Pass workspace_id from localStorage in the request
      const createResponse = await createSprint({ ...createFormData, workspace_id: workspaceId });
      const createdSprintId = getSprintIdFromResponse(createResponse);
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

      // Refresh sprints and auto-select the newly created sprint
      if (project_id) {
        const refreshedSprintsRaw = await getSprintsByProject(project_id);
        const refreshedSprints = extractSprintsArray(refreshedSprintsRaw);
        setProjectSprints(refreshedSprints);

        const createdSprintMatch = refreshedSprints.find((sprint) => {
          const sprintId = sprint?.id ? sprint.id.toString() : '';
          const responseId = createdSprintId ? createdSprintId.toString() : '';
          if (sprintId && responseId && sprintId === responseId) return true;

          const sprintName = sprint?.name || sprint?.sprint_name || '';
          const sprintStart = sprint?.start_date || sprint?.startDate || '';
          const sprintEnd = sprint?.end_date || sprint?.endDate || '';
          return sprintName === name && sprintStart === start_date && sprintEnd === end_date;
        });

        const sprintIdToSelect = createdSprintMatch?.id ? createdSprintMatch.id.toString() : (createdSprintId ? createdSprintId.toString() : '');
        if (sprintIdToSelect) {
          setSelectedSprintId(sprintIdToSelect);
          await loadSprintData(sprintIdToSelect);
        }
      }

      if (onSprintCreated) onSprintCreated(); // Refresh sprints list
    } catch (error) {
      toast.error(getBackendErrorMessage(error, 'Failed to create sprint.'));
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

  const getTaskStatusValue = (task) => {
    const receivedStatus = task?.status ?? task?.task_progress_status;
    return receivedStatus ?? 'pending';
  };

  const openEditModal = (sprint) => {
    setEditingSprintId(sprint.id);
    setEditFormData({
      name: sprint.name || sprint.sprint_name || '',
      description: sprint.goal || sprint.sprint_goal || sprint.description || ''
    });
    setShowEditModal(true);
  };

  const handleEditSprint = async () => {
    if (!editingSprintId) return;
    if (!editFormData.name.trim() && !editFormData.description.trim()) {
      toast.error('Please enter at least a sprint name or description.');
      return;
    }

    setIsEditingSprint(true);
    try {
      const payload = {};
      if (editFormData.name.trim()) payload.name = editFormData.name.trim();
      if (editFormData.description.trim()) payload.description = editFormData.description.trim();

      await editSprint(editingSprintId, payload);
      toast.success('Sprint updated successfully');
      setShowEditModal(false);
      setEditingSprintId(null);
      setEditFormData({ name: '', description: '' });
      
      // Refresh sprint history
      const updatedSprints = projectSprints.map(sprint => 
        sprint.id === editingSprintId 
          ? {
              ...sprint,
              name: payload.name || sprint.name,
              goal: payload.description || sprint.goal,
              description: payload.description || sprint.description
            }
          : sprint
      );
      setProjectSprints(updatedSprints);
      setSprintHistory(updatedSprints.filter(isCompletedSprint));
    } catch (error) {
      toast.error(getBackendErrorMessage(error, 'Failed to update sprint.'));
    } finally {
      setIsEditingSprint(false);
    }
  };

  const openDeleteConfirm = (sprint) => {
    setDeletingSprintId(sprint.id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteSprint = async () => {
    if (!deletingSprintId) return;

    setIsDeletingSprint(true);
    try {
      await deleteSprint(deletingSprintId);
      toast.success('Sprint deleted successfully');
      setShowDeleteConfirm(false);
      setDeletingSprintId(null);

      // Remove sprint from local state
      const updatedSprints = projectSprints.filter(sprint => sprint.id !== deletingSprintId);
      setProjectSprints(updatedSprints);
      setSprintHistory(updatedSprints.filter(isCompletedSprint));
    } catch (error) {
      toast.error(getBackendErrorMessage(error, 'Failed to delete sprint.'));
    } finally {
      setIsDeletingSprint(false);
    }
  };

  const handleTaskStatusChange = async (task, nextStatus) => {
    const taskId = task?.task_id || task?.id;
    if (!taskId || !nextStatus) {
      toast.error('Unable to update task status. Missing task id or status.');
      return;
    }

    const previousStatus = getTaskStatusValue(task);

    setStatusUpdatingTaskId(taskId);
    setSprintItems((prevItems) =>
      prevItems.map((item) => {
        const itemId = item?.task_id || item?.id;
        if (itemId !== taskId) return item;
        return {
          ...item,
          status: nextStatus,
          task_progress_status: nextStatus,
        };
      })
    );

    try {
      await updateTaskStatus(taskId, nextStatus, 'PUT');
      toast.success('Task status updated successfully');
    } catch (error) {
      setSprintItems((prevItems) =>
        prevItems.map((item) => {
          const itemId = item?.task_id || item?.id;
          if (itemId !== taskId) return item;
          return {
            ...item,
            status: previousStatus,
            task_progress_status: previousStatus,
          };
        })
      );
      toast.error(`Failed to update task status: ${error.message}`);
    } finally {
      setStatusUpdatingTaskId(null);
    }
  };

  const currentSprint = sprintData || {};
  const sprintTasks = sprintItems || [];

  const totalTaskCount = sprintTasks.length;
  const completedCount = sprintTasks.filter(
    (task) => (getTaskStatusValue(task) || '').toLowerCase() === 'completed'
  ).length;
  const inProgressCount = sprintTasks.filter(
    (task) => (getTaskStatusValue(task) || '').toLowerCase() === 'in progress'
  ).length;
  const summaryProgress = totalTaskCount > 0 ? Math.round((completedCount / totalTaskCount) * 100) : 0;

  const summaryName = currentSprint.name || currentSprint.sprint_name || 'Sprint not selected';
  const summaryGoal = currentSprint.goal || currentSprint.sprint_goal || '';
  const summaryStart = currentSprint.start_date || currentSprint.startDate || '';
  const summaryEnd = currentSprint.end_date || currentSprint.endDate || '';
  const summaryStatus = currentSprint.is_active ? 'Active' : (currentSprint.status || 'Inactive');
  const summaryUsed = completedCount;
  const summaryCapacity = totalTaskCount;
  const remainingTaskIds = sprintTasks
    .filter((task) => (getTaskStatusValue(task) || '').toLowerCase() !== 'completed')
    .map((task) => task?.task_id || task?.id)
    .filter(Boolean);

  const openAutoCreateNextSprint = () => {
    if (!summaryEnd) return;

    const sourceSprintId = (currentSprint?.id || selectedSprintId || '').toString();
    const nextStartDate = addDaysToDateString(summaryEnd, 1);
    const nextEndDate = addDaysToDateString(nextStartDate, MAX_SPRINT_DURATION_DAYS);

    if (!sourceSprintId || !nextStartDate || !nextEndDate) return;

    setAutoCreateFormData({
      source_sprint_id: sourceSprintId,
      name: '',
      start_date: nextStartDate,
      end_date: nextEndDate,
    });
    setShowAutoCreateModal(true);
    setAutoPromptedSprintId(sourceSprintId);
  };

  const deactivateCompletedSprint = async (sourceSprintId) => {
    if (!sourceSprintId) return true;
    if (currentSprint?.is_active === false) return true;
    if (deactivatedSprintIds.includes(sourceSprintId)) return true;

    setDeactivationInProgressSprintId(sourceSprintId);
    try {
      await deactivateSprint(sourceSprintId);
      setDeactivatedSprintIds((prev) => [...prev, sourceSprintId]);

      setSprintData((prevSprint) => {
        if (!prevSprint) return prevSprint;
        const prevSprintId = (prevSprint.id || '').toString();
        if (prevSprintId !== sourceSprintId.toString()) return prevSprint;
        return {
          ...prevSprint,
          is_active: false,
          status: 'Inactive',
        };
      });

      setProjectSprints((prevSprints) =>
        prevSprints.map((sprint) => {
          const sprintId = (sprint?.id || '').toString();
          if (sprintId !== sourceSprintId.toString()) return sprint;
          return {
            ...sprint,
            is_active: false,
            status: sprint?.status || 'Inactive',
          };
        })
      );

      toast.success('Sprint marked as inactive.');
      return true;
    } catch (error) {
      toast.error(getBackendErrorMessage(error, 'Failed to mark sprint inactive.'));
      return false;
    } finally {
      setDeactivationInProgressSprintId('');
    }
  };

  useEffect(() => {
    if (!sprintData) return;
    if (totalTaskCount === 0 || summaryProgress < 100) return;
    if (showAutoCreateModal || isAutoCreatingSprint) return;

    const sourceSprintId = (currentSprint?.id || selectedSprintId || '').toString();
    if (!sourceSprintId) return;

    const completeFlow = async () => {
      if (deactivationInProgressSprintId === sourceSprintId) return;

      const deactivated = await deactivateCompletedSprint(sourceSprintId);
      if (!deactivated) return;
      if (autoPromptedSprintId === sourceSprintId) return;

      openAutoCreateNextSprint();
    };

    completeFlow();
  }, [
    sprintData,
    totalTaskCount,
    summaryProgress,
    summaryEnd,
    selectedSprintId,
    autoPromptedSprintId,
    showAutoCreateModal,
    isAutoCreatingSprint,
    deactivationInProgressSprintId,
    deactivatedSprintIds,
  ]);

  const handleAutoCreateNextSprint = async () => {
    const workspaceId = localStorage.getItem('workspaceId') || currentSprint?.workspace_id;
    const projectId = selectedProjectId || currentSprint?.project_id;
    const sprintName = (autoCreateFormData.name || '').trim();

    if (!workspaceId || !projectId) {
      toast.error('Missing workspace or project context for creating the next sprint.');
      return;
    }

    if (!sprintName) {
      toast.error('Please enter a sprint name.');
      return;
    }

    setIsAutoCreatingSprint(true);
    try {
      const createPayload = {
        workspace_id: workspaceId,
        project_id: projectId,
        name: sprintName,
        goal: `Carry-over sprint from ${summaryName}`,
        start_date: autoCreateFormData.start_date,
        end_date: autoCreateFormData.end_date,
      };

      const createdSprint = await createSprint(createPayload);
      let newSprintId = getSprintIdFromResponse(createdSprint);

      if (!newSprintId) {
        const refreshedSprintsRaw = await getSprintsByProject(projectId);
        const refreshedSprints = extractSprintsArray(refreshedSprintsRaw);
        const latestSprint = refreshedSprints
          .slice()
          .sort((a, b) => {
            const aId = Number(a?.id) || 0;
            const bId = Number(b?.id) || 0;
            return bId - aId;
          })[0];
        newSprintId = latestSprint?.id || '';
      }

      if (!newSprintId) {
        throw new Error('Next sprint was created but the new sprint id was not returned.');
      }

      if (remainingTaskIds.length > 0) {
        const addResults = await Promise.allSettled(
          remainingTaskIds.map((taskId) => addTaskToSprint(newSprintId, taskId))
        );
        const failedAdds = addResults.filter((result) => result.status === 'rejected').length;
        if (failedAdds > 0) {
          toast.error(`${failedAdds} task(s) could not be moved to the new sprint.`);
        }
      }

      const refreshedSprintsRaw = await getSprintsByProject(projectId);
      setProjectSprints(extractSprintsArray(refreshedSprintsRaw));

      const nextSprintId = newSprintId.toString();
      setSelectedSprintId(nextSprintId);
      await loadSprintData(nextSprintId);

      setShowAutoCreateModal(false);
      setAutoCreateFormData({
        source_sprint_id: '',
        name: '',
        start_date: '',
        end_date: ''
      });
      toast.success('Next sprint created and selected successfully.');
    } catch (error) {
      toast.error(getBackendErrorMessage(error, 'Failed to auto-create next sprint.'));
    } finally {
      setIsAutoCreatingSprint(false);
    }
  };

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

          {(() => {
            const validation = canCreateNewSprint();
            return (
              <div>
                <button
                  onClick={() => {
                    if (!validation.canCreate) {
                      toast.error(validation.message);
                      return;
                    }
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
                  disabled={!validation.canCreate}
                  className={`px-6 py-3 rounded-lg font-semibold transition-all shadow-lg ${
                    validation.canCreate
                      ? 'bg-sandTan text-nightBlue hover:bg-sandTanShadow cursor-pointer'
                      : 'bg-sandTan/40 text-nightBlue/60 cursor-not-allowed'
                  }`}
                >
                  + Create Sprint
                </button>
              </div>
            );
          })()}
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
                  <div className="text-lg font-bold text-textLight">{sprintTasks.length}</div>
                  <div className="text-textMuted text-sm">Tasks</div>
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

          {/* Sprint Tasks */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-nightBlueShadow/60 border border-sandTan/20 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-sandTan">Sprint Tasks</h2>
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
                    const description = story.description || story.task_description || '';
                    const storyPoints = story.estimated_hours || story.story_points || story.points || 0;
                    const taskId = story.task_id || story.id;
                    const status = getTaskStatusValue(story);
                    const isUpdatingStatus = statusUpdatingTaskId === taskId;

                    return (
                      <div key={taskId || index} className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="text-textLight font-semibold mb-1">{title}</h3>
                            {description ? (
                              <p className="text-textMuted text-sm mb-2">{description}</p>
                            ) : null}
                            <div className="flex flex-wrap gap-3 text-sm text-textMuted">
                              <span>Estimated: {storyPoints}h</span>
                              <span>Skills: {story.skills_required || 'N/A'}</span>
                              <span>Added: {story.added_at ? new Date(story.added_at).toLocaleDateString() : 'N/A'}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <select
                              value={status}
                              onChange={(e) => handleTaskStatusChange(story, e.target.value)}
                              disabled={isUpdatingStatus}
                              className="px-3 py-2 rounded-lg bg-nightBlue border border-sandTan/30 text-textLight focus:outline-none focus:border-sandTan disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {TASK_STATUS_CHOICES.map((statusOption) => (
                                <option key={statusOption} value={statusOption}>
                                  {statusOption}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleRemoveTask(taskId)}
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

            {sprintHistory.length === 0 ? (
              <p className="text-textMuted">No completed sprints found for this project.</p>
            ) : (
              <div className="space-y-4">
                {sprintHistory.map((sprint, index) => {
                  const sprintName = sprint.name || sprint.sprint_name || `Sprint ${sprint.id}`;
                  const sprintStart = sprint.start_date || sprint.startDate || 'N/A';
                  const sprintEnd = sprint.end_date || sprint.endDate || 'N/A';
                  const statusLabel = getSprintStatusLabel(sprint);

                  return (
                    <div key={sprint.id || index} className="bg-nightBlue/60 border border-sandTan/30 rounded-xl p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-sandTan mb-1">{sprintName}</h3>
                          <p className="text-textMuted text-xs">
                            {sprintStart} - {sprintEnd}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(statusLabel)}`}>
                            {statusLabel}
                          </span>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <button
                              onClick={() => openEditModal(sprint)}
                              className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all text-sm font-medium"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => openDeleteConfirm(sprint)}
                              className="flex-1 sm:flex-none px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all text-sm font-medium"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Auto Create Next Sprint Modal */}
      {showAutoCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-border rounded-2xl p-4 w-full max-w-sm mx-4 max-h-[90vh] overflow-y-auto shadow-xl"
          >
            <h3 className="text-xl font-bold text-textPrimary mb-2">Create Next Sprint</h3>
            <p className="text-sm text-textSecondary mb-4">
              Current sprint is fully complete. Enter a name to create the next sprint for remaining tasks.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-textPrimary mb-1">Sprint Name</label>
                <input
                  type="text"
                  value={autoCreateFormData.name}
                  onChange={(e) => setAutoCreateFormData({ ...autoCreateFormData, name: e.target.value })}
                  className="w-full bg-surface border border-border rounded-lg p-3 text-textPrimary focus:outline-none focus:border-primary"
                  placeholder="Enter next sprint name"
                />
              </div>
              <div>
                <label className="block text-textPrimary mb-1">Start Date</label>
                <input
                  type="date"
                  value={autoCreateFormData.start_date}
                  disabled
                  className="w-full bg-surface border border-border rounded-lg p-3 text-textPrimary cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-textPrimary mb-1">End Date</label>
                <input
                  type="date"
                  value={autoCreateFormData.end_date}
                  disabled
                  className="w-full bg-surface border border-border rounded-lg p-3 text-textPrimary cursor-not-allowed"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button
                onClick={() => setShowAutoCreateModal(false)}
                className="flex-1 px-4 py-2 border border-border text-textSecondary rounded-lg hover:bg-surface transition-all"
                disabled={isAutoCreatingSprint}
              >
                Cancel
              </button>
              <button
                onClick={handleAutoCreateNextSprint}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryDark transition-all disabled:opacity-60"
                disabled={isAutoCreatingSprint}
              >
                {isAutoCreatingSprint ? 'Creating...' : 'Create Next Sprint'}
              </button>
            </div>
          </motion.div>
        </div>
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
                  onChange={(e) => {
                    const startDate = e.target.value;
                    const endDate = addDaysToDateString(startDate, 14); // Auto-set end date to 14 days later
                    setCreateFormData({...createFormData, start_date: startDate, end_date: endDate});
                  }}
                  min={toInputDate(new Date())} // Today onwards
                  className="w-full bg-surface border border-border rounded-lg p-3 text-textPrimary focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-textPrimary mb-1">End Date</label>
                <input
                  type="date"
                  value={createFormData.end_date}
                  onChange={(e) => setCreateFormData({...createFormData, end_date: e.target.value})}
                  min={createFormData.start_date || undefined}
                  max={getMaxSprintEndDate(createFormData.start_date) || undefined}
                  disabled={!createFormData.start_date}
                  className="w-full bg-surface border border-border rounded-lg p-3 text-textPrimary focus:outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                />
                <p className="mt-1 text-xs text-textSecondary">
                  Auto-set to 2 weeks after start date. Sprint length cannot exceed {MAX_SPRINT_DURATION_DAYS} days.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setProjectSprints([]); // Clear project sprints when modal closes
                  setCreateFormData({
                    workspace_id: '',
                    project_id: '',
                    name: '',
                    goal: '',
                    start_date: '',
                    end_date: ''
                  });
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

      {/* Edit Sprint Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-border rounded-2xl p-4 w-full max-w-sm mx-4 max-h-[90vh] overflow-y-auto shadow-xl"
          >
            <h3 className="text-xl font-bold text-textPrimary mb-4">Edit Sprint</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-textPrimary mb-1">Sprint Name</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  className="w-full bg-surface border border-border rounded-lg p-3 text-textPrimary focus:outline-none focus:border-primary"
                  placeholder="Enter sprint name"
                />
              </div>
              <div>
                <label className="block text-textPrimary mb-1">Sprint Goal</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                  className="w-full bg-surface border border-border rounded-lg p-3 text-textPrimary focus:outline-none focus:border-primary h-20 resize-none"
                  placeholder="Enter sprint goal"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingSprintId(null);
                  setEditFormData({ name: '', description: '' });
                }}
                className="flex-1 px-4 py-2 border border-border text-textSecondary rounded-lg hover:bg-surface transition-all"
                disabled={isEditingSprint}
              >
                Cancel
              </button>
              <button
                onClick={handleEditSprint}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryDark transition-all disabled:opacity-60"
                disabled={isEditingSprint}
              >
                {isEditingSprint ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Sprint Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-border rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl"
          >
            <h3 className="text-xl font-bold text-textPrimary mb-4">Delete Sprint</h3>
            <p className="text-textSecondary mb-6">
              Are you sure you want to delete this sprint? This action cannot be undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingSprintId(null);
                }}
                className="flex-1 px-4 py-2 border border-border text-textSecondary rounded-lg hover:bg-surface transition-all"
                disabled={isDeletingSprint}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSprint}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-60"
                disabled={isDeletingSprint}
              >
                {isDeletingSprint ? 'Deleting...' : 'Delete Sprint'}
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