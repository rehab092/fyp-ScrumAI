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
  const [assignmentDialog, setAssignmentDialog] = useState(null);
  const [selectedDeveloperByTask, setSelectedDeveloperByTask] = useState({});
  const [assignmentSaving, setAssignmentSaving] = useState(false);

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
        setSprints(response.sprints || []);
        setSelectedSprint(null);
        setCurrentSprintTasks([]);
        setSuggestions([]);
        setTeamWorkloadSummary(null);
        setPlanAlert("");
      } catch (err) {
        console.error("Error fetching sprints:", err);
        setErrorMessage("Failed to load sprints");
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
    const fallbackId = task.recommended_developer?.developer_id || task.suggested_developer?.id || null;
    const selectedId = selectedDeveloperByTask[task.task_id] || fallbackId;
    return getDeveloperById(selectedId) || task.recommended_developer || task.suggested_developer || null;
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

  const handleOpenAssignmentDialog = (task, mode = "approve") => {
    const selectedDeveloper = getSelectedDeveloperForTask(task);
    setAssignmentDialog({
      task,
      mode,
      developerId: selectedDeveloper?.id || selectedDeveloper?.developer_id || "",
    });
  };

  const handleConfirmAssignment = async () => {
    if (!assignmentDialog?.task?.suggestion_id) {
      setErrorMessage("This sprint plan does not have a suggestion record to approve yet.");
      return;
    }

    try {
      setAssignmentSaving(true);
      setErrorMessage("");

      const action = assignmentDialog.mode === "manual" ? "change_developer" : "approve";
      const response = await handleApproveSuggestion(
        assignmentDialog.task.suggestion_id,
        action,
        assignmentDialog.developerId || null
      );

      if (!response?.success) {
        return;
      }

      if (response.approval_workflow_id) {
        const notifyResponse = await apiRequest(LOGIN_ENDPOINTS.taskAllocation.notifyDeveloper, {
          method: "POST",
          body: JSON.stringify({ approval_workflow_id: response.approval_workflow_id }),
        });

        if (!notifyResponse.success) {
          setErrorMessage(notifyResponse.error || "Assignment approved, but notification failed");
          return;
        }
      }

      setSuccessMessage("Developer will be notified about this task.");
      setTimeout(() => setSuccessMessage(""), 2500);
      setAssignmentDialog(null);
      await refreshAssignmentBoard();
      setBoardTab("assigned");
    } catch (err) {
      console.error("Error confirming assignment:", err);
      setErrorMessage(err.message || "Failed to assign task");
    } finally {
      setAssignmentSaving(false);
    }
  };

  const formatBoardItem = (item) => ({
    ...item,
    required_skills: asArray(item.required_skills),
    estimated_hours: toNumber(item.estimated_hours),
    task_title: item.task_title || "Untitled Task",
    task_description: item.task_description || "",
  });

  const renderAssignmentCard = (rawTask, index, bucketName = getWorkflowBucket(rawTask)) => {
    const task = formatBoardItem(rawTask);
    const dev = getSelectedDeveloperForTask(task);
    const devSummary = summarizeDeveloperForTask(task, dev);
    const skills = asArray(task.required_skills);
    const workflowStatus = task.workflow_status || task.status || "PENDING";
    const isPlanBucket = bucketName === "plan";
    const isAssignedBucket = bucketName === "assigned";

    return (
      <div key={task.task_id || index} className="p-4 rounded-lg border border-border bg-surface/40">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <p className="font-semibold text-textPrimary">{task.task_title || "Untitled Task"}</p>
              <span className="text-xs px-2 py-1 rounded bg-info/15 text-info">{toNumber(task.estimated_hours)}h</span>
              <span className="text-xs px-2 py-1 rounded bg-primary/15 text-primary font-medium">{workflowStatus}</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {skills.slice(0, 4).map((skill, skillIndex) => (
                <span key={skillIndex} className="text-xs px-2 py-1 rounded bg-white border border-border text-textMuted">
                  {skill}
                </span>
              ))}
            </div>
            <p className="text-xs text-textMuted">{task.reasoning?.reason || "Planned automatically"}</p>
          </div>

          <div className={`min-w-[240px] rounded-lg border p-3 ${dev ? "bg-success/5 border-success/20" : "bg-warning/10 border-warning/30"}`}>
            {dev ? (
              <>
                <p className="text-xs font-bold text-textMuted mb-1">Assign to</p>
                <p className="font-bold text-textPrimary">{devSummary.name}</p>
                <p className="text-xs text-textMuted mb-2">{devSummary.email}</p>
                <div className="flex flex-wrap gap-2 text-xs mb-2">
                  <span className="px-2 py-1 rounded bg-success/20 text-success font-bold">
                    {devSummary.skillMatch}% match
                  </span>
                  <span className="px-2 py-1 rounded bg-info/15 text-info font-medium">
                    {devSummary.availableHours}h free
                  </span>
                </div>
                <p className="text-xs text-textMuted">{task.reasoning?.reason || "Smart assignment"}</p>
                {isPlanBucket && (
                <div className="mt-3">
                  <label className="block text-[11px] font-semibold text-textMuted mb-1">Manual developer change</label>
                  <select
                    className="w-full px-3 py-2 rounded border border-border bg-white text-sm text-textPrimary"
                    value={selectedDeveloperByTask[task.task_id] || dev?.developer_id || dev?.id || ""}
                    onChange={(e) => setSelectedDeveloperByTask((current) => ({ ...current, [task.task_id]: e.target.value }))}
                  >
                    <option value="">Keep recommended developer</option>
                    {teamMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} - {toNumber(member.capacityHours || 40)}h/week
                      </option>
                    ))}
                  </select>
                </div>
                )}
              </>
            ) : (
              <>
                <p className="text-xs font-bold text-warning mb-1">No developer available</p>
                <p className="text-xs text-textMuted">All developers are occupied for this sprint.</p>
              </>
            )}
          </div>
        </div>

        {dev && isPlanBucket && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => handleOpenAssignmentDialog(task, "approve")}
              className="px-3 py-2 rounded bg-success text-white text-sm font-medium"
            >
              Assign & Notify
            </button>
            <button
              onClick={() => handleOpenAssignmentDialog(task, "manual")}
              className="px-3 py-2 rounded border border-border bg-white text-sm font-medium text-textPrimary"
            >
              Manual Change
            </button>
          </div>
        )}

        {isAssignedBucket && workflowStatus !== "DEV_PENDING" && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => handleNotifyDeveloper(task.approval_workflow_id)}
              className="px-3 py-2 rounded bg-primary text-white text-sm font-medium"
            >
              Notify Developer
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {successMessage && <div className="bg-success/10 border border-success/30 text-success px-4 py-3 rounded-lg">{successMessage}</div>}
      {errorMessage && <div className="bg-error/10 border border-error/30 text-error px-4 py-3 rounded-lg">{errorMessage}</div>}

      {assignmentDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-border p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-textPrimary mb-2">Confirm assignment</h3>
            <p className="text-sm text-textMuted mb-4">
              The selected developer will be notified about this task. After acceptance, the task status will move to in progress.
            </p>

            <div className="mb-4 rounded-lg border border-border bg-surface/50 p-3">
              <p className="text-sm font-semibold text-textPrimary">{assignmentDialog.task?.task_title || "Untitled Task"}</p>
              <p className="text-xs text-textMuted">{toNumber(assignmentDialog.task?.estimated_hours)} hours</p>
            </div>

            <label className="block text-sm font-medium text-textMuted mb-2">Developer</label>
            <select
              className="w-full px-3 py-2 rounded border border-border bg-white text-textPrimary mb-4"
              value={assignmentDialog.developerId || ""}
              onChange={(e) => setAssignmentDialog((current) => ({ ...current, developerId: e.target.value }))}
            >
              <option value="">Select developer</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} - {toNumber(member.capacityHours || 40)}h/week
                </option>
              ))}
            </select>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setAssignmentDialog(null)}
                className="px-4 py-2 rounded border border-border bg-white text-sm font-medium text-textPrimary"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssignment}
                disabled={assignmentSaving || !assignmentDialog.developerId}
                className="px-4 py-2 rounded bg-primary text-white text-sm font-medium disabled:opacity-50"
              >
                {assignmentSaving ? "Assigning..." : "Assign & Notify"}
              </button>
            </div>
          </div>
        </div>
      )}

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
            <span>{(selectedSprint.required_skills || []).length || 0} skills</span>
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

