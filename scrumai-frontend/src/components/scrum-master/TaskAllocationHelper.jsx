import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { LOGIN_ENDPOINTS, apiRequest } from "../../config/api";

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [];
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function TaskAllocationHelper() {
  const [viewMode, setViewMode] = useState("suggestions");
  const [boardTab, setBoardTab] = useState("plan");
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedSprint, setSelectedSprint] = useState(null);
  const [currentSprintTasks, setCurrentSprintTasks] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [teamWorkloadSummary, setTeamWorkloadSummary] = useState(null);
  const [planAlert, setPlanAlert] = useState("");
  const [boardLoading, setBoardLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [sprintsLoading, setSprintsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedDeveloperByTask, setSelectedDeveloperByTask] = useState({});
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [expandedDropdowns, setExpandedDropdowns] = useState({});

  const getWorkflowBucket = (item) => {
    const workflowStatus = item.workflow_status || item.status || "PENDING";

    if (workflowStatus === "ACTIVE" || workflowStatus === "DEV_ACCEPTED") {
      return "inProgress";
    }

    if (workflowStatus === "DEV_PENDING" || workflowStatus === "SM_APPROVED" || workflowStatus === "MANUALLY_CHANGED") {
      return "assigned";
    }

    return "plan";
  };

  const getBoardBuckets = (items) => {
    const buckets = { plan: [], assigned: [], inProgress: [] };

    items.forEach((item) => {
      buckets[getWorkflowBucket(item)].push(item);
    });

    return buckets;
  };

  const refreshAssignmentBoard = async (sprintId = selectedSprint?.sprint_id) => {
    if (!sprintId) return;

    try {
      setBoardLoading(true);
      const response = await apiRequest(
        `${LOGIN_ENDPOINTS.taskAllocation.listSuggestions}?sprint_id=${sprintId}&status=ALL`,
        { method: "GET" }
      );

      const items = Array.isArray(response.suggestions) ? response.suggestions : [];
      setSuggestions(items);
      setPlanAlert("");
    } catch (err) {
      console.error("Error loading assignment board:", err);
      setErrorMessage(err.message || "Failed to load assignment board");
    } finally {
      setBoardLoading(false);
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setProjectsLoading(true);
        const response = await apiRequest(LOGIN_ENDPOINTS.taskAllocation.getProjectsByWorkspace, { method: "GET" });
        setProjects(response.projects || []);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setErrorMessage("Failed to load projects");
      } finally {
        setProjectsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    const fetchSprints = async () => {
      if (!selectedProject) {
        setSprints([]);
        setSelectedSprint(null);
        setCurrentSprintTasks([]);
        return;
      }

      try {
        setSprintsLoading(true);
        const response = await apiRequest(
          `${LOGIN_ENDPOINTS.taskAllocation.getAvailableSprints}?project_id=${selectedProject}`,
          { method: "GET" }
        );
        console.log("Sprints API Response:", response);
        setSprints(response.sprints || []);
        if (!response.sprints || response.sprints.length === 0) {
          setErrorMessage(`No sprints found for project ${selectedProject}. Please create a sprint in Sprint Management first.`);
        } else {
          setErrorMessage("");
        }
        setSelectedSprint(null);
        setCurrentSprintTasks([]);
        setSuggestions([]);
        setTeamWorkloadSummary(null);
        setPlanAlert("");
      } catch (err) {
        console.error("Error fetching sprints:", err);
        setErrorMessage(err.message || "Failed to load sprints. Check console for details.");
        setSprints([]);
      } finally {
        setSprintsLoading(false);
      }
    };

    fetchSprints();
  }, [selectedProject]);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await apiRequest(LOGIN_ENDPOINTS.team.getAll, { method: "GET" });
        setTeamMembers(Array.isArray(response) ? response : []);
      } catch (err) {
        console.error("Error fetching team members:", err);
      }
    };

    fetchTeamMembers();
  }, []);

  const handleSprintSelect = (sprint) => {
    setSelectedSprint(sprint);
    setCurrentSprintTasks(Array.isArray(sprint.tasks) ? sprint.tasks : []);
    setSuggestions([]);
    setTeamWorkloadSummary(null);
    setPlanAlert("");
    setSelectedDeveloperByTask({});
    setBoardTab("plan");
  };

  const getDeveloperById = (developerId) => teamMembers.find((member) => String(member.id) === String(developerId)) || null;

  const getTaskRequiredSkills = (task) => asArray(task.required_skills || task.skills_required);

  const getDeveloperSkills = (developer) => asArray(developer?.skills);

  const getSelectedDeveloperForTask = (task) => {
    // Option A: Get selected developer from candidates list
    const selectedId = selectedDeveloperByTask[task.task_id];
    if (selectedId) {
      return getDeveloperById(selectedId);
    }
    
    // Fallback to recommended_developer if exists (backward compatibility)
    if (task.recommended_developer?.developer_id) {
      return getDeveloperById(task.recommended_developer.developer_id);
    }
    
    // No selected developer yet
    return null;
  };

  const getCandidateDevelopers = (task) => {
    // Option A: Return all candidate developers with reasoning
    return Array.isArray(task.candidate_developers) ? task.candidate_developers : [];
  };

  const summarizeDeveloperForTask = (task, developer) => {
    if (!developer) {
      return {
        name: "No developer available",
        email: "",
        skillMatch: 0,
        availableHours: 0,
        skills: [],
      };
    }

    const requiredSkills = getTaskRequiredSkills(task);
    const developerSkills = getDeveloperSkills(developer);
    const overlap = requiredSkills.filter((skill) => developerSkills.some((developerSkill) => developerSkill.toLowerCase() === skill.toLowerCase()));
    const skillMatch = requiredSkills.length ? Math.round((overlap.length / requiredSkills.length) * 100) : 100;
    const weeklyCapacity = toNumber(developer.capacityHours || developer.capacity_hours || 40);
    const assignedHours = toNumber(developer.assignedHours || developer.assigned_hours || 0);
    const sprintWeeks = 2;
    const availableHours = Math.max(0, weeklyCapacity * sprintWeeks - assignedHours);

    return {
      name: developer.name || developer.developer_name || "Developer",
      email: developer.email || "",
      skillMatch,
      availableHours,
      skills: developerSkills,
    };
  };

  const handleGenerateSuggestions = async () => {
    if (!selectedProject || !selectedSprint) {
      setErrorMessage("Please select a project and sprint first");
      return;
    }

    try {
      setSuggestionsLoading(true);
      setErrorMessage("");
      const response = await apiRequest(LOGIN_ENDPOINTS.taskAllocation.generateSuggestions, {
        method: "POST",
        body: JSON.stringify({ sprint_id: selectedSprint.sprint_id, recompute: true }),
      });

      if (response.success) {
        const plan = Array.isArray(response.assignment_plan) ? response.assignment_plan : Array.isArray(response.suggestions) ? response.suggestions : [];
        setTeamWorkloadSummary(response.team_workload_summary || null);
        setPlanAlert(response.alert_message || "");
        await refreshAssignmentBoard(selectedSprint.sprint_id);
        setViewMode("board");
        setBoardTab("plan");
        setSuccessMessage(`Generated ${plan.length} assignments`);
        setTimeout(() => setSuccessMessage(""), 2500);
      } else {
        setErrorMessage(response.error || "Failed to generate suggestions");
      }
    } catch (err) {
      console.error("Error generating suggestions:", err);
      setErrorMessage(err.message || "Failed to generate suggestions");
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleApproveSuggestion = async (suggestionId, action, newDeveloperId = null) => {
    try {
      const response = await apiRequest(LOGIN_ENDPOINTS.taskAllocation.approveSuggestion(suggestionId), {
        method: "POST",
        body: JSON.stringify({ action, new_developer_id: newDeveloperId, reason: "Scrum Master review" }),
      });

      if (response.success) {
        await refreshAssignmentBoard();
        return response;
      }
    } catch (err) {
      console.error("Error approving suggestion:", err);
      setErrorMessage(`Failed to ${action} suggestion`);
    }

    return null;
  };

  const handleNotifyDeveloper = async (approvalWorkflowId) => {
    if (!approvalWorkflowId) {
      setErrorMessage("Missing approval workflow id for notification");
      return null;
    }

    try {
      const response = await apiRequest(LOGIN_ENDPOINTS.taskAllocation.notifyDeveloper, {
        method: "POST",
        body: JSON.stringify({ approval_workflow_id: approvalWorkflowId }),
      });

      if (response.success) {
        await refreshAssignmentBoard();
        return response;
      }
    } catch (err) {
      console.error("Error notifying developer:", err);
      setErrorMessage(err.message || "Failed to notify developer");
    }

    return null;
  };

  const handleDirectAssignAndNotify = async (task, developerId) => {
    if (!developerId) {
      setErrorMessage("Please select a developer first");
      return;
    }

    try {
      setAssignmentSaving(true);
      setErrorMessage("");

      // Approve/assign the suggestion with selected developer
      const response = await handleApproveSuggestion(
        task.suggestion_id,
        "approve",
        developerId
      );

      if (!response?.success) {
        setAssignmentSaving(false);
        return;
      }

      if (response.approval_workflow_id) {
        // Notify developer
        const notifyResponse = await apiRequest(LOGIN_ENDPOINTS.taskAllocation.notifyDeveloper, {
          method: "POST",
          body: JSON.stringify({ approval_workflow_id: response.approval_workflow_id }),
        });

        if (!notifyResponse.success) {
          setErrorMessage(notifyResponse.error || "Assignment approved, but notification failed");
          setAssignmentSaving(false);
          return;
        }
      }

      setSuccessMessage("Developer assigned and notified successfully!");
      setTimeout(() => setSuccessMessage(""), 2500);
      await refreshAssignmentBoard();
      setBoardTab("assigned");
    } catch (err) {
      console.error("Error assigning task:", err);
      setErrorMessage(err.message || "Failed to assign task");
    } finally {
      setAssignmentSaving(false);
    }
  };

  const toggleDropdown = (taskId) => {
    setExpandedDropdowns((current) => ({
      ...current,
      [taskId]: !current[taskId],
    }));
  };

  const formatBoardItem = (item) => ({
    ...item,
    required_skills: asArray(item.required_skills),
    estimated_hours: toNumber(item.estimated_hours),
    task_title: item.task_title || "Untitled Task",
    task_description: item.task_description || "",
  });

  const renderAssignmentCard = (rawTask, index, bucketName = getWorkflowBucket(rawTask)) => {
    try {
      const task = formatBoardItem(rawTask);
      const candidates = getCandidateDevelopers(task);
      
      console.log("Rendering task:", task.task_id, "Candidates:", candidates);
      
      const selectedDeveloperId = selectedDeveloperByTask[task.task_id];
      
      // Get most relevant developer (top candidate)
      const mostRelevantDev = candidates[0] || null;
      
      // Get selected or most relevant developer
      let currentDev = null;
      if (selectedDeveloperId) {
        currentDev = candidates.find(c => String(c.id || c.developer_id) === String(selectedDeveloperId));
      }
      currentDev = currentDev || mostRelevantDev;
      
      // Check if current dev is manually selected (not the best match)
      const isManuallySelected = selectedDeveloperId && selectedDeveloperId !== (mostRelevantDev?.id || mostRelevantDev?.developer_id);
      
      const skills = asArray(task.required_skills);
      const workflowStatus = task.workflow_status || task.status || "PENDING";
      const isPlanBucket = bucketName === "plan";
      const isAssignedBucket = bucketName === "assigned";

    return (
      <div key={task.task_id || index} className="p-4 rounded-lg border border-border bg-white">
        {/* Task Details */}
        <div className="mb-4">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <p className="font-bold text-lg text-textPrimary">{task.task_title || "Untitled Task"}</p>
            <span className="text-xs px-2 py-1 rounded bg-info/15 text-info font-medium">{toNumber(task.estimated_hours)}h</span>
            <span className="text-xs px-2 py-1 rounded bg-primary/15 text-primary font-medium">{workflowStatus}</span>
          </div>
          
          {/* Required Skills */}
          <div className="flex flex-wrap gap-2">
            {skills.slice(0, 5).map((skill, skillIndex) => (
              <span key={skillIndex} className="text-xs px-2 py-1 rounded bg-surface border border-border text-textMuted">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Developer Selection */}
        {isPlanBucket && candidates && candidates.length > 0 && currentDev ? (
          <div className="space-y-3 border-t border-border pt-4">
            {/* Most Relevant Developer Card */}
            <div className="p-3 rounded-lg border-2 border-success bg-success/5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-bold text-sm text-textPrimary">{currentDev.name || currentDev.developer_name || "Unknown"}</p>
                  <p className="text-xs text-textMuted">{currentDev.email || "no-email"}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded text-white font-bold ${isManuallySelected ? 'bg-info' : 'bg-success'}`}>
                  {isManuallySelected ? 'Selected' : 'Best Match'}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700">
                  {currentDev.skill_match ?? 0}% skills
                </span>
                <span className="text-xs px-2 py-1 rounded bg-green-50 text-green-700">
                  {currentDev.available_hours ?? 0}h free
                </span>
                <span className="text-xs px-2 py-1 rounded bg-purple-50 text-purple-700">
                  {currentDev.utilization_percent ?? 0}% busy
                </span>
              </div>

              {/* Suitability Reasons - Show only matching (✓) and limit to skills + capacity */}
              {Array.isArray(currentDev.suitability_reasons) && currentDev.suitability_reasons.length > 0 && (
                <ul className="text-xs space-y-1 mb-2">
                  {currentDev.suitability_reasons
                    .filter(reason => reason && reason.startsWith('✓'))
                    .slice(0, 2)
                    .map((reason, ridx) => (
                      <li key={ridx} className="flex items-start gap-2 text-success">
                        <span className="flex-1">{reason?.substring(reason.indexOf(' ') + 1) || reason}</span>
                      </li>
                    ))}
                </ul>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleDirectAssignAndNotify(task, currentDev.id || currentDev.developer_id)}
                disabled={assignmentSaving}
                className="flex-1 px-3 py-2 rounded bg-success text-white text-sm font-bold hover:bg-success/90 disabled:opacity-50 transition-all"
              >
                {assignmentSaving ? "🔄 Assigning..." : "✓ Assign Task"}
              </button>

              <div className="relative">
                <button
                  onClick={() => toggleDropdown(task.task_id)}
                  className="px-3 py-2 rounded border border-border bg-white text-sm font-medium text-textPrimary hover:bg-surface transition-all"
                >
                  {expandedDropdowns[task.task_id] ? "✕ Close" : "⇅ Change Developer"}
                </button>

                {/* Dropdown Menu */}
                {expandedDropdowns[task.task_id] && candidates && candidates.length > 1 && (
                  <div className="absolute top-full right-0 mt-1 w-72 rounded-lg border border-border bg-white shadow-lg z-10 max-h-64 overflow-y-auto">
                    <div className="p-2 border-b border-border sticky top-0 bg-white">
                      <p className="text-xs font-bold text-textMuted">Other Relevant Developers:</p>
                    </div>
                    {candidates.slice(1).map((candidate, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setSelectedDeveloperByTask((current) => ({
                            ...current,
                            [task.task_id]: candidate.id || candidate.developer_id,
                          }));
                          toggleDropdown(task.task_id);
                        }}
                        className="w-full text-left p-3 hover:bg-surface transition-all border-b border-border/50 last:border-b-0"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div>
                            <p className="font-semibold text-sm text-textPrimary">{candidate.name || candidate.developer_name}</p>
                            <p className="text-xs text-textMuted">{candidate.email}</p>
                          </div>
                          <span className="text-xs px-2 py-1 rounded bg-info/15 text-info font-bold">
                            {candidate.overall_score?.toFixed(0) || 0}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-1 mb-1">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                            {candidate.skill_match || 0}%
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-700">
                            {candidate.available_hours || 0}h
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">
                            {candidate.utilization_percent || 0}%
                          </span>
                        </div>

                        {Array.isArray(candidate.suitability_reasons) && candidate.suitability_reasons.length > 0 && (
                          <ul className="text-xs space-y-0.5">
                            {candidate.suitability_reasons
                              .filter(reason => reason && reason.startsWith('✓'))
                              .slice(0, 2)
                              .map((reason, ridx) => (
                                <li key={ridx} className="flex items-start gap-1 text-success">
                                  <span className="flex-1 line-clamp-1">{reason?.substring(reason.indexOf(' ') + 1) || reason}</span>
                                </li>
                              ))}
                          </ul>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : isPlanBucket ? (
          <div className="mt-3 rounded-lg border p-3 bg-warning/10 border-warning/30">
            <p className="text-xs font-bold text-warning mb-1">No candidates available</p>
            <p className="text-xs text-textMuted">All developers are occupied for this sprint.</p>
          </div>
        ) : null}

        {/* Show assigned developer in other buckets */}
        {!isPlanBucket && currentDev && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs font-bold text-textMuted mb-2">Assigned to:</p>
            <div className="p-3 rounded-lg border border-success bg-success/5">
              <p className="font-bold text-sm text-textPrimary">{currentDev.name || currentDev.developer_name}</p>
              <p className="text-xs text-textMuted mb-2">{currentDev.email}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-1 rounded bg-success/20 text-success font-bold">{currentDev.skill_match}% match</span>
                <span className="px-2 py-1 rounded bg-info/15 text-info font-medium">{currentDev.available_hours}h available</span>
              </div>
            </div>
          </div>
        )}

        {isAssignedBucket && workflowStatus !== "DEV_PENDING" && (
          <div className="mt-4 pt-4 border-t border-border">
            <button
              onClick={() => handleNotifyDeveloper(task.approval_workflow_id)}
              className="w-full px-3 py-2 rounded bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-all"
            >
              📬 Notify Developer
            </button>
          </div>
        )}
      </div>
    );
    } catch (renderError) {
      console.error("Error rendering assignment card:", renderError, "Task:", rawTask);
      return (
        <div key={rawTask.task_id || index} className="p-4 rounded-lg border border-error bg-error/10">
          <p className="text-error font-bold">Error rendering task</p>
          <p className="text-xs text-textMuted">{rawTask.task_title || "Task"}</p>
          <p className="text-xs text-error mt-2">{renderError.message}</p>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      {successMessage && <div className="bg-success/10 border border-success/30 text-success px-4 py-3 rounded-lg">{successMessage}</div>}
      {errorMessage && <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg">{errorMessage}</div>}

      <div className="bg-white border border-border rounded-lg p-6">
        <h2 className="text-xl font-bold text-textPrimary mb-4">Sprint Task Allocation</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-textMuted mb-2">Project</label>
            {projectsLoading ? (
              <div className="px-3 py-2 border border-border rounded-lg bg-white text-textMuted text-sm">Loading projects...</div>
            ) : (
              <select
                value={selectedProject || ""}
                onChange={(e) => setSelectedProject(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-white text-textPrimary"
              >
                <option value="">Select Project</option>
                {projects.map((project) => (
                  <option key={project.project_id} value={project.project_id}>{project.project_name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-textMuted mb-2">Sprint</label>
            {!selectedProject ? (
              <div className="px-3 py-2 border border-border rounded-lg bg-gray-100 text-textMuted text-sm">Select a project first</div>
            ) : sprintsLoading ? (
              <div className="px-3 py-2 border border-border rounded-lg bg-white text-textMuted text-sm">Loading sprints...</div>
            ) : sprints.length === 0 ? (
              <div className="px-3 py-2 border border-error/20 rounded-lg bg-error/5 text-error text-sm">
                No sprints available - <a href="/sprint-management" className="underline">Create a sprint in Sprint Management</a>
              </div>
            ) : (
              <select
                value={selectedSprint?.sprint_id?.toString() || ""}
                onChange={(e) => {
                  const sprint = sprints.find((item) => item.sprint_id?.toString() === e.target.value);
                  if (sprint) handleSprintSelect(sprint);
                }}
                className="w-full px-3 py-2 border border-border rounded-lg bg-white text-textPrimary"
              >
                <option value="">Select Sprint</option>
                {sprints.map((sprint) => (
                  <option key={sprint.sprint_id} value={sprint.sprint_id?.toString()}>
                    {sprint.sprint_name} ({toNumber(sprint.total_tasks)} tasks)
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={handleGenerateSuggestions}
            disabled={!selectedProject || !selectedSprint || suggestionsLoading}
            className="px-4 py-2 rounded-lg bg-primary text-white disabled:opacity-50"
          >
            {suggestionsLoading ? "Generating..." : "Generate AI Suggestions"}
          </button>
          <button onClick={() => setViewMode("tasks")} className="px-4 py-2 rounded-lg border border-border">View Tasks ({currentSprintTasks.length})</button>
          <button onClick={() => setViewMode("team")} className="px-4 py-2 rounded-lg border border-border">Team Members ({teamMembers.length})</button>
          <button onClick={() => setViewMode("board")} className="px-4 py-2 rounded-lg border border-border">Assignment Board ({suggestions.length})</button>
        </div>
      </div>

      {selectedSprint && (
        <div className="bg-white border border-border rounded-lg p-5">
          <h3 className="text-lg font-bold text-primary mb-2">{selectedSprint.sprint_name}</h3>
          <p className="text-sm text-textPrimary mb-2"><strong>Goal:</strong> {selectedSprint.goal || "No goal set"}</p>
          <div className="flex flex-wrap gap-2 text-xs text-textMuted">
            <span>{toNumber(selectedSprint.total_tasks)} tasks</span>
          </div>
        </div>
      )}

      {viewMode === "tasks" && (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          {currentSprintTasks.length === 0 ? (
            <div className="p-8 text-center text-textMuted">No tasks in sprint</div>
          ) : (
            <div className="divide-y">
              {currentSprintTasks.map((task, idx) => (
                <div key={idx} className="p-5">
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <div>
                      <h3 className="font-semibold text-textPrimary">{task.task_title || "Untitled Task"}</h3>
                      <p className="text-sm text-textMuted">{task.description || "No description"}</p>
                    </div>
                    <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded font-bold">{toNumber(task.estimated_hours)}h</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {asArray(task.required_skills).map((skill, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded bg-secondary/20 text-secondary">{skill}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {viewMode === "team" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.map((member) => (
            <div key={member.id} className="bg-white border border-border rounded-lg p-4">
              <p className="font-semibold text-textPrimary">{member.name}</p>
              <p className="text-sm text-textMuted mb-2">{member.email}</p>
              <div className="flex flex-wrap gap-1">
                {asArray(member.skills).map((skill, i) => (
                  <span key={i} className="bg-success/20 text-success text-xs px-2 py-1 rounded">{skill}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {(viewMode === "board" || viewMode === "plan") && (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="flex flex-wrap gap-2 border-b border-border p-4">
            <button
              onClick={() => setBoardTab("plan")}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${boardTab === "plan" ? "bg-primary text-white" : "border border-border bg-white text-textPrimary"}`}
            >
              Plan ({getBoardBuckets(suggestions).plan.length})
            </button>
            <button
              onClick={() => setBoardTab("assigned")}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${boardTab === "assigned" ? "bg-primary text-white" : "border border-border bg-white text-textPrimary"}`}
            >
              Assigned & Notify ({getBoardBuckets(suggestions).assigned.length})
            </button>
            <button
              onClick={() => setBoardTab("inProgress")}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${boardTab === "inProgress" ? "bg-primary text-white" : "border border-border bg-white text-textPrimary"}`}
            >
              In Progress ({getBoardBuckets(suggestions).inProgress.length})
            </button>
          </div>

          {planAlert && <div className="m-4 p-4 rounded-lg border border-warning/30 bg-warning/10 text-warning text-sm font-medium">{planAlert}</div>}

          {boardLoading ? (
            <div className="p-8 text-center text-textMuted">Loading assignment board...</div>
          ) : (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="bg-surface rounded border border-border p-3">
                  <p className="text-textMuted text-xs">Plan</p>
                  <p className="font-bold text-textPrimary">{getBoardBuckets(suggestions).plan.length}</p>
                </div>
                <div className="bg-surface rounded border border-border p-3">
                  <p className="text-textMuted text-xs">Assigned / Notify</p>
                  <p className="font-bold text-textPrimary">{getBoardBuckets(suggestions).assigned.length}</p>
                </div>
                <div className="bg-surface rounded border border-border p-3">
                  <p className="text-textMuted text-xs">In Progress</p>
                  <p className="font-bold text-textPrimary">{getBoardBuckets(suggestions).inProgress.length}</p>
                </div>
              </div>

              {boardTab === "plan" && (
                <>
                  {getBoardBuckets(suggestions).plan.length === 0 ? (
                    <div className="p-8 text-center text-textMuted">
                      <p>No pending tasks in the plan</p>
                      <p className="text-sm">Generate suggestions or wait for new tasks.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getBoardBuckets(suggestions).plan.map((item, index) => renderAssignmentCard(item, index, "plan"))}
                    </div>
                  )}
                </>
              )}

              {boardTab === "assigned" && (
                <>
                  {getBoardBuckets(suggestions).assigned.length === 0 ? (
                    <div className="p-8 text-center text-textMuted">
                      <p>No assigned tasks yet</p>
                      <p className="text-sm">Approved tasks will appear here before or after notification.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getBoardBuckets(suggestions).assigned.map((item, index) => renderAssignmentCard(item, index, "assigned"))}
                    </div>
                  )}
                </>
              )}

              {boardTab === "inProgress" && (
                <>
                  {getBoardBuckets(suggestions).inProgress.length === 0 ? (
                    <div className="p-8 text-center text-textMuted">
                      <p>No tasks in progress</p>
                      <p className="text-sm">Developer-accepted tasks will appear here.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {getBoardBuckets(suggestions).inProgress.map((item, index) => renderAssignmentCard(item, index, "inProgress"))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

