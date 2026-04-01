import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { LOGIN_ENDPOINTS, apiRequest } from "../../config/api";

const normalizeDelayType = (type) => {
  const raw = String(type || "").toUpperCase();
  if (raw === "DIRECT") return "direct";
  return "cascading";
};

const statusClass = {
  PENDING: "bg-yellow-400 text-slate-900 border border-yellow-300",
  ACTIVE: "bg-blue-500 text-white border border-blue-400",
  COMPLETED: "bg-green-500 text-white border border-green-400",
};

export default function DelayAlerts() {
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [delayedTasks, setDelayedTasks] = useState([]);
  const [summary, setSummary] = useState({ taskCount: 0, delayedCount: 0 });
  const [loading, setLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [error, setError] = useState("");
  const [filterRisk, setFilterRisk] = useState("all");
  const autoRefreshTimerRef = useRef(null);

  const clearAutoRefreshTimer = useCallback(() => {
    if (autoRefreshTimerRef.current) {
      clearTimeout(autoRefreshTimerRef.current);
      autoRefreshTimerRef.current = null;
    }
  }, []);

  const extractArray = (payload, key) => {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload[key])) return payload[key];
    if (payload && payload.data && Array.isArray(payload.data[key])) return payload.data[key];
    if (payload && key === "items" && payload.data && Array.isArray(payload.data)) return payload.data;
    return [];
  };

  const fetchProjects = useCallback(async () => {
    try {
      setProjectsLoading(true);
      const response = await apiRequest(LOGIN_ENDPOINTS.delayAlerts.getProjects);
      const projectList = extractArray(response, "data");
      setProjects(projectList);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load projects");
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  const hydrateDelayData = useCallback(async (projectId, options = {}) => {
    const { showSpinner = true } = options;

    if (!projectId) {
      setLoading(false);
      setDelayedTasks([]);
      setSummary({ taskCount: 0, delayedCount: 0 });
      return;
    }

    try {
      if (showSpinner) setLoading(true);
      setError("");

      const contextRaw = await apiRequest(
        LOGIN_ENDPOINTS.delayAlerts.getProjectContext(projectId)
      );
      const context = contextRaw?.data || contextRaw || {};

      const alertsRaw = await apiRequest(
        LOGIN_ENDPOINTS.delayAlerts.listAlerts(projectId, true)
      );

      const tasks = extractArray(context, "tasks");
      const alerts = extractArray(alertsRaw, "items");
      const taskById = new Map(tasks.map((task) => [Number(task.taskId), task]));

      const activeAlertByTask = new Map();
      alerts.forEach((alert) => {
        const taskId = Number(alert.taskId);
        const existing = activeAlertByTask.get(taskId);
        if (!existing || Number(alert.severity || 0) > Number(existing.severity || 0)) {
          activeAlertByTask.set(taskId, alert);
        }
      });

      const delayed = tasks
        .filter((task) => task.isDelayed)
        .map((task) => {
          const alert = activeAlertByTask.get(Number(task.taskId));
          const directCauseTask = taskById.get(Number(alert?.sourceTaskId));
          const rootCauseTask = taskById.get(Number(task.rootCauseTaskId));
          const due = task.dueDate ? new Date(task.dueDate) : null;
          const dependencyChainTitles = Array.isArray(task.dependencyChain)
            ? task.dependencyChain
                .map((id) => taskById.get(Number(id))?.title)
                .filter(Boolean)
            : [];
          const reasonText = directCauseTask?.title
            ? `Blocked by ${directCauseTask.title}`
            : rootCauseTask?.title
              ? `Blocked by ${rootCauseTask.title}`
              : "Blocked by upstream dependency";

          return {
            taskId: Number(task.taskId),
            projectId: String(task.projectId || projectId),
            taskTitle: task.title || `Task ${task.taskId}`,
            subtasks: task.subtasks || "",
            status: task.status || "PENDING",
            dueDate: due,
            delayType: normalizeDelayType(alert?.type),
            reason: reasonText,
            directCause: directCauseTask
              ? {
                  taskTitle: directCauseTask.title,
                }
              : null,
            rootCause: rootCauseTask
              ? {
                  taskTitle: rootCauseTask.title,
                }
              : null,
            cascadeChain: dependencyChainTitles,
          };
        });

      setDelayedTasks(delayed);
      setSummary({
        taskCount: Number(context?.summary?.taskCount || tasks.length || 0),
        delayedCount: Number(context?.summary?.delayedCount || delayed.length || 0),
      });
    } catch (err) {
      setDelayedTasks([]);
      setSummary({ taskCount: 0, delayedCount: 0 });
      setError(err.message || "Failed to load delay alerts");
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, []);

  const scheduleAutoRefresh = useCallback(
    (projectId, attemptsLeft = 3) => {
      clearAutoRefreshTimer();
      if (!projectId || attemptsLeft <= 0) return;

      autoRefreshTimerRef.current = setTimeout(async () => {
        await hydrateDelayData(projectId, { showSpinner: false });
        scheduleAutoRefresh(projectId, attemptsLeft - 1);
      }, 3000);
    },
    [hydrateDelayData]
  );

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    return () => {
      clearAutoRefreshTimer();
    };
  }, [clearAutoRefreshTimer]);

  useEffect(() => {
    if (!selectedProject) {
      setLoading(false);
      return;
    }

    hydrateDelayData(selectedProject.projectId, { showSpinner: true });
  }, [selectedProject, hydrateDelayData]);

  const filteredTasks = useMemo(() => {
    if (filterRisk === "all") return delayedTasks;
    if (filterRisk === "direct") {
      return delayedTasks.filter((task) => task.delayType === "direct");
    }
    return delayedTasks.filter((task) => task.delayType !== "direct");
  }, [delayedTasks, filterRisk]);

  const runDelayEngine = async () => {
    try {
      setRecalculating(true);
      await apiRequest(LOGIN_ENDPOINTS.delayAlerts.runEngine, { method: "POST", body: "{}" });
      await hydrateDelayData(selectedProject.projectId, { showSpinner: false });
      scheduleAutoRefresh(selectedProject.projectId, 3);
    } catch (err) {
      setError(err.message || "Failed to recalculate delay alerts");
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 px-4 py-6"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-3xl font-bold text-textPrimary mb-1">Delay Alerts</h2>
          <p className="text-textSecondary">
            {selectedProject ? `Direct and cascading delay risks for ${selectedProject.projectName}` : "Select a project to view delay alerts"}
          </p>
        </div>
        {selectedProject && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedProject(null)}
              className="bg-surface hover:bg-surfaceLight border border-primary/30 text-textPrimary px-4 py-2 rounded-lg transition-colors"
            >
              ← Back to Projects
            </button>
            <button
              type="button"
              onClick={runDelayEngine}
              disabled={recalculating}
              className="bg-primary hover:bg-primaryLight disabled:opacity-60 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
            >
              {recalculating ? "Recalculating..." : "Recalculate Delays"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-red-200">{error}</div>
      )}

      {!selectedProject ? (
        // PROJECT GRID VIEW
        <>
          {projectsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-4"></div>
                <p className="text-textSecondary">Loading projects...</p>
              </div>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex items-center justify-center h-64 bg-gradient-to-br from-surface/50 to-surfaceLight/50 rounded-xl border border-primary/10">
              <div className="text-center">
                <div className="text-5xl mb-3">📭</div>
                <h3 className="text-xl font-semibold text-textPrimary mb-1">No Projects Found</h3>
                <p className="text-textSecondary">You don't have access to any projects yet</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project, index) => (
                <motion.div
                  key={project.projectId}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedProject(project)}
                  className={`cursor-pointer rounded-lg border-2 p-5 transition-all hover:shadow-lg ${
                    project.delayedTaskCount > 0
                      ? "bg-gradient-to-br from-red-500/5 to-red-500/10 border-red-500/30 hover:border-red-500/60"
                      : "bg-gradient-to-br from-surface to-surfaceLight border-primary/20 hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-textPrimary">{project.projectName}</h3>
                      {project.description && (
                        <p className="text-sm text-textSecondary mt-1 line-clamp-2">{project.description}</p>
                      )}
                    </div>
                    {project.delayedTaskCount > 0 && (
                      <div className="bg-red-600 text-white border border-red-500 shadow-sm px-3 py-1 rounded-full text-sm font-semibold">
                        {project.delayedTaskCount} 🚨
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="bg-primary/10 rounded-lg p-3">
                      <p className="text-xs text-textSecondary">Total Tasks</p>
                      <p className="text-lg font-bold text-primary">{project.taskCount}</p>
                    </div>
                    <div className={`rounded-lg p-3 ${project.delayedTaskCount > 0 ? "bg-red-100 border border-red-300" : "bg-green-500/10"}`}>
                      <p className="text-xs text-textSecondary">Delayed</p>
                      <p className={`text-lg font-bold ${project.delayedTaskCount > 0 ? "text-red-700" : "text-green-400"}`}>
                        {project.delayedTaskCount}
                      </p>
                    </div>
                  </div>

                  {project.lastDelay && (
                    <p className="text-xs text-textSecondary mt-3">Most recent delay detected: {project.lastDelay}</p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </>
      ) : (
        // PROJECT DETAILS VIEW
        <>
          <div className="flex gap-2">
            <label className="block text-sm font-medium text-textSecondary mb-2">Filter by Type</label>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="bg-surface border border-primary/30 rounded-lg px-4 py-2 text-textPrimary focus:outline-none focus:border-primary"
            >
              <option value="all">All Delays</option>
              <option value="direct">Direct Delays</option>
              <option value="cascading">Cascading Delays</option>
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto mb-4"></div>
                <p className="text-textSecondary">Loading delay alerts...</p>
              </div>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex items-center justify-center h-64 bg-gradient-to-br from-surface/50 to-surfaceLight/50 rounded-xl border border-primary/10">
              <div className="text-center">
                <div className="text-5xl mb-3">✅</div>
                <h3 className="text-xl font-semibold text-textPrimary mb-1">No Delays In This Project</h3>
                <p className="text-textSecondary">No delayed tasks found for {selectedProject.projectName}.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map((task, index) => (
                <motion.div
                  key={task.taskId}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="bg-gradient-to-r from-surface to-surfaceLight border border-primary/20 rounded-lg p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            task.delayType === "direct"
                              ? "bg-red-600 text-white border border-red-500"
                              : "bg-orange-500 text-white border border-orange-400"
                          }`}
                        >
                          {task.delayType === "direct" ? "DIRECT" : "CASCADING"}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            statusClass[task.status] || "bg-slate-600 text-white border border-slate-500"
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-textPrimary">{task.taskTitle}</h3>
                      {task.subtasks ? <p className="text-sm text-textSecondary">{task.subtasks}</p> : null}
                      <p className="text-sm text-textSecondary">Reason: {task.reason}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-textSecondary">Due Date</p>
                      <p className="text-sm font-medium text-textPrimary">
                        {task.dueDate ? task.dueDate.toLocaleDateString() : "No deadline"}
                      </p>
                    </div>
                  </div>

                  {task.delayType !== "direct" ? (
                    <div className="mt-4 bg-orange-500/10 border border-orange-500/25 rounded-lg p-3">
                      <p className="text-xs text-textSecondary mb-1">Direct Delay Source</p>
                      <p className="text-sm text-textPrimary">
                        {task.directCause
                          ? task.directCause.taskTitle
                          : "Not provided"}
                      </p>

                      <p className="text-xs text-textSecondary mt-3 mb-1">Root Cause</p>
                      <p className="text-sm text-textPrimary">
                        {task.rootCause
                          ? task.rootCause.taskTitle
                          : "Not provided"}
                      </p>

                      <p className="text-xs text-textSecondary mt-3 mb-1">Dependency Chain</p>
                      <p className="text-sm text-textPrimary">
                        {task.cascadeChain.length > 0
                          ? task.cascadeChain.join(" <- ")
                          : "No chain available"}
                      </p>
                    </div>
                  ) : null}
                </motion.div>
              ))}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                  <p className="text-textSecondary text-sm mb-1">Total Tasks</p>
                  <p className="text-2xl font-bold text-primary">{summary.taskCount}</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-textSecondary text-sm mb-1">Delayed Tasks</p>
                  <p className="text-2xl font-bold text-red-400">{summary.delayedCount}</p>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4">
                  <p className="text-textSecondary text-sm mb-1">Shown (Filtered)</p>
                  <p className="text-2xl font-bold text-orange-400">{filteredTasks.length}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
